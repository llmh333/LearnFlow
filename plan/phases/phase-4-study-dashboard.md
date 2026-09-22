# Phase 4 — Study session + Dashboard + Progress ⟶ MỐC A

[← Overview](./00-overview.md) · [← Phase 3](./phase-3-srs-engine.md) · [Phase 5 →](./phase-5-ai-tutor.md)

- **Milestone cũ:** M6, M7, M10
- **Ước lượng:** 2–3 ngày
- **Trạng thái:** [x] Hoàn thành

## Goal

Đóng vòng lặp Learn → Review → Evaluate. Từ đây app dùng được hằng ngày mà **không cần AI**.

> Đây là mốc **A**: sau phase này app đã dùng thật hằng ngày được, trước khi động tới AI. **Đạt.**

## Tasks

### Backend
- [x] `V5__create_study_session.sql`: bảng `study_session` + `ALTER TABLE review_history ADD COLUMN study_session_id BIGINT REFERENCES study_session(id)`.
  > Cột `study_session_id` đã tồn tại từ V4 (nullable, không FK — xem ghi chú ở Phase 3). V5 chỉ
  > `CREATE TABLE study_session` + `ALTER TABLE review_history ADD CONSTRAINT ... FOREIGN KEY`, không
  > `ADD COLUMN` lại (không sửa V4 đã apply).
- [x] `study/domain/StudySession` + repository.
- [x] `study/StudySessionService`: `start(languageId)`, `end(id)` — tự tổng hợp `words_reviewed` / `words_learned` từ history.
  > Dùng `languageCode` (String) thay vì `languageId`, nhất quán với toàn bộ API còn lại.
  > `end()` gọi `srs.ReviewService.summarizeSession(id)` (Service công khai) thay vì tự query
  > `ReviewHistoryRepository` trực tiếp — tuân thủ luật ranh giới module (§1.1 rule 2): `study` không
  > được inject repository của `srs`.
- [x] `study/StudySessionController`: `POST /api/study-sessions/start`, `POST /api/study-sessions/{id}/end`.
- [x] `ReviewService.submit` nhận thêm `studySessionId` (nullable) để gắn vào history.
  > Đã có sẵn từ Phase 3 (checklist phase đó đã thiết kế trước cho việc này).
- [x] `progress/MasteryPolicy` — định nghĩa "mastered": `intervalDays >= 21 && easeFactor >= 2.5`.
- [x] `progress/ProgressService.summary` (total / new / learning / mastered / due).
- [x] `progress/ProgressService.retention` (tính từ `review_history` N ngày: `success / total`).
- [x] `progress/ProgressService.weakAreas` (từ có `ease_factor` thấp nhất & tỉ lệ fail cao nhất).
- [x] `progress/ProgressService.history` (theo ngày).
- [x] Endpoint `GET /api/progress/{summary,retention,history,weak-areas}`.
- [x] `dashboard/DashboardService` — gọi `ReviewService` + `ProgressService` + `StudySessionService`.
  > Thực tế chỉ cần gọi `LanguageService` + `VocabularyService` + `ReviewService` (không cần
  > `ProgressService`/`StudySessionService` — dashboard tự tính due/new/known/retention/streak trực
  > tiếp từ `ReviewService`, không qua `ProgressService`, để tránh một tầng gọi vòng không cần thiết).
