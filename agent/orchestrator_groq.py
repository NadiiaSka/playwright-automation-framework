import os
from groq import Groq
from dotenv import load_dotenv

from agent import tools as project_tools

load_dotenv()

SYSTEM_PROMPT = """You are an SDET assistant for a test automation project. Use available tools to inspect files and run tests.
Never claim success without verification. Always use tools to verify results before responding."""

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "list_project_files",
            "description": "List all project files and directories",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_project_file",
            "description": "Read the contents of a file in the project",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file relative to project root"
                    }
                },
                "required": ["file_path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_tests",
            "description": "Run a test suite",
            "parameters": {
                "type": "object",
                "properties": {
                    "suite": {
                        "type": "string",
                        "description": "Test suite: component, integration, api, functional, security, accessibility, visual, e2e"
                    }
                },
                "required": ["suite"],
            },
        },
    },
]


def run_agent(task: str) -> None:
    """Ask Groq to perform a task using local tools."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("Set GROQ_API_KEY before starting the agent.")

    client = Groq(api_key=api_key)
    # Reduce task size if it's too long to stay within free tier limits
    if len(task) > 500:
        task = task[:500]
    
    messages = [{"role": "user", "content": task}]

    for turn in range(10):
        try:
            response = client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                max_tokens=512,  # Further reduced for free tier
            )
        except Exception as e:
            if "rate_limit" in str(e).lower() or "too large" in str(e).lower():
                print(f"\nGroq Free Tier Limit: {str(e)[:200]}")
                print("\nConsider upgrading to Groq Dev Tier ($10/month) or waiting before next request.")
            else:
                print(f"API Error: {e}")
            return

        # Check stop reason
        if response.choices[0].finish_reason != "tool_calls":
            # Model finished with text response
            if response.choices[0].message.content:
                print(f"\nGroq:\n{response.choices[0].message.content}")
            return

        # Print model's response text if any
        if response.choices[0].message.content:
            print(f"\nGroq:\n{response.choices[0].message.content}")

        # Add assistant response to messages
        messages.append(response.choices[0].message)

        # Process tool calls
        tool_calls = response.choices[0].message.tool_calls
        if not tool_calls:
            return

        # Collect tool results
        for tool_call in tool_calls:
            tool_name = tool_call.function.name
            tool_args = eval(tool_call.function.arguments)  # Safe in controlled environment
            
            print(f"\nTool requested: {tool_name}({tool_args})")

            try:
                if tool_name == "list_project_files":
                    result = "\n".join(project_tools.list_files())
                elif tool_name == "read_project_file":
                    result = project_tools.read_file(tool_args.get("file_path", ""))
                elif tool_name == "run_tests":
                    result = project_tools.run_test_suite(tool_args.get("suite", ""))
                else:
                    result = f"Unknown tool: {tool_name}"
            except Exception as e:
                result = f"Tool error: {str(e)}"

            # Add tool result
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    print("\nStopped after reaching the 10-turn limit.")
