"""Sample-input test for guard.py. Run: python .claude/hooks/test_guard.py (exit 1 on failure)."""
import json, subprocess, sys, os

root = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
guard = os.path.join(root, ".claude", "hooks", "guard.py")
mig = os.path.join(root, "backend", "src", "main", "resources", "db", "migration", "")
envname = "." + "env"
cases = [
    ("edit applied migration", 2, {"tool_name": "Edit", "tool_input": {"file_path": mig + "V3__create_vocabulary.sql"}}),
    ("read applied migration", 0, {"tool_name": "Read", "tool_input": {"file_path": mig + "V3__create_vocabulary.sql"}}),
    ("write new migration", 0, {"tool_name": "Write", "tool_input": {"file_path": mig + "V15__x.sql"}}),
    ("read env", 2, {"tool_name": "Read", "tool_input": {"file_path": os.path.join(root, envname)}}),
    ("read env.example", 0, {"tool_name": "Read", "tool_input": {"file_path": os.path.join(root, envname) + ".example"}}),
    ("bash cat env", 2, {"tool_name": "Bash", "tool_input": {"command": "cat " + envname}}),
    ("bash cat env.prod", 2, {"tool_name": "Bash", "tool_input": {"command": "cat " + envname + ".prod"}}),
    ("bash cat env.example", 0, {"tool_name": "Bash", "tool_input": {"command": "cp " + envname + ".example x"}}),
    ("push origin dev", 2, {"tool_name": "Bash", "tool_input": {"command": "git push origin dev"}}),
    ("push HEAD:main", 2, {"tool_name": "Bash", "tool_input": {"command": "git push origin HEAD:main"}}),
    ("push feature", 0, {"tool_name": "Bash", "tool_input": {"command": "git push -u origin phase/r0-x/devtools"}}),
    ("no-verify", 2, {"tool_name": "Bash", "tool_input": {"command": "git commit --no-verify -m x"}}),
    ("commit on feature branch", 0, {"tool_name": "Bash", "tool_input": {"command": "git commit -m \"feat: dev tools\""}}),
    ("git log main..dev", 0, {"tool_name": "Bash", "tool_input": {"command": "git log main..dev"}}),
    ("pwsh cat env", 2, {"tool_name": "PowerShell", "tool_input": {"command": "Get-Content " + envname}}),
]
env = dict(os.environ, CLAUDE_PROJECT_DIR=root)
fails = 0
for name, want, payload in cases:
    r = subprocess.run([sys.executable, guard], input=json.dumps(payload), capture_output=True, text=True, env=env)
    ok = r.returncode == want
    fails += not ok
    print(("OK  " if ok else "FAIL"), r.returncode, name, r.stderr.strip()[:90])
print("failures:", fails)
sys.exit(1 if fails else 0)
