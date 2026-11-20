# CLAUDE.md — LearnFlow

@AGENTS.md

## Dành riêng cho Claude Code

### Nguồn sự thật
- Quy ước code: `AGENTS.md` (đã import ở trên) cho luật cốt lõi và quy trình; chi tiết theo mảng nằm ở
  `.claude/rules/*.md`, tự nạp khi bạn đọc/sửa file khớp đường dẫn. Không tự đặt quy ước mới mà không cập
  nhật đúng file đó.
- Yêu cầu sản phẩm, decision log, lộ trình R0–R7: `plan/2026-11-17-japanese-learning-path-refactor.md`.
- Mỗi phase có file plan riêng `plan/phase-r<n>-<slug>.md` với checklist `- [ ]`. Làm việc theo checklist đó.

### Ngôn ngữ
- Trả lời người dùng và viết tài liệu trong `plan/`: **tiếng Việt**.
- Code, tên biến, comment, commit message, mô tả PR: **tiếng Anh**.
- Nghĩa từ vựng trong nội dung học: **tiếng Việt**.

### Quy trình bắt buộc
1. Bắt đầu một task: đọc checklist phase, tạo branch từ `dev` (`phase/r<n>-<slug>` hoặc `phase/r<n>-<slug>/<task>`).
2. Làm tính năng: dùng skill `/implement-feature` (đúng thứ tự 10 bước ở AGENTS.md §1.7).
3. Trước khi mở PR: dùng skill `/pre-pr` — chạy cổng kiểm tra rồi mới commit/PR.
   Subagent `code-reviewer` **chỉ chạy khi người dùng yêu cầu**, không tự gọi.
4. Mọi thay đổi nội dung tiếng Nhật (từ, kanji, ngữ pháp, bài đọc) phải qua subagent `content-reviewer`.
5. Không bao giờ báo "xong" khi chưa chạy cổng kiểm tra; nếu không chạy được, nói rõ phần nào chưa kiểm chứng.

### Hooks đang bật (`.claude/settings.json`)
- `guard.py` (chặn cứng): sửa migration đã merge vào `dev`; đọc/ghi `.env`, `.env.prod`, `.env.local`;
  commit/push khi đang ở `main`/`dev`; push thẳng vào `main`/`dev`; `--no-verify`.
  Bị chặn thì sửa cách làm, **không** tìm cách vòng qua hook.
- `format.py`: Prettier chạy sau mỗi lần sửa file trong `frontend/src`; Spotless chạy cuối mỗi lượt nếu có file Java đổi.

### Môi trường
- Java 21 và Node 22 quản lý bằng `mise` (`mise install`). Nếu `java`/`node` không có trên PATH, dùng
  `mise exec -- <lệnh>`, ví dụ `mise exec -- ./mvnw verify`.
- Hooks cần `python` trên PATH.
- Postgres dev: `docker compose --profile dev up -d postgres`. Integration test dùng Testcontainers (cần Docker).
