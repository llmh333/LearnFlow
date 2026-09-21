# Phase 3 — SRS engine + Review + History

[← Overview](./00-overview.md) · [← Phase 2](./phase-2-vocabulary.md) · [Phase 4 →](./phase-4-study-dashboard.md)

- **Milestone cũ:** M4, M5
- **Ước lượng:** 2–3 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Trái tim của ứng dụng. Deterministic, test kỹ, độc lập hoàn toàn với AI.

## Tasks

### Backend
- [ ] `V4__create_review_schedule_and_history.sql`: `review_schedule` (PK = `vocabulary_id`), `review_history`, index `next_review` + `reviewed_at`. Kèm backfill: `INSERT INTO review_schedule (vocabulary_id) SELECT id FROM vocabulary;`.
- [ ] `srs/engine/SrsRating` enum: `AGAIN, HARD, GOOD, EASY` (thuần, không Spring/DB/Clock).
- [ ] `srs/engine/SrsState` record: `intervalDays, easeFactor, reviewCount, successCount, failureCount, memoryStrength`.
- [ ] `srs/engine/SrsAlgorithm` interface: `SrsState apply(SrsState current, SrsRating rating)`.
- [ ] `srs/engine/Sm2Algorithm` implements — theo công thức ở `plan/2026-09-21-mvp-technical-plan.md` §5.
- [ ] `srs/domain/{ReviewSchedule, ReviewHistory}` + repositories.
- [ ] `srs/ReviewService.createScheduleFor(vocabularyId)` — gọi từ `VocabularyService` khi tạo từ mới (`next_review = now`).
- [ ] `srs/ReviewService.findDue(languageId, limit)`.
- [ ] `srs/ReviewService.submit(vocabularyId, rating, responseTimeMs, sessionId?)` — trong 1 transaction: load schedule → `algorithm.apply` → `nextReview = clock.instant() + interval` → save schedule → insert history.
- [ ] `srs/ReviewService.historyOf(vocabularyId)`.
- [ ] `srs/ReviewController`: `GET /api/reviews/due?language=&limit=`.
- [ ] `srs/ReviewController`: `POST /api/reviews/{vocabularyId}/submit`.
- [ ] `srs/ReviewController`: `GET /api/reviews/history/{vocabularyId}`.

### Frontend
- [ ] `api/reviews.ts`.
- [ ] `hooks/useReviews.ts`.
- [ ] `pages/ReviewPage.tsx`: lấy hàng đợi due → thẻ hiện `word` → nút `Show answer` → 4 nút rating kèm interval dự kiến → thẻ tiếp theo → màn hình tổng kết khi hết.
- [ ] Phím tắt: `Space` lật thẻ, `1/2/3/4` = Again/Hard/Good/Easy.
- [ ] Thẻ đánh `Again` được đưa lại cuối hàng đợi trong cùng phiên.
- [ ] Thanh tiến trình phiên ôn.
- [ ] `VocabularyDetail` thêm tab **Review history**.

### Test
- [ ] `Sm2AlgorithmTest` parameterized: mọi rating × `reviewCount` = 0 / 1 / n.
- [ ] `Sm2AlgorithmTest`: chặn dưới `easeFactor >= 1.3`.
- [ ] `Sm2AlgorithmTest`: `AGAIN` reset interval.
- [ ] `Sm2AlgorithmTest`: tính lặp lại 2 lần cho cùng input phải ra cùng kết quả.
- [ ] `ReviewServiceTest` với `Clock.fixed` → `next_review` chính xác đến giây.
- [ ] `ReviewIntegrationTest`: submit → schedule cập nhật đúng + history ghi đủ `previous_interval`/`new_interval`.
- [ ] FE test `ReviewCard` luồng lật thẻ + rating.

## Definition of Done
- [ ] Ôn được từ đến hạn, `next_review` thay đổi đúng công thức.
- [ ] Lịch sử lưu đầy đủ.
- [ ] Từ bị `Again` quay lại trong phiên.
- [ ] `Sm2AlgorithmTest` xanh 100%.
