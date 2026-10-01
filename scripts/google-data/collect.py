"""Collect aggregate GA4 and Business Profile performance using stdlib only."""
import argparse
from datetime import date, datetime, timedelta
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

METRICS = [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS", "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS", "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_DIRECTION_REQUESTS", "CALL_CLICKS", "WEBSITE_CLICKS",
]


def request_json(url, *, token=None, payload=None, form=False):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if payload is not None:
        body = (urlencode(payload) if form else json.dumps(payload)).encode()
        headers["Content-Type"] = ("application/x-www-form-urlencoded" if form
                                   else "application/json")
    for attempt in range(5):
        try:
            with urlopen(Request(url, data=body, headers=headers), timeout=60) as response:
                return json.load(response)
        except HTTPError as error:
            # Never print response bodies, tokens, or credential-bearing requests.
            if error.code not in (429, 500, 502, 503, 504) or attempt == 4:
                raise RuntimeError(f"Google request failed (HTTP {error.code}); check API access, consent and quotas") from None
        except (URLError, TimeoutError):
            if attempt == 4:
                raise RuntimeError("Google request failed after network retries") from None
        time.sleep(2 ** attempt)


def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise ValueError(f"Missing configuration: {name}")
    return value


def locations(value):
    result = []
    for item in re.split(r"[,\s]+", value.strip()):
        item = item.removeprefix("locations/")
        if not re.fullmatch(r"[0-9]+", item):
            raise ValueError("GBP_LOCATION_IDS must contain numeric IDs or locations/ID")
        if item not in result:
            result.append(item)
    return result


def date_range(end, days):
    if not 1 <= days <= 90:
        raise ValueError("Lookback must be between 1 and 90 days")
    return end - timedelta(days=days - 1), end


def ga_report(token, property_id, start, end):
    return request_json(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport",
        token=token, payload={
            "dateRanges": [{"startDate": str(start), "endDate": str(end)}],
            "dimensions": [{"name": "date"}],
            "metrics": [{"name": name} for name in
                        ["activeUsers", "newUsers", "sessions", "engagedSessions",
                         "screenPageViews", "eventCount", "keyEvents", "totalRevenue"]],
            "orderBys": [{"dimension": {"dimensionName": "date"}}],
            "limit": "1000", "keepEmptyRows": True,
        })


def gbp_report(token, location, start, end):
    query = [("dailyMetrics", metric) for metric in METRICS]
    for name, value in [("start_date", start), ("end_date", end)]:
        for field in ("year", "month", "day"):
            query.append((f"dailyRange.{name}.{field}", getattr(value, field)))
    return request_json(
        f"https://businessprofileperformance.googleapis.com/v1/locations/{location}"
        f":fetchMultiDailyMetricsTimeSeries?{urlencode(query)}", token=token)


def collect(output, end=None, days=14):
    property_id = required("GA4_PROPERTY_ID")
    if not re.fullmatch(r"[0-9]+", property_id):
        raise ValueError("GA4_PROPERTY_ID must be numeric (not a G- measurement ID)")
    location_ids = locations(required("GBP_LOCATION_IDS"))
    timezone = os.environ.get("REPORT_TIMEZONE", "America/New_York")
    end = end or (datetime.now(ZoneInfo(timezone)).date() - timedelta(days=1))
    start, end = date_range(end, days)
    auth = request_json("https://oauth2.googleapis.com/token", form=True, payload={
        "client_id": required("GOOGLE_CLIENT_ID"),
        "client_secret": required("GOOGLE_CLIENT_SECRET"),
        "refresh_token": required("GOOGLE_REFRESH_TOKEN"),
        "grant_type": "refresh_token",
    })
    token = auth.get("access_token")
    if not token:
        raise RuntimeError("Google did not return an access token")
    # Fetch everything before writing: failed sources never publish a partial run.
    report = {
        "schemaVersion": 1, "startDate": str(start), "endDate": str(end),
        "reportTimezone": timezone, "ga4PropertyId": property_id,
        "ga4": ga_report(token, property_id, start, end),
        "businessProfiles": {f"locations/{location}": gbp_report(token, location, start, end)
                             for location in location_ids},
    }
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(report, indent=2, sort_keys=True) + "\n"
    (output / f"{end}.json").write_text(serialized, encoding="utf-8")
    (output / "latest.json").write_text(serialized, encoding="utf-8")
    print(f"Collected {start} through {end} for GA4 and {len(location_ids)} locations")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="google-data")
    parser.add_argument("--end-date", type=date.fromisoformat)
    parser.add_argument("--days", type=int, default=14)
    args = parser.parse_args()
    try:
        collect(args.output, args.end_date, args.days)
    except Exception as error:
        # Unexpected exceptions may contain transport internals: keep logs sanitized.
        message = str(error) if isinstance(error, (ValueError, RuntimeError)) else type(error).__name__
        print(f"Collection failed: {message}", file=sys.stderr)
        sys.exit(1)
