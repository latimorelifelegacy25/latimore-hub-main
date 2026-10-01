import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from datetime import date
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse

spec = importlib.util.spec_from_file_location("collector", Path(__file__).parents[1] / "collect.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


class CollectorTests(unittest.TestCase):
    def test_window_crosses_year(self):
        self.assertEqual(c.date_range(date(2026, 1, 3), 14),
                         (date(2025, 12, 21), date(2026, 1, 3)))
        for days in (0, 91):
            with self.assertRaises(ValueError):
                c.date_range(date(2026, 1, 3), days)

    def test_location_validation(self):
        self.assertEqual(c.locations("locations/123,456\n123"), ["123", "456"])
        with self.assertRaises(ValueError):
            c.locations("../../invalid")

    def test_gbp_query(self):
        with patch.object(c, "request_json", return_value={}) as request:
            c.gbp_report("token", "123", date(2026, 1, 1), date(2026, 1, 14))
        query = parse_qs(urlparse(request.call_args.args[0]).query)
        self.assertEqual(query["dailyMetrics"], c.METRICS)
        self.assertEqual(query["dailyRange.end_date.day"], ["14"])

    def test_retry_and_redaction(self):
        error = HTTPError("https://example.com", 429, "secret-body", {}, None)
        with patch.object(c, "urlopen", side_effect=error) as request, patch.object(c.time, "sleep"):
            with self.assertRaisesRegex(RuntimeError, "HTTP 429") as caught:
                c.request_json("https://example.com")
        self.assertEqual(request.call_count, 5)
        self.assertNotIn("secret-body", str(caught.exception))

    def test_auth_failure_not_retried(self):
        error = HTTPError("https://example.com", 401, "secret", {}, None)
        with patch.object(c, "urlopen", side_effect=error) as request:
            with self.assertRaises(RuntimeError):
                c.request_json("https://example.com")
        self.assertEqual(request.call_count, 1)

    def test_snapshot_and_no_partial_publication(self):
        env = {"GA4_PROPERTY_ID": "123", "GBP_LOCATION_IDS": "456,789",
               "GOOGLE_CLIENT_ID": "client", "GOOGLE_CLIENT_SECRET": "secret",
               "GOOGLE_REFRESH_TOKEN": "refresh"}
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, env):
            output = Path(directory) / "reports"
            with patch.object(c, "request_json", side_effect=[{"access_token": "token"}, {}, {}, RuntimeError("failed")]):
                with self.assertRaises(RuntimeError):
                    c.collect(output, date(2026, 1, 14))
            self.assertFalse(output.exists())
            with patch.object(c, "request_json", side_effect=[{"access_token": "token"}, {}, {}, {}]):
                c.collect(output, date(2026, 1, 14))
            self.assertEqual((output / "latest.json").read_bytes(),
                             (output / "2026-01-14.json").read_bytes())
            self.assertNotIn("secret", (output / "latest.json").read_text())


if __name__ == "__main__":
    unittest.main()
