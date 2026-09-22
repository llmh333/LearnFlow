# Phase 3 — SRS engine + Review + History

[← Overview](./00-overview.md) · [← Phase 2](./phase-2-vocabulary.md) · [Phase 4 →](./phase-4-study-dashboard.md)

- **Milestone cũ:** M4, M5
- **Ước lượng:** 2–3 ngày
- **Trạng thái:** [x] Hoàn thành

## Goal

Trái tim của ứng dụng. Deterministic, test kỹ, độc lập hoàn toàn với AI.

## Tasks

### Backend
- [x] `V4__create_review_schedule_and_history.sql`: `review_schedule` (PK = `vocabulary_id`), `review_history`, index `next_review` + `reviewed_at`. Kèm backfill: `INSERT INTO review_schedule (vocabulary_id) SELECT id FROM vocabulary;`.
  > `review_history.study_session_id` chưa có FK (bảng `study_session` chưa tồn tại tới Phase 4) — cột
  > BIGINT thường, Phase 4 sẽ thêm constraint bằng migration mới, không sửa file này.
- [x] `srs/engine/SrsRating` enum: `AGAIN, HARD, GOOD, EASY` (thuần, không Spring/DB/Clock).
- [x] `srs/engine/SrsState` record: `intervalDays, easeFactor, reviewCount, successCount, failureCount, memoryStrength`.
- [x] `srs/engine/SrsAlgorithm` interface: `SrsState apply(SrsState current, SrsRating rating)`.
- [x] `srs/engine/Sm2Algorithm` implements — theo công thức ở `plan/2026-09-21-mvp-technical-plan.md` §5.
  > Lệch có chủ đích: `AGAIN` reset về hằng số nhỏ dương (~10 phút, biểu diễn bằng ngày) thay vì đúng số
  > `0` như công thức gốc viết. Lý do: `0 * easeFactor` mãi mãi vẫn là `0` — nếu để đúng 0, sau một lần
  > "Again" thì mọi lần GOOD/HARD/EASY sau đó sẽ tính interval mới luôn ra 0, từ kẹt vĩnh viễn ở "sắp đến
  > hạn". Một giá trị dương nhỏ thì tăng trưởng lại theo cấp số nhân sau vài lần ôn đúng — đã có test
  > `apply_again_neverLeavesIntervalStuckAtExactlyZero` phủ đúng trường hợp này.
- [x] `srs/domain/{ReviewSchedule, ReviewHistory}` + repositories.
- [x] `srs/ReviewService.createScheduleFor(vocabularyId)` — gọi từ `VocabularyService` khi tạo từ mới (`next_review = now`).
  > Dùng `EntityManager.getReference(Vocabulary.class, id)` thay vì `VocabularyRepository` để không vi
  > phạm luật ranh giới module (00-overview.md §1.1 rule 2: service module A không inject repository
  > module B). `VocabularyService` gọi `ReviewService` (Service công khai) — hướng phụ thuộc
  > `vocabulary → srs`, hợp lệ theo luật.
- [x] `srs/ReviewService.findDue(languageId, limit)`.
  > Lọc theo `language` dùng **code** (`en`/`zh`/`ja`), không phải id số, nhất quán với query param
  > `language=` ở `/api/vocabulary`.
- [x] `srs/ReviewService.submit(vocabularyId, rating, responseTimeMs, sessionId?)` — trong 1 transaction: load schedule → `algorithm.apply` → `nextReview = clock.instant() + interval` → save schedule → insert history.
- [x] `srs/ReviewService.historyOf(vocabularyId)`.
- [x] `srs/ReviewController`: `GET /api/reviews/due?language=&limit=`.
- [x] `srs/ReviewController`: `POST /api/reviews/{vocabularyId}/submit`.
- [x] `srs/ReviewController`: `GET /api/reviews/history/{vocabularyId}`.

