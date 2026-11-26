from contextlib import contextmanager
import json
import os
import shutil
import socket
import subprocess
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

IGNORED_DIRECTORIES = {
    ".git",
    ".venv",
    "node_modules",
    "dist",
    "playwright-report",
    "test-results",
    "allure-results",
    "allure-report",
    "coverage",
}

TEST_SUITES = {
    "functional": "test:functional",
    "locator-demo": "test:locator-demo",
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

DEMO_FILES = (
    "package.json",
    "package-lock.json",
    "index.html",
    "vite.config.js",
    "playwright.config.js",
    ".env.ci.example",
    "server/local-api.js",
    "scripts/start-local.js",
    "tests/e2e/currency-conversion.spec.js",
    "tests/pages/CurrencyConverterPage.js",
)


def resolve_project_path(
    relative_path: str, project_root: Path = PROJECT_ROOT
) -> Path:
    """Resolve a path and reject anything outside the project."""
    project_root = Path(project_root).resolve()
    candidate = (project_root / relative_path).resolve()

    try:
        candidate.relative_to(project_root)
    except ValueError as exc:
        raise ValueError("Path must stay inside the project.") from exc

    if any(part.lower().startswith(".env") for part in candidate.parts):
        raise ValueError("Environment files are not available to the agent.")

    return candidate


def list_files(project_root: Path = PROJECT_ROOT) -> list[str]:
    """List a bounded set of project files, excluding generated directories."""
    project_root = Path(project_root).resolve()
    results: list[str] = []

    for current_root, directories, filenames in os.walk(project_root):
        directories[:] = [
            name for name in directories
            if name not in IGNORED_DIRECTORIES
        ]

        for filename in filenames:
            if filename.lower().startswith(".env"):
                continue

            path = Path(current_root) / filename
            results.append(path.relative_to(project_root).as_posix())

            if len(results) >= 500:
                return sorted(results)

    return sorted(results)


def read_file(file_path: str, project_root: Path = PROJECT_ROOT) -> str:
    """Read a bounded UTF-8 text file from inside the project."""
    path = resolve_project_path(file_path, project_root)

    if not path.is_file():
        raise FileNotFoundError(f"File not found: {file_path}")

    content = path.read_text(encoding="utf-8")

    if len(content) > 20_000:
        return content[:20_000] + "\n...[file truncated]"

    return content


def run_test_suite(suite: str, project_root: Path = PROJECT_ROOT) -> str:
    """Run one predefined npm test script, never an arbitrary shell command."""
    script = TEST_SUITES.get(suite)
    if script is None:
        raise ValueError(f"Unsupported test suite: {suite}")

    project_root = Path(project_root).resolve()
    npm_name = "npm.cmd" if os.name == "nt" else "npm"
    npm_path = shutil.which(npm_name)
    if npm_path is None:
        raise RuntimeError("npm was not found on PATH.")

    child_environment = os.environ.copy()
    child_environment.pop("ANTHROPIC_API_KEY", None)
    child_environment.pop("OPENAI_API_KEY", None)
    if project_root != PROJECT_ROOT.resolve():
        child_environment.pop("BASE_URL", None)
        child_environment.pop("CI", None)
        for key in list(child_environment):
            if key.startswith("VITE_"):
                child_environment.pop(key)

    result = subprocess.run(
        [npm_path, "run", script],
        cwd=project_root,
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
        output = (
            output[:6_000]
            + "\n...[middle of output truncated]...\n"
            + output[-6_000:]
        )

    return output


def _available_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as candidate:
        candidate.bind(("127.0.0.1", 0))
        return candidate.getsockname()[1]


def _link_node_modules(workspace: Path) -> None:
    source = PROJECT_ROOT / "node_modules"
    destination = workspace / "node_modules"
    if not source.is_dir():
        raise RuntimeError("Install the project npm dependencies before the demo.")

    if os.name == "nt":
        result = subprocess.run(
            [
                os.environ.get("COMSPEC", "cmd.exe"),
                "/c",
                "mklink",
                "/J",
                str(destination),
                str(source),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode:
            raise RuntimeError(
                "Could not create the temporary dependency junction: "
                f"{result.stderr or result.stdout}"
            )
    else:
        os.symlink(source, destination, target_is_directory=True)


@contextmanager
def create_locator_failure_demo_workspace():
    """Create an isolated project copy with one intentionally broken locator."""
    with tempfile.TemporaryDirectory(prefix="sdet-locator-demo-") as temporary_dir:
        workspace = Path(temporary_dir) / "project"
        workspace.mkdir()

        for relative_path in DEMO_FILES:
            source = PROJECT_ROOT / relative_path
            destination = workspace / relative_path
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)

        for directory in ("src", "public"):
            shutil.copytree(PROJECT_ROOT / directory, workspace / directory)

        _link_node_modules(workspace)

        vite_config = workspace / "vite.config.js"
        vite_config_source = vite_config.read_text(encoding="utf-8")
        allowed_paths = [
            str(workspace),
            str(PROJECT_ROOT / "node_modules"),
            str(PROJECT_ROOT / "node_modules/vite/dist/client"),
        ]
        vite_server_config = "            cors: false,\n"
        isolated_server_config = (
            f"            cors: false,\n"
            f"            fs: {{ allow: {json.dumps(allowed_paths)} }},\n"
        )
        if vite_config_source.count(vite_server_config) != 1:
            raise RuntimeError("Could not configure Vite for the isolated demo copy.")
        vite_config.write_text(
            vite_config_source.replace(
                vite_server_config,
                isolated_server_config,
                1,
            ),
            encoding="utf-8",
        )

        app_port = _available_port()
        api_port = _available_port()
        while api_port == app_port:
            api_port = _available_port()

        ci_environment = (workspace / ".env.ci.example").read_text(
            encoding="utf-8"
        )
        replacements = {
            "VITE_APP_PORT": str(app_port),
            "VITE_API_PORT": str(api_port),
            "VITE_LOCAL_API_URL": f"http://127.0.0.1:{api_port}",
            "VITE_APP_URL": f"http://127.0.0.1:{app_port}",
        }
        configured_lines = []
        for line in ci_environment.splitlines():
            if line.startswith("ANTHROPIC_"):
                continue
            key, separator, _ = line.partition("=")
            if separator and key in replacements:
                line = f"{key}={replacements[key]}"
            configured_lines.append(line)
        (workspace / ".env.ci").write_text(
            "\n".join(configured_lines) + "\n",
            encoding="utf-8",
        )

        page_object = workspace / "tests/pages/CurrencyConverterPage.js"
        page_object_source = page_object.read_text(encoding="utf-8")
        correct_locator = 'getByLabel("Amount")'
        if page_object_source.count(correct_locator) != 1:
            raise RuntimeError(
                "Could not locate the expected Amount page-object selector."
            )
        page_object.write_text(
            page_object_source.replace(
                correct_locator,
                'getByLabel("amountInput")',
                1,
            ),
            encoding="utf-8",
        )

        yield workspace