# .claude — cấu hình Claude Code cho LearnFlow

| Đường dẫn | Vai trò |
|---|---|
| `../CLAUDE.md` | Hướng dẫn cho Claude, import `AGENTS.md` |
| `rules/*.md` | Luật chi tiết theo mảng (`backend`, `database`, `frontend`, `testing`, `content`), chỉ nạp khi làm việc với file khớp `paths:` trong frontmatter |
| `settings.json` | Quyền và hooks dùng chung cho cả team (commit vào git) |
| `settings.local.json` | Cấu hình cá nhân, không commit |
| `hooks/guard.py` | PreToolUse: chặn sửa migration đã merge, đụng `.env`, commit/push lên `main`/`dev`, `--no-verify` |
| `hooks/format.py` | Prettier sau mỗi lần sửa file frontend; Spotless cuối lượt nếu có file Java đổi |
| `skills/implement-feature/` | `/implement-feature`: làm tính năng theo 10 bước của AGENTS.md §1.7 |
| `skills/pre-pr/` | `/pre-pr`: cổng kiểm tra → commit → PR vào `dev` |
| `agents/code-reviewer.md` | Subagent soát diff theo quy ước dự án — chỉ chạy khi người dùng yêu cầu |
| `agents/content-reviewer.md` | Subagent soát nội dung tiếng Nhật |

Yêu cầu máy dev: `python` trên PATH (cho hooks), `mise install` (Java 21, Node 22).

Sửa `guard.py` xong thì chạy `python .claude/hooks/test_guard.py` trước khi commit.
