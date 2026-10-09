import os
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import agent
from tools import run_shell


class AgentTests(unittest.TestCase):
    @patch.dict(os.environ, {}, clear=True)
    @patch("agent.OpenAI")
    def test_default_provider_uses_openai(self, client_cls):
        agent.make_client()
        client_cls.assert_called_once_with(base_url=None)

    @patch.dict(os.environ, {"PROVIDER": "openai", "OPENAI_BASE_URL": "https://example.com/v1"}, clear=True)
    @patch("agent.OpenAI")
    def test_openai_custom_endpoint(self, client_cls):
        agent.make_client()
        client_cls.assert_called_once_with(base_url="https://example.com/v1")

    @patch.dict(os.environ, {"PROVIDER": "ANTHROPIC", "ANTHROPIC_API_KEY": "test-only", "OPENAI_BASE_URL": "https://example.com/v1"}, clear=True)
    @patch("agent.OpenAI")
    def test_anthropic_uses_its_own_key_and_endpoint(self, client_cls):
        agent.make_client()
        client_cls.assert_called_once_with(api_key="test-only", base_url="https://api.anthropic.com/v1/")

    @patch.dict(os.environ, {"PROVIDER": "anthropic", "OPENAI_API_KEY": "test-only"}, clear=True)
    @patch("agent.load_dotenv")
    @patch("sys.argv", ["agent.py", "test task"])
    def test_anthropic_requires_anthropic_key(self, _):
        with patch("agent.run") as run, self.assertRaises(SystemExit) as stopped:
            agent.main()
        self.assertEqual(stopped.exception.code, 2)
        run.assert_not_called()

    @patch.dict(os.environ, {"CONFIRM_SHELL": "0"})
    def test_shell_output_and_status(self):
        result = run_shell("printf hello; exit 3")
        self.assertEqual(result, {"exit_code": 3, "output": "hello"})

    @patch.dict(os.environ, {"CONFIRM_SHELL": "1"})
    @patch("builtins.input", return_value="n")
    def test_declined_command_does_not_execute(self, _):
        with patch("tools.subprocess.Popen") as process:
            self.assertIn("error", run_shell("touch should-not-exist"))
            process.assert_not_called()

    @patch.dict(os.environ, {"CONFIRM_SHELL": "0"})
    def test_timeout(self):
        self.assertEqual(run_shell("sleep 5", timeout=1)["error"], "Command timed out")

    @patch("agent.Browser")
    @patch("agent.OpenAI")
    def test_tool_errors_and_step_limit_are_summarized(self, client_cls, browser_cls):
        call = SimpleNamespace(id="call_1", function=SimpleNamespace(
            name="browser_click", arguments='{"selector":"#missing"}'))
        message = MagicMock(tool_calls=[call])
        message.model_dump.return_value = {"role": "assistant", "tool_calls": [
            {"id": "call_1", "type": "function", "function": {
                "name": "browser_click", "arguments": call.function.arguments}}]}
        client = client_cls.return_value
        client.chat.completions.create.side_effect = [
            SimpleNamespace(choices=[SimpleNamespace(message=message)]),
            SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="Incomplete"))])]
        browser_cls.return_value.click.side_effect = ValueError("Missing selector")
        with patch("builtins.print"):
            agent.run("Click a missing element", 1)
        final_args = client.chat.completions.create.call_args.kwargs
        self.assertNotIn("tools", final_args)
        tool_result = next(m for m in final_args["messages"] if m["role"] == "tool")
        self.assertEqual(tool_result["tool_call_id"], "call_1")
        self.assertIn("Missing selector", tool_result["content"])
        browser_cls.return_value.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
