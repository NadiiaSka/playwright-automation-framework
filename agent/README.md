# SDET AI Agent

A local AI agent powered by **Groq** (free tier) for automating test suite execution and project analysis in this Playwright test automation framework.

## Features

- **Free & Fast**: Uses Groq's free tier with qwen/qwen-3.8-27b model
- **Tool Integration**: Can list project files, read file contents, and run test suites
- **Multi-turn Conversations**: Maintains context across multiple interactions
- **Local Execution**: All tools run locally; no data leaves your machine

## Setup

### 1. Create a Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free) and navigate to **API Keys**
3. Create a new API key

### 2. Add to Environment

Add to your `.env` file (create if it doesn't exist):

```bash
GROQ_API_KEY=gsk_your_actual_key_here
```

**Do not commit `.env` to source control.** The `.gitignore` already protects it.

### 3. Install Dependencies

```bash
pip install -r agent/requirements.txt
```

If using a virtual environment:

```bash
.venv\Scripts\Activate.ps1
pip install -r agent/requirements.txt
```

## Usage

### Run from CLI

```bash
python -m agent "run component tests"
python -m agent "What test suites are available?"
python -m agent "What is in the package.json file?"
```

### Available Tools

The agent can:

- **`list_project_files`** – List all project files and directories
- **`read_project_file`** – Read file contents (e.g., test configs, source code)
- **`run_tests`** – Execute test suites:
  - `component` – Vitest component tests
  - `integration` – Vitest integration tests
  - `api` – Playwright API specs
  - `functional` – Playwright browser functional tests
  - `security` – Playwright security specs
  - `accessibility` – Playwright accessibility (Axe) tests
  - `visual` – Playwright visual regression tests
  - `e2e` – End-to-end tests

## Examples

**Example 1: Run component tests and analyze results**

```bash
python -m agent "Run the component test suite and tell me if there are any failures"
```

**Example 2: Inspect test configuration**

```bash
python -m agent "Show me the playwright.config.js file and explain how tests are configured"
```

**Example 3: Get project summary**

```bash
python -m agent "What is the structure of this project?"
```

## Architecture

```
agent/
├── __main__.py              # Entry point for `python -m agent`
├── cli.py                   # Command-line interface
├── orchestrator_groq.py      # Groq API integration & tool calling loop
├── tools.py                 # Local tool implementations
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

### How It Works

1. **User Message** → CLI parses input
2. **Groq Chat** → Sends message + available tools to Groq API
3. **Tool Selection** → Groq decides which tools to call
4. **Local Execution** → `tools.py` runs selected tools (file I/O, test commands)
5. **Results Loop** → Results sent back to Groq for context
6. **Response** → Groq generates final answer, displayed to user
7. **Repeat** → Up to 10 turns per conversation

## Limitations

### Free Tier Rate Limits (Groq)

- **Input tokens**: ~6000 tokens per minute
- **Output tokens**: ~1000 tokens per minute
- These limits are per account; multiple runs quickly can hit the ceiling

**Solution**: Wait between requests or upgrade to Groq Dev Tier ($10/month) for higher limits.

### Model Context

- Maximum output: 1024 tokens (reduced from 4096 to respect free tier limits)
- Longer test runs or large file outputs may be truncated
- Multi-turn conversations share a single 10-turn limit

## Troubleshooting

### "No module named 'groq'"

```bash
.venv\Scripts\Activate.ps1
pip install -r agent/requirements.txt
```

### "GROQ_API_KEY not found"

Ensure `.env` exists and contains:

```bash
GROQ_API_KEY=gsk_your_key_here
```

Then reload your shell/PowerShell session.

### "Rate limit exceeded" errors

Groq's free tier is rate-limited. Wait a minute before the next request, or:

- Reduce complex tasks into smaller requests
- Upgrade to Groq Dev Tier
- Consider using Claude (requires ANTHROPIC_API_KEY) or another provider

## Alternative Providers

If you want to switch providers, modify `cli.py` to import a different orchestrator:

- **Claude 3.5 Sonnet** (via Anthropic) – See `AGENTS.md` for setup
- **Google Gemini** – Free tier (note: free tier doesn't support tool calling via standard API)
- **Ollama local** – Keep groq as fallback; use locally on most hardware

## Development

To add new tools:

1. Implement in `tools.py`
2. Add function definition to `TOOL_DEFINITIONS` in `orchestrator_groq.py`
3. Add dispatch logic to `run_agent()` function
4. Test with `python -m agent "your test query"`

## References

- [Groq Docs](https://console.groq.com/docs/text-chat)
- [Groq Models](https://console.groq.com/docs/models)
- [Project Instructions](../AGENTS.md)
