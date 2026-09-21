# Phase 4 — Study session + Dashboard + Progress ⟶ MỐC A

[← Overview](./00-overview.md) · [← Phase 3](./phase-3-srs-engine.md) · [Phase 5 →](./phase-5-ai-tutor.md)

- **Milestone cũ:** M6, M7, M10
- **Ước lượng:** 2–3 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Đóng vòng lặp Learn → Review → Evaluate. Từ đây app dùng được hằng ngày mà **không cần AI**.

> Đây là mốc **A**: sau phase này app đã dùng thật hằng ngày được, trước khi động tới AI.

## Tasks

### Backend
- [ ] `V5__create_study_session.sql`: bảng `study_session` + `ALTER TABLE review_history ADD COLUMN study_session_id BIGINT REFERENCES study_session(id)`.
- [ ] `study/domain/StudySession` + repository.
- [ ] `study/StudySessionService`: `start(languageId)`, `end(id)` — tự tổng hợp `words_reviewed` / `words_learned` từ history.
- [ ] `study/StudySessionController`: `POST /api/study-sessions/start`, `POST /api/study-sessions/{id}/end`.
- [ ] `ReviewService.submit` nhận thêm `studySessionId` (nullable) để gắn vào history.
- [ ] `progress/MasteryPolicy` — định nghĩa "mastered": `intervalDays >= 21 && easeFactor >= 2.5`.
- [ ] `progress/ProgressService.summary` (total / new / learning / mastered / due).
- [ ] `progress/ProgressService.retention` (tính từ `review_history` N ngày: `success / total`).
- [ ] `progress/ProgressService.weakAreas` (từ có `ease_factor` thấp nhất & tỉ lệ fail cao nhất).
- [ ] `progress/ProgressService.history` (theo ngày).
- [ ] Endpoint `GET /api/progress/{summary,retention,history,weak-areas}`.
- [ ] `dashboard/DashboardService` — gọi `ReviewService` + `ProgressService` + `StudySessionService`.
- [ ] Endpoint `GET /api/dashboard/today`: mỗi ngôn ngữ { dueCount, newCount, estimatedMinutes }, quick progress, streak.

### Frontend
- [ ] `pages/DashboardPage.tsx`: `TodayCard` cho từng ngôn ngữ (due / new / ước lượng phút + nút `Start review`).
- [ ] `pages/DashboardPage.tsx`: `QuickProgressCard`.
- [ ] `pages/ProgressPage.tsx`: thẻ số liệu.
- [ ] `pages/ProgressPage.tsx`: retention theo ngôn ngữ.
- [ ] `pages/ProgressPage.tsx`: biểu đồ lịch sử ôn theo ngày.
- [ ] `pages/ProgressPage.tsx`: danh sách weak areas.
- [ ] `ReviewPage` bọc trong study session: vào trang → `start`, rời trang / hết thẻ → `end` + hiện tổng kết "Reviewed X words in Y minutes".

### Test
- [ ] `MasteryPolicyTest`.
- [ ] `ProgressServiceIntegrationTest` với dữ liệu seed có kiểm soát (retention phải ra đúng con số tính tay).
- [ ] `DashboardServiceTest`.
- [ ] `StudySessionIntegrationTest`.

## Definition of Done
- [ ] Mở app → biết ngay hôm nay cần ôn gì.
- [ ] Ôn xong → Dashboard và Progress phản ánh đúng ngay.
- [ ] **App dùng được thật hằng ngày (Mốc A đạt).**
