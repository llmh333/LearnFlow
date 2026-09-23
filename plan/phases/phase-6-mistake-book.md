# Phase 6 — Mistake Book

[← Overview](./00-overview.md) · [← Phase 5](./phase-5-ai-tutor.md) · [Phase 7 →](./phase-7-daily-plan.md)

- **Milestone cũ:** M9
- **Ước lượng:** 1–2 ngày
- **Trạng thái:** [x] Hoàn thành

## Goal

Lỗi không bị trôi mất; hệ thống biết mình sai lặp lại ở đâu.

## Tasks

### Backend
- [x] `V7__create_mistake.sql`: `mistake_category` (seed: Vocabulary, Grammar, Word order, Pronunciation, Usage, Spelling, Tone, Other).
- [x] `V7__create_mistake.sql`: `mistake` (original, corrected, explanation, category_id, topic, language_id, vocabulary_id nullable, times_repeated, created_at).
- [x] `mistake/domain/Mistake` + repository.
- [x] `mistake/MistakeService`: tạo thủ công + tạo từ AI correction; gộp lỗi trùng `topic + category` → tăng `times_repeated`.
  > Khớp trùng: cùng `languageCode` + `categoryId` + `topic` (so sánh không phân biệt hoa/thường qua
  > `LOWER()` trong query). Khi trùng: tăng `timesRepeated`, cập nhật `corrected`/`explanation` theo lần
  > mới nhất, **giữ nguyên** `original` và `createdAt` của lần đầu tiên (append-only tinh thần, biết
  > "lỗi này xuất hiện từ khi nào"). Category không khớp danh sách 8 loại đã seed → fallback `Other`.
  > `vocabularyId` optional dùng `EntityManager.getReference` (không `VocabularyRepository`) — cùng
  > pattern với `srs.ReviewService.createScheduleFor`, giữ đúng luật ranh giới module.
- [x] `mistake/MistakeController`: `GET/POST /api/mistakes`.
- [x] `mistake/MistakeController`: `GET /api/mistakes/recurring?language=`.
  > Thêm `GET /api/mistakes/categories` (không có trong checklist gốc) để frontend có danh sách category
  > cho dropdown lọc/hiển thị, tránh hardcode lại 8 tên category ở frontend.
- [x] `AiTutorService` sau khi sửa câu → đề xuất lưu vào Mistake Book, người dùng bấm xác nhận (tránh rác).
  > Thêm `AIProvider.analyzeMistake()` (tool-use, ép JSON `{category, topic}` từ 8 category cố định) —
  > gọi ngay sau `correctSentence` **chỉ khi** câu sửa khác câu gốc (không phân tích "lỗi" cho câu vốn đã
  > đúng). `POST /api/ai/sentence/correct` giờ trả thêm `suggestedCategory`/`suggestedTopic` (null nếu
  > không có lỗi thật). Việc lưu thật vẫn là 1 lệnh gọi `POST /api/mistakes` riêng do người dùng bấm xác
  > nhận — đúng tinh thần "tránh rác" của checklist.

### Frontend
- [x] `pages/MistakeBookPage.tsx` + danh sách lỗi lặp lại nhiều nhất.
- [x] Thêm mục Mistake Book vào sidebar.
- [x] Nút `Save to Mistake Book` ở AI Tutor.
  > Hiện ở tab Correct, ngay dưới kết quả sửa câu, chỉ xuất hiện khi có `suggestedCategory` (tức AI xác
  > nhận có lỗi thật). Bấm xong hiện "Saved ✓", không cho bấm lại trùng lặp trong cùng phiên.
- [x] `ProgressPage.weakAreas` bổ sung nguồn dữ liệu từ mistake.
  > Thêm card "Recurring mistakes" riêng (top 5 theo `timesRepeated`) cạnh "Weak areas" — 2 góc nhìn bổ
  > sung nhau (SRS ease factor thấp vs. lỗi ngữ pháp/logic lặp lại từ AI Tutor) thay vì gộp cứng thành 1
  > thuật toán tổng hợp, giữ đơn giản và dễ hiểu cho người dùng.

### Test
- [x] `MistakeServiceTest` (gộp lỗi trùng).
- [x] `MistakeIntegrationTest`.

## Definition of Done
- [x] Sửa câu ở AI Tutor → lưu được vào Mistake Book. (Logic verify qua `AiTutorServiceTest`; thao tác
  lưu thật verify qua `MistakeIntegrationTest` + curl.)
- [x] Lỗi trùng tăng `times_repeated`. **Verify thật bằng curl**: tạo mistake "Present Perfect" 2 lần
  (khác hoa/thường "Present Perfect" vs "present perfect") → cùng 1 `id`, `timesRepeated` 1→2, `original`
  giữ nguyên lần đầu, `corrected`/`explanation` cập nhật theo lần sau.
- [x] Xem được top lỗi lặp lại. **Verify thật bằng curl**: `GET /mistakes/recurring?language=en` trả đúng
  mistake vừa tạo, sắp theo `timesRepeated` giảm dần (có test `recurring_ordersByTimesRepeatedDescending`
  phủ trường hợp nhiều topic khác tần suất).

**Cổng kiểm tra đã chạy xanh hết:** `cd backend && ./mvnw verify` (91/91 test pass, gồm
`MistakeServiceTest` + `MistakeIntegrationTest` qua Testcontainers Postgres thật) và
`cd frontend && npm run lint && npm run build && npm run test` (9/9 test pass).
