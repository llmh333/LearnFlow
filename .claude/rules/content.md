---
paths:
  - "content/**"
  - "scripts/content/**"
---

# Content rules (nội dung học tiếng Nhật)

Nguồn yêu cầu: `plan/2026-11-17-japanese-learning-path-refactor.md` §3. Khi schema nội dung được tạo ở
phase R1, cập nhật file này cho khớp thay vì để hai nơi mô tả khác nhau.

## Nguyên tắc

- **File YAML trong `content/` là nguồn sự thật.** Duyệt nội dung chính là review PR.
- Mỗi mục có `content_key` ổn định (ví dụ `ja.word.taberu`), không đổi sau khi đã import.
- Mỗi mục có trạng thái `draft` hoặc `reviewed`. Chỉ `reviewed` được import vào môi trường thật.
  Nội dung do AI sinh luôn bắt đầu ở `draft`.
- Mỗi mục ghi **nguồn** (JMdict, KANJIDIC2, Tatoeba, danh sách JLPT, AI, tự viết).
- Nghĩa (`meaning`) luôn là **tiếng Việt**, tự nhiên, nghĩa thông dụng nhất đặt trước. Giữ nghĩa tiếng
  Anh gốc ở trường riêng để đối chiếu.
- Câu ví dụ chỉ dùng từ vựng và ngữ pháp **không vượt cấp** của mục đó.
- Furigana/cách đọc khớp ngữ cảnh và khớp chữ kanji tương ứng.
- Không chép nội dung từ giáo trình hoặc trang web thương mại không có giấy phép tương thích.

## Giấy phép

| Nguồn | Giấy phép | Phải làm |
|---|---|---|
| JMdict, KANJIDIC2 | CC BY-SA 4.0 | Ghi nguồn; dữ liệu phái sinh giữ CC BY-SA. Không dùng số liệu tần suất của Halpern |
| Tatoeba | CC BY 2.0 FR (một phần CC0) | Ghi nguồn và link; không dùng audio của Tatoeba |
| Danh sách JLPT của Waller | Chưa xác minh | **Xác minh giấy phép trước khi dùng** (việc của R1) |
| AnimCJK | LGPL / Arphic | Giữ ghi nguồn như ở `WordStrokeOrder.tsx` |

## Quy trình

- Script nhập/làm giàu nằm ở `scripts/content/` (TypeScript), chạy tay, không chạy trong app.
- Script làm giàu bằng AI ghi lại model và prompt đã dùng để làm lại được.
- Mọi thay đổi trong `content/` đi qua subagent `content-reviewer` trước khi mở PR.
