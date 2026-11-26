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

## Locator failure demo

Run the demo from PowerShell:

```powershell
.\.venv\Scripts\python.exe -m agent --demo-locator-failure
```

It creates a disposable copy of the app and functional test, changes the
page-object locator from `getByLabel("Amount")` to
`getByLabel("amountInput")`, and runs one focused Playwright test. Claude then
inspects the failure and suggests a correction; it does not edit files. The
temporary copy is removed afterward, so the repository remains unchanged.
This intentionally deterministic locator mismatch demonstrates diagnosis; it
is not a flaky test. The demo requires the Chrome browser to be installed and
uses the configured Claude API model.

The agent tests require the project npm dependencies (`npm ci`); the demo also
requires an installed Playwright browser. Run the tests with:

```powershell
.venv\Scripts\python.exe -m unittest agent.test_orchestrator
```