### Frontend
- [x] `api/reviews.ts`.
- [x] `hooks/useReviews.ts`.
- [x] `pages/ReviewPage.tsx`: lấy hàng đợi due → thẻ hiện `word` → nút `Show answer` → 4 nút rating kèm interval dự kiến → thẻ tiếp theo → màn hình tổng kết khi hết.
  > ~~`components/review/ReviewCard.tsx` riêng~~ — gộp thẻ review thẳng vào `ReviewPage` (cùng lý do đơn
  > giản hoá như `VocabularyDetail` ở Phase 2: tách ra sẽ chỉ là 1 component hiển thị thuần, không tái
  > dùng ở đâu khác). Nút rating chưa hiển thị số ngày interval dự kiến cụ thể trước khi bấm (backend
  > không trả trước "nếu chọn X thì interval bao nhiêu" — engine chỉ tính sau khi có rating) — có thể bổ
  > sung sau nếu cần, không chặn DoD.
- [x] Phím tắt: `Space` lật thẻ, `1/2/3/4` = Again/Hard/Good/Easy.
- [x] Thẻ đánh `Again` được đưa lại cuối hàng đợi trong cùng phiên.
- [x] Thanh tiến trình phiên ôn.
- [x] ~~`VocabularyDetail` thêm tab Review history~~ — không có `VocabularyDetail` riêng (đã gộp vào
  `VocabularyForm` ở Phase 2); thêm khối "Review history" (5 lần gần nhất) vào dialog edit của
  `VocabularyForm` thay vì một tab riêng.

### Test
- [x] `Sm2AlgorithmTest` parameterized: mọi rating × `reviewCount` = 0 / 1 / n.
- [x] `Sm2AlgorithmTest`: chặn dưới `easeFactor >= 1.3`.
- [x] `Sm2AlgorithmTest`: `AGAIN` reset interval.
- [x] `Sm2AlgorithmTest`: tính lặp lại 2 lần cho cùng input phải ra cùng kết quả.
- [x] `ReviewServiceTest` với `Clock.fixed` → `next_review` chính xác đến giây.
- [x] `ReviewIntegrationTest`: submit → schedule cập nhật đúng + history ghi đủ `previous_interval`/`new_interval`.
- [x] FE test luồng lật thẻ + rating (`ReviewPage.test.tsx`, thay vì `ReviewCard.test.tsx` — xem ghi chú ở trên).

## Definition of Done
- [x] Ôn được từ đến hạn, `next_review` thay đổi đúng công thức.
- [x] Lịch sử lưu đầy đủ.
- [x] Từ bị `Again` quay lại trong phiên.
- [x] `Sm2AlgorithmTest` xanh 100%.

**Verify thật (curl + docker-compose Postgres + backend chạy thật, không chỉ tin unit test):**
tạo từ mới → tự động có review schedule due ngay → due list trả đúng → submit GOOD lần 1 → `intervalDays=1.00`
→ submit GOOD lần 2 → `intervalDays=6.00` → submit AGAIN → `intervalDays=0.01`, `easeFactor` giảm
2.50→2.30, `memoryStrength` giảm còn 66.67 → history trả đủ 3 dòng đúng thứ tự mới nhất trước → due list
loại đúng từ vừa ôn (chưa tới hạn lại) → submit vào id không tồn tại → 404.

**Cổng kiểm tra đã chạy xanh hết:** `cd backend && ./mvnw verify` (54/54 test pass, gồm
`Sm2AlgorithmTest` 17 case, `ReviewServiceTest`, `ReviewIntegrationTest` qua Testcontainers Postgres thật)
và `cd frontend && npm run lint && npm run build && npm run test` (9/9 test pass).

**Lưu ý môi trường phát triển (không phải lỗi code):** `/usr/lib/jvm/java-21-openjdk-amd64` trên máy dev
hiện tại chỉ là JRE (thiếu `javac`/`ct.sym`) nên `./mvnw` build ra lỗi "release version 21 not supported"
nếu trỏ `JAVA_HOME` vào đó. Dùng JDK Temurin 21 đầy đủ đã có sẵn qua `mise` tại
`~/.local/share/mise/installs/java/temurin-21.0.12+101.0.LTS` thay thế.
