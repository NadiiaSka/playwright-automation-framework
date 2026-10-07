import os
import shutil
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

IGNORED_DIRECTORIES = {
    ".git",
    ".venv",
    "node_modules",
    "dist",
    "playwright-report",
    "test-results",
}

TEST_SUITES = {
    "functional": "test:functional",
    "component": "test:component",
    "security": "test:security",
    "integration": "test:integration",
    "api": "test:api",
    "security": "test:security",
    "accessibility": "test:accessibility",
    "visual": "test:visual",
    "end-end": "test:end-end",
    "e2e": "test:e2e",
    "component": "test:component",
}


def resolve_project_path(relative_path: str) -> Path:
    """Resolve a path and reject anything outside the project."""
    candidate = (PROJECT_ROOT / relative_path).resolve()

    try:
        candidate.relative_to(PROJECT_ROOT)
    except ValueError as exc:
        raise ValueError("Path must stay inside the project.") from exc

    if any(part.lower().startswith(".env") for part in candidate.parts):
        raise ValueError("Environment files are not available to the agent.")

    return candidate


def list_files() -> list[str]:
    """List a bounded set of project files, excluding generated directories."""
    results: list[str] = []

    for current_root, directories, filenames in os.walk(PROJECT_ROOT):
        directories[:] = [
            name for name in directories
            if name not in IGNORED_DIRECTORIES
        ]

        for filename in filenames:
            if filename.lower().startswith(".env"):
                continue

            path = Path(current_root) / filename
            results.append(path.relative_to(PROJECT_ROOT).as_posix())

            if len(results) >= 500:
                return sorted(results)

    return sorted(results)


def read_file(file_path: str) -> str:
    """Read a bounded UTF-8 text file from inside the project."""
    path = resolve_project_path(file_path)

    if not path.is_file():
        raise FileNotFoundError(f"File not found: {file_path}")

    content = path.read_text(encoding="utf-8")

    if len(content) > 20_000:
        return content[:20_000] + "\n...[file truncated]"

    return content


def run_test_suite(suite: str) -> str:
    """Run one predefined npm test script, never an arbitrary shell command."""
    script = TEST_SUITES.get(suite)
    if script is None:
        raise ValueError(f"Unsupported test suite: {suite}")

    npm_name = "npm.cmd" if os.name == "nt" else "npm"
    npm_path = shutil.which(npm_name)
    if npm_path is None:
        raise RuntimeError("npm was not found on PATH.")

    child_environment = os.environ.copy()
    child_environment.pop("ANTHROPIC_API_KEY", None)
    child_environment.pop("OPENAI_API_KEY", None)

    result = subprocess.run(
        [npm_path, "run", script],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        timeout=120,
        shell=False,
        env=child_environment,
    )

    output = (
        f"Exit code: {result.returncode}\n"
        f"STDOUT:\n{result.stdout}\n"
        f"STDERR:\n{result.stderr}"
    )

    if len(output) > 12_000:
        output = output[:12_000] + "\n...[output truncated]"

    return output