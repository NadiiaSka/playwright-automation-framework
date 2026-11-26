from copy import deepcopy
import os
import unittest
from contextlib import redirect_stdout
from io import StringIO
from types import SimpleNamespace
from unittest.mock import patch

from agent import orchestrator


class RunAgentTests(unittest.TestCase):
    def test_requires_anthropic_api_key(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "ANTHROPIC_API_KEY"):
                orchestrator.run_agent("Inspect the tests")

    def test_uses_claude_tool_calls_and_returns_final_response(self):
        tool_use = SimpleNamespace(
            type="tool_use",
            id="tool-123",
            name="list_project_files",
            input={},
        )
        first_response = SimpleNamespace(content=[tool_use])
        final_response = SimpleNamespace(
            content=[SimpleNamespace(type="text", text="Found the test files.")],
        )
        output = StringIO()
        requests = []

        with (
            patch.dict(
                os.environ,
                {
                    "ANTHROPIC_API_KEY": "test-key",
                    "ANTHROPIC_MODEL": "claude-test-model",
                },
                clear=True,
            ),
            patch.object(orchestrator, "Anthropic") as anthropic_client,
            patch.object(
                orchestrator.project_tools,
                "list_files",
                return_value=["tests/example.spec.js"],
            ),
            redirect_stdout(output),
        ):
            client = anthropic_client.return_value

            def create_message(**kwargs):
                requests.append(
                    {
                        "model": kwargs["model"],
                        "messages": deepcopy(kwargs["messages"]),
                    }
                )
                return [first_response, final_response][len(requests) - 1]

            client.messages.create.side_effect = create_message

            orchestrator.run_agent("Inspect the tests")

        self.assertEqual(anthropic_client.call_args.kwargs["api_key"], "test-key")
        self.assertEqual(requests[0]["model"], "claude-test-model")
        self.assertEqual(
            requests[0]["messages"],
            [{"role": "user", "content": "Inspect the tests"}],
        )
        self.assertEqual(
            requests[1]["messages"][-1],
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": "tool-123",
                        "content": "tests/example.spec.js",
                    }
                ],
            },
        )
        self.assertIn("Found the test files.", output.getvalue())


if __name__ == "__main__":
    unittest.main()
