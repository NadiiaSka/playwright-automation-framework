import os

from anthropic import Anthropic
from dotenv import load_dotenv

from agent import tools as project_tools

load_dotenv()

SYSTEM_PROMPT = """You are an SDET assistant for a test automation project. Use available tools to inspect files and run tests.
Never claim success without verification. Always use tools to verify results before responding."""

TOOL_DEFINITIONS = [
    {
        "name": "list_project_files",
        "description": "List all project files and directories",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "read_project_file",
        "description": "Read the contents of a file in the project",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file relative to project root",
                }
            },
            "required": ["file_path"],
        },
    },
    {
        "name": "run_tests",
        "description": "Run a test suite",
        "input_schema": {
            "type": "object",
            "properties": {
                "suite": {
                    "type": "string",
                    "description": "Test suite: component, integration, api, functional, security, accessibility, visual, e2e",
                }
            },
            "required": ["suite"],
        },
    },
]


def _run_tool(tool_name: str, tool_input: dict) -> str:
    if tool_name == "list_project_files":
        return "\n".join(project_tools.list_files())
    if tool_name == "read_project_file":
        return project_tools.read_file(tool_input.get("file_path", ""))
    if tool_name == "run_tests":
        return project_tools.run_test_suite(tool_input.get("suite", ""))
    return f"Unknown tool: {tool_name}"


def run_agent(task: str) -> None:
    """Ask Claude to perform a task using local tools."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("Set ANTHROPIC_API_KEY before starting the agent.")

    client = Anthropic(api_key=api_key)
    model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5")
    if len(task) > 500:
        task = task[:500]

    messages = [{"role": "user", "content": task}]

    for _ in range(10):
        try:
            response = client.messages.create(
                model=model,
                system=SYSTEM_PROMPT,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                max_tokens=1024,
            )
        except Exception as error:
            print(f"API Error: {error}")
            return

        text_blocks = [block.text for block in response.content if block.type == "text"]
        if text_blocks:
            print(f"\nClaude:\n{''.join(text_blocks)}")

        tool_uses = [
            block for block in response.content if block.type == "tool_use"
        ]
        if not tool_uses:
            return

        messages.append({"role": "assistant", "content": response.content})
        tool_results = []
        for tool_use in tool_uses:
            print(f"\nTool requested: {tool_use.name}({tool_use.input})")
            try:
                result = _run_tool(tool_use.name, tool_use.input)
            except Exception as error:
                result = f"Tool error: {error}"

            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": result,
                }
            )

        messages.append({"role": "user", "content": tool_results})

    print("\nStopped after reaching the 10-turn limit.")