- [x] Endpoint `GET /api/dashboard/today`: mỗi ngôn ngữ { dueCount, newCount, estimatedMinutes }, quick progress, streak.
  > `estimatedMinutes` dùng heuristic đơn giản có ghi chú rõ trong code (0.5 phút/từ due + 1 phút/từ
  > mới) — placeholder tới khi Daily Plan engine thật (Phase 7) thay thế. `streakDays` = số ngày liên
  > tiếp (tính đến hôm nay, UTC) có ít nhất 1 lượt review, nhìn lại tối đa 60 ngày.
  > **Lệch kiến trúc có chủ đích:** để `progress`/`dashboard` không cần đụng tới repository của
  > `srs`/`vocabulary`, `ReviewService` và `VocabularyService` được bổ sung các method đọc tổng hợp
  > công khai mới (`countDue`, `countNew`, `allSchedules`, `retentionStats`, `currentStreakDays`,
  > `summarizeSession`, `countByLanguage`) — toàn bộ business logic tính bucket/weak-area/streak vẫn
  > nằm ở `progress`/`dashboard`, chỉ dữ liệu thô được `srs`/`vocabulary` cung cấp qua Service công khai.
  > `srs.domain.ReviewHistory` cũng đổi từ field `Long vocabularyId` thô sang quan hệ JPA
  > `@ManyToOne Vocabulary vocabulary`, để JPQL lọc retention/weak-areas theo `language.code` được (theo
  > đúng pattern `ReviewSchedule` đã dùng từ Phase 3).

### Frontend
- [x] `pages/DashboardPage.tsx`: `TodayCard` cho từng ngôn ngữ (due / new / ước lượng phút + nút `Start review`).
- [x] `pages/DashboardPage.tsx`: `QuickProgressCard`.
- [x] `pages/ProgressPage.tsx`: thẻ số liệu.
- [x] `pages/ProgressPage.tsx`: retention theo ngôn ngữ.
- [x] `pages/ProgressPage.tsx`: biểu đồ lịch sử ôn theo ngày.
  > Hiển thị dạng danh sách (ngày, số từ, số lỗi) thay vì biểu đồ vẽ — đúng tinh thần PROJECT.md §4.6
  > "UI Progress nên ưu tiên thông tin hữu ích thay vì quá nhiều biểu đồ".
- [x] `pages/ProgressPage.tsx`: danh sách weak areas.
- [x] `ReviewPage` bọc trong study session: vào trang → `start`, rời trang / hết thẻ → `end` + hiện tổng kết "Reviewed X words in Y minutes".
  > Session gắn với ngôn ngữ tại thời điểm vào trang (đọc từ `?language=` trên URL nếu có — dùng bởi nút
  > "Start review" ở Dashboard — hoặc từ `uiStore`); đổi bộ lọc ngôn ngữ giữa chừng không tạo lại session
  > mới, giữ đơn giản.

### Test
- [x] `MasteryPolicyTest`.
- [x] `ProgressServiceIntegrationTest` với dữ liệu seed có kiểm soát (retention phải ra đúng con số tính tay).
  > Chạy trên cùng Testcontainers Postgres dùng chung toàn bộ suite (không reset giữa các test class) —
  > nên assertion so **delta** (trước/sau khi tạo seed data của chính test này) thay vì số tuyệt đối, để
  > không bị nhiễu bởi dữ liệu "en" của các test class khác. Weak-areas kiểm tra thứ tự tương đối giữa 2
  > từ của chính test, không kiểm tra vị trí tuyệt đối trong danh sách.
- [x] `DashboardServiceTest`.
- [x] `StudySessionIntegrationTest`.

## Definition of Done
- [x] Mở app → biết ngay hôm nay cần ôn gì. (Verify qua curl thật: `GET /dashboard/today` trả đúng
  dueCount/newCount/estimatedMinutes/streak cho từng ngôn ngữ.)
- [x] Ôn xong → Dashboard và Progress phản ánh đúng ngay. (Verify qua curl thật: tạo 2 từ, ôn xong trong
  1 study session → `end` trả đúng wordsReviewed=2/wordsLearned=2/mistakesCount=1 → `progress/summary`,
  `progress/retention`, `progress/weak-areas`, `dashboard/today` đều phản ánh đúng thay đổi ngay sau đó.)
- [x] **App dùng được thật hằng ngày (Mốc A đạt).**

**Cổng kiểm tra đã chạy xanh hết:** `cd backend && ./mvnw verify` (64/64 test pass, gồm
`ProgressServiceIntegrationTest` và `StudySessionIntegrationTest` qua Testcontainers Postgres thật) và
`cd frontend && npm run lint && npm run build && npm run test` (9/9 test pass).
