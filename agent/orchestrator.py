import os

from anthropic import Anthropic
from dotenv import load_dotenv

from agent import tools as project_tools

load_dotenv()

SYSTEM_PROMPT = """You are an SDET assistant for this test automation project.

Follow the project instructions below. Use tools to inspect files and run
focused tests when useful. Never claim a test passed unless a tool result
shows that it passed. Do not weaken assertions to make tests pass.

Project instructions:
{project_instructions}
"""

TOOL_DEFINITIONS = [
    {
        "name": "list_files",
        "description": "List project files, excluding generated and secret files.",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
    },
    {
        "name": "read_file",
        "description": "Read a UTF-8 text file inside the project.",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Project-relative file path.",
                },
            },
            "required": ["file_path"],
            "additionalProperties": False,
        },
    },
    {
        "name": "run_test_suite",
        "description": "Run one supported project test suite.",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "suite": {
                    "type": "string",
                    "enum": ["functional", "component", "security", "integration", "api", "accessibility", "visual", "end-end", "e2e"],
                },
            },
            "required": ["suite"],
            "additionalProperties": False,
        },
    },
]


def dispatch_tool(name: str, arguments: dict) -> str:
    """Allow only explicitly implemented tools."""
    if name == "list_files":
        return "\n".join(project_tools.list_files())

    if name == "read_file":
        return project_tools.read_file(arguments["file_path"])

    if name == "run_test_suite":
        return project_tools.run_test_suite(arguments["suite"])

    raise ValueError(f"Unknown tool: {name}")


def run_agent(task: str) -> None:
    """Ask Claude to perform a task using the registered local tools."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("Set ANTHROPIC_API_KEY before starting the agent.")

    model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")
    client = Anthropic(api_key=api_key)

    instructions_path = project_tools.PROJECT_ROOT / "AGENTS.md"
    if instructions_path.is_file():
        project_instructions = instructions_path.read_text(encoding="utf-8")
    else:
        project_instructions = "No AGENTS.md file was found."

    system_prompt = SYSTEM_PROMPT.format(
        project_instructions=project_instructions
    )
    messages = [{"role": "user", "content": task}]

    for _ in range(10):
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt,
            tools=TOOL_DEFINITIONS,
            tool_choice={
                "type": "auto",
                "disable_parallel_tool_use": True,
            },
            messages=messages,
        )

        for block in response.content:
            if block.type == "text":
                print(f"\nClaude:\n{block.text}")

        if response.stop_reason != "tool_use":
            return

        messages.append({"role": "assistant", "content": response.content})
        tool_results = []

        for block in response.content:
            if block.type != "tool_use":
                continue

            print(f"\nTool requested: {block.name}({block.input})")

            try:
                result = dispatch_tool(block.name, block.input)
                is_error = False
            except Exception as exc:
                result = f"Tool failed: {exc}"
                is_error = True

            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                    "is_error": is_error,
                }
            )

        messages.append({"role": "user", "content": tool_results})
    else:
        print("\nStopped after reaching the 10-turn limit.")