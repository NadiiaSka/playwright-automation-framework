# SDET AI Agent

The optional Python assistant uses Claude to inspect project files and run
predefined test suites through local, read-only tools.

## Setup

Install dependencies in the project virtual environment:

```powershell
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r agent\requirements.txt
```

Set `ANTHROPIC_API_KEY` in your environment or a local `.env` file. Optionally
set `ANTHROPIC_MODEL` to override the default `claude-sonnet-5-5` model.
Never commit API keys.

## Usage

```powershell
.venv\Scripts\python.exe -m agent "Run component tests and summarize the results"
```

The agent can list project files, read project files, and run supported npm
test suites. It cannot modify files or execute arbitrary shell commands.

Run its mocked unit tests with:

```powershell
.venv\Scripts\python.exe -m unittest agent.test_orchestrator
```
