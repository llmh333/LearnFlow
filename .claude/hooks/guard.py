"""PreToolUse guard: hard-blocks the few rules that must never be broken (see AGENTS.md).

Exit code 2 blocks the tool call and feeds stderr back to Claude. Any other failure inside this
script exits 0 so a bug here never wedges the session.

Rules:
1. Never edit a Flyway migration that is already merged into origin/dev (an "applied" migration).
2. Never read or write real env files (.env, .env.prod, .env.local). .env.example is fine.
3. Never commit or push while on main/dev, never push to main/dev, never skip git hooks.
"""

import json
import os
import re
import subprocess
import sys

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
MIGRATION_RE = re.compile(r"backend/src/main/resources/db/migration/V\d+__[^/]+\.sql$")
ENV_FILE_RE = re.compile(r"(^|/)\.env(\.prod|\.local)?$")
ENV_IN_COMMAND_RE = re.compile(r"(^|[\s/'\"=<>])\.env(\.prod|\.local)?(?=$|[\s'\";|&)<>])")
PROTECTED_BRANCHES = ("main", "dev")


def block(reason: str) -> None:
    print(f"Blocked by .claude/hooks/guard.py: {reason}", file=sys.stderr)
    sys.exit(2)


def git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", "-C", PROJECT_DIR, *args], capture_output=True, text=True, timeout=10
    )


def relative_path(path: str) -> str:
    path = path.replace("\\", "/")
    root = PROJECT_DIR.replace("\\", "/").rstrip("/")
    if path.lower().startswith(root.lower() + "/"):
        path = path[len(root) + 1 :]
    return path[2:] if path.startswith("./") else path


def check_file(tool: str, path: str) -> None:
    rel = relative_path(path)
    if ENV_FILE_RE.search(rel):
        block(f"{rel} holds real secrets. Use .env.example for documentation instead.")
    if tool != "Read" and MIGRATION_RE.search(rel):
        merged = git("cat-file", "-e", f"origin/dev:{rel}").returncode == 0
        if merged:
            block(
                f"{rel} is already merged into dev (applied). Never edit an applied migration; "
                "add a new V{n+1}__*.sql instead (AGENTS.md §1.3)."
            )


def current_branch() -> str:
    result = git("rev-parse", "--abbrev-ref", "HEAD")
    return result.stdout.strip() if result.returncode == 0 else ""


def check_bash(command: str) -> None:
    if ENV_IN_COMMAND_RE.search(command):
        block("command touches a real env file (.env/.env.prod/.env.local).")

    if re.search(r"--no-verify\b", command):
        block("--no-verify skips git hooks; fix the failing hook instead.")

    if re.search(r"\bgit\b[^;&|]*\b(commit|push)\b", command):
        branch = current_branch()
        if branch in PROTECTED_BRANCHES:
            block(
                f"current branch is '{branch}'. main/dev never take direct commits or pushes; "
                "create a branch phase/r<n>-<slug>[/<task>] from dev first (AGENTS.md §1.7)."
            )

    for push in re.findall(r"\bgit\b[^;&|]*\bpush\b[^;&|]*", command):
        targets = re.findall(r"(?:^|[\s:+])(main|dev)(?=$|\s)", push)
        if targets:
            block(f"pushing to '{targets[0]}' directly is not allowed; open a PR into dev instead.")


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return
    tool = payload.get("tool_name", "")
    data = payload.get("tool_input") or {}

    if tool in ("Read", "Edit", "Write", "MultiEdit", "NotebookEdit"):
        path = data.get("file_path") or data.get("notebook_path") or ""
        if path:
            check_file(tool, path)
    elif tool in ("Bash", "PowerShell"):
        check_bash(data.get("command", ""))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:  # never wedge the session on a guard bug
        print(f"guard.py error (ignored): {exc}", file=sys.stderr)
        sys.exit(0)
