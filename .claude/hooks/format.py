"""Auto-format hook. Never blocks: formatting problems are reported, not enforced here (CI and
`./mvnw verify` / `npm run format:check` enforce them).

Modes:
  post-edit  PostToolUse on Edit/Write: runs Prettier on the edited frontend file right away.
  stop       Stop: runs Spotless on the backend once per turn, only if Java files changed since
             the last run (Maven startup is too slow to run after every single edit).

Tools are looked up on PATH first, then through `mise exec` (Java 21 / Node 22 per mise.toml).
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")
BACKEND_DIR = os.path.join(PROJECT_DIR, "backend")
CACHE_FILE = os.path.join(PROJECT_DIR, ".claude", ".format-cache")
PRETTIER_EXTENSIONS = (".ts", ".tsx", ".css", ".json", ".html")
IS_WINDOWS = os.name == "nt"


def note(message: str) -> None:
    print(f"format.py: {message}", file=sys.stderr)


def with_toolchain(command: list[str], tool: str) -> list[str] | None:
    if shutil.which(tool):
        return command
    if shutil.which("mise"):
        return ["mise", "exec", "--", *command]
    return None


def run(command: list[str], cwd: str, timeout: int) -> None:
    result = subprocess.run(
        command, cwd=cwd, capture_output=True, text=True, timeout=timeout, shell=IS_WINDOWS
    )
    if result.returncode != 0:
        note(f"{' '.join(command)} failed:\n{(result.stdout + result.stderr)[-2000:]}")


def post_edit(payload: dict) -> None:
    path = (payload.get("tool_input") or {}).get("file_path", "")
    normalized = path.replace("\\", "/")
    frontend = FRONTEND_DIR.replace("\\", "/")
    if not normalized.lower().startswith(frontend.lower() + "/src/"):
        return
    if not normalized.endswith(PRETTIER_EXTENSIONS):
        return
    if not os.path.isdir(os.path.join(FRONTEND_DIR, "node_modules", "prettier")):
        note("prettier not installed yet (run `npm install` in frontend); skipped.")
        return
    command = with_toolchain(["npx", "--no-install", "prettier", "--write", path], "node")
    if command is None:
        note("node not found (run `mise install`); skipped.")
        return
    run(command, FRONTEND_DIR, timeout=60)


def java_diff_fingerprint() -> str | None:
    status = subprocess.run(
        ["git", "-C", PROJECT_DIR, "status", "--porcelain", "--", "backend/src"],
        capture_output=True,
        text=True,
        timeout=10,
    ).stdout
    java_lines = [line for line in status.splitlines() if line.rstrip().endswith(".java")]
    if not java_lines:
        return None
    diff = subprocess.run(
        ["git", "-C", PROJECT_DIR, "diff", "--", "backend/src"],
        capture_output=True,
        text=True,
        timeout=10,
    ).stdout
    return hashlib.sha256(("\n".join(java_lines) + diff).encode()).hexdigest()


def stop() -> None:
    fingerprint = java_diff_fingerprint()
    if fingerprint is None:
        return
    try:
        with open(CACHE_FILE, encoding="utf-8") as handle:
            if handle.read().strip() == fingerprint:
                return
    except OSError:
        pass

    wrapper = "mvnw.cmd" if IS_WINDOWS else "./mvnw"
    command = with_toolchain([wrapper, "-q", "spotless:apply"], "java")
    if command is None:
        note("java not found (run `mise install`); skipped Spotless.")
        return
    run(command, BACKEND_DIR, timeout=300)

    refreshed = java_diff_fingerprint() or ""
    with open(CACHE_FILE, "w", encoding="utf-8") as handle:
        handle.write(refreshed)


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}
    if mode == "post-edit":
        post_edit(payload)
    elif mode == "stop":
        if payload.get("stop_hook_active"):
            return
        stop()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        note(f"error (ignored): {exc}")
    sys.exit(0)
