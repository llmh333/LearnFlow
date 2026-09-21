# Phase 6 — Mistake Book

[← Overview](./00-overview.md) · [← Phase 5](./phase-5-ai-tutor.md) · [Phase 7 →](./phase-7-daily-plan.md)

- **Milestone cũ:** M9
- **Ước lượng:** 1–2 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Lỗi không bị trôi mất; hệ thống biết mình sai lặp lại ở đâu.

## Tasks

### Backend
- [ ] `V7__create_mistake.sql`: `mistake_category` (seed: Vocabulary, Grammar, Word order, Pronunciation, Usage, Spelling, Tone, Other).
- [ ] `V7__create_mistake.sql`: `mistake` (original, corrected, explanation, category_id, topic, language_id, vocabulary_id nullable, times_repeated, created_at).
- [ ] `mistake/domain/Mistake` + repository.
- [ ] `mistake/MistakeService`: tạo thủ công + tạo từ AI correction; gộp lỗi trùng `topic + category` → tăng `times_repeated`.
- [ ] `mistake/MistakeController`: `GET/POST /api/mistakes`.
- [ ] `mistake/MistakeController`: `GET /api/mistakes/recurring?language=`.
- [ ] `AiTutorService` sau khi sửa câu → đề xuất lưu vào Mistake Book, người dùng bấm xác nhận (tránh rác).

### Frontend
- [ ] `pages/MistakeBookPage.tsx` + danh sách lỗi lặp lại nhiều nhất.
- [ ] Thêm mục Mistake Book vào sidebar.
- [ ] Nút `Save to Mistake Book` ở AI Tutor.
- [ ] `ProgressPage.weakAreas` bổ sung nguồn dữ liệu từ mistake.

### Test
- [ ] `MistakeServiceTest` (gộp lỗi trùng).
- [ ] `MistakeIntegrationTest`.

## Definition of Done
- [ ] Sửa câu ở AI Tutor → lưu được vào Mistake Book.
- [ ] Lỗi trùng tăng `times_repeated`.
- [ ] Xem được top lỗi lặp lại.
