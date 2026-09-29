# Giới hạn số từ mới học mỗi ngày (20/25/30/35)

## Bối cảnh

Hiện tại **mọi từ vựng được gán `next_review = now` ngay khi tạo** (kể cả 300 từ seed lúc đăng ký) —
nên `GET /reviews/due` trả về **tất cả** từ đến hạn cùng lúc, không phân biệt "từ mới toanh" (chưa ôn
lần nào) với "từ đã học, tới hạn ôn lại". Đây chính là lý do người dùng thấy hàng chục/trăm từ bị "đề
xuất" ngay khi mở Review, dù mới đăng ký chưa làm gì. Người dùng muốn: **mỗi tài khoản tự chọn 1 mốc
số từ MỚI được học mỗi ngày, trong 4 mốc cố định 20/25/30/35** — các từ đã học rồi mà tới hạn ôn lại
thì **không bị giới hạn này** (đúng chuẩn app SRS như Anki: "reviews" không giới hạn, chỉ giới hạn
"new cards/day").

## Khảo sát đã xác nhận

- `ReviewSchedule` (`backend/.../srs/domain/ReviewSchedule.java`): field `reviewCount` (int) sống
  ngay trên bản ghi lịch ôn, `== 0` nghĩa là **chưa ôn lần nào**. `ReviewHistory` có `reviewedAt`
  (Instant) — log từng lượt ôn, append-only.
- `ReviewService.findDue(userId, languageCode, limit)` hiện chỉ có 1 query duy nhất
  (`ReviewScheduleRepository.findDueByUserId[AndLanguageCode]`), sắp theo `nextReview ASC`, không
  phân biệt `reviewCount == 0` hay `> 0`. `ReviewController.due()` là nơi gọi, FE
  (`ReviewPage.tsx`) luôn truyền `limit=50`.
- `app_user` (`V1__create_app_user.sql`): chưa có cột nào liên quan tới "cài đặt" — cần migration
  mới. `User.java` không có setter (immutable ngoài `@Getter`), cần thêm field + setter.
- `AuthController`/`AuthService`: chỉ có register/login/me — chưa có endpoint update hồ sơ/cài đặt
  nào. Không có Settings/Preferences page/entity nào tồn tại ở cả backend lẫn frontend (grep xác
  nhận 0 kết quả).
- **Rủi ro circular dependency đã phát hiện**: `VocabularyService` (module `vocabulary`) đã inject
  `ReviewService` (để gọi `createScheduleFor`). Nếu để `ReviewService` inject `AuthService` (để lấy
  giới hạn của user) thì tạo vòng lặp `ReviewService → AuthService → VocabularyService →
  ReviewService`, Spring sẽ lỗi khi khởi động. → **Giải pháp**: lấy giới hạn ở tầng Controller
  (`ReviewController` gọi `authService.getDailyNewWordsLimit(userId)` rồi truyền xuống
  `reviewService.findDue(...)` như 1 tham số thường) — không vi phạm luật ranh giới nào (luật chỉ
  cấm Controller inject Repository, và cấm Service module A inject Repository module B; Controller
  gọi Service của module khác để lấy input rồi truyền xuống Service của chính nó là hợp lệ).
- Frontend: không có trang Settings nào — nơi hợp lý nhất để đặt UI đổi cài đặt là ngay khu vực
  "User Card" ở sidebar (`AppLayout.tsx`, cạnh nút Logout hiện có), mở 1 `Dialog` sẵn có
  (`components/ui/Dialog.tsx`) thay vì phải làm hẳn 1 trang mới cho đúng 1 cài đặt.
- `Select.tsx` chỉ là wrapper `<select>` thuần — dùng được ngay cho dropdown 20/25/30/35.

## Thiết kế

### 1. Backend

**Migration `V14__add_daily_new_words_limit.sql`**:
```sql
ALTER TABLE app_user ADD COLUMN daily_new_words_limit SMALLINT NOT NULL DEFAULT 20;
ALTER TABLE app_user ADD CONSTRAINT chk_app_user_daily_new_words_limit
    CHECK (daily_new_words_limit IN (20, 25, 30, 35));
```
Postgres tự backfill 20 cho mọi user đã tồn tại. Mặc định chọn **20** (mốc thấp nhất) — đúng tinh
thần của cả tính năng này là giảm cảm giác quá tải cho user mới.

**`User.java`**: thêm field `dailyNewWordsLimit` (`@Setter`), constructor gán mặc định `20`.

**`AuthService`**: thêm
- `updateDailyNewWordsLimit(Long userId, int limit)` — validate `limit` thuộc `{20,25,30,35}` (ném
  `BadRequestException` nếu không), set rồi trả `UserResponse`.
- `getDailyNewWordsLimit(Long userId)` (`@Transactional(readOnly = true)`) — trả `int` thuần, dùng
  bởi `ReviewController`.

**`UserResponse`**: thêm field `dailyNewWordsLimit` (để FE nhận lại giá trị hiện tại qua
`/auth/me`, `/auth/login`, `/auth/register`).

**`AuthController`**: thêm `PATCH /api/auth/me/settings` nhận
`UpdateUserSettingsRequest(@NotNull Integer dailyNewWordsLimit)` → gọi
`authService.updateDailyNewWordsLimit`.

**`ReviewScheduleRepository`**: thay 2 query `findDueByUserId[AndLanguageCode]` hiện có (không dùng
nữa) bằng 4 query mới, tách theo `reviewCount`:
`findDueReviewedByUserId[AndLanguageCode]` (`reviewCount > 0`, không giới hạn bởi tính năng này) và
`findDueNewByUserId[AndLanguageCode]` (`reviewCount = 0`).

**`ReviewHistoryRepository`**: thêm 1 query đếm "từ mới đã học hôm nay" — đúng nghĩa "lần ôn ĐẦU TIÊN
của từ đó rơi vào hôm nay" (không phải "reviewCount==1 hôm nay", vì nếu user bấm Again rồi ôn lại
cùng ngày, reviewCount sẽ nhảy lên 2 — đếm sai nếu chỉ nhìn reviewCount):
```java
@Query("""
    SELECT rh.vocabulary.id FROM ReviewHistory rh
    WHERE rh.user.id = :userId
      AND (:languageCode IS NULL OR rh.vocabulary.language.code = :languageCode)
    GROUP BY rh.vocabulary.id
    HAVING MIN(rh.reviewedAt) >= :startOfDay
    """)
List<Long> findVocabularyIdsFirstReviewedSince(userId, languageCode, startOfDay);
```

**`ReviewService.findDue`** đổi chữ ký thành
`findDue(Long userId, String languageCode, int limit, int dailyNewWordsLimit)`:
1. Lấy tối đa `limit` từ `reviewCount > 0` đến hạn (không đổi so với trước — **không giới hạn**).
2. Tính `newWordsIntroducedToday` = số phần tử trả về từ query mới ở trên (tính từ đầu ngày UTC theo
   `Clock` đã inject, đúng convention `LocalDate.now(clock)` toàn dự án).
3. `allowance = max(0, dailyNewWordsLimit - newWordsIntroducedToday)`; lấy thêm tối đa
   `min(limit - số đã lấy ở bước 1, allowance)` từ `reviewCount == 0`.
4. Nối 2 danh sách (ôn lại trước, từ mới sau — đúng thứ tự học chuẩn: xong việc cũ rồi mới học thêm),
   map sang `DueVocabularyResponse` như cũ.

**`ReviewController.due(...)`**: inject thêm `AuthService`, gọi
`authService.getDailyNewWordsLimit(userId)` rồi truyền vào `reviewService.findDue(...)`.

**Ảnh hưởng test cần rà soát**: `ReviewServiceTest`/`ReviewIntegrationTest` đang gọi `findDue` — cần
cập nhật chữ ký gọi + rà lại các assertion đang giả định "trả về hết mọi từ due" (mặc định mới: tối
đa 20 từ mới/ngày sẽ đổi hành vi thật của app, không phải lỗi cần né — set
`dailyNewWordsLimit` cao hơn cho đúng kịch bản test nào cần test "nhiều từ due cùng lúc", hoặc thêm
lịch sử ôn giả để test không phụ thuộc giới hạn mới.

### 2. Frontend

- **`types/domain.ts`**: thêm `dailyNewWordsLimit: number` vào `User`.
- **`api/auth.ts`**: thêm `updateUserSettings({ dailyNewWordsLimit }): Promise<User>` → `PATCH
  /auth/me/settings`.
- **`stores/authStore.ts`**: thêm action `updateUser(user: User)` (chỉ thay `user`, giữ nguyên
  `token`) — dùng khi lưu cài đặt xong, không cần đăng nhập lại.
- **`hooks/useAuth.ts`**: thêm `useUpdateUserSettings()` (mutation, `onSuccess` gọi
  `updateUser(user)`).
- **Icon mới**: `IconSettings` (icon bánh răng, theo đúng pattern SVG inline có sẵn trong
  `Icon.tsx`).
- **Component mới** `frontend/src/components/common/AccountSettingsDialog.tsx`: `Dialog` chứa 1
  `Select` với 4 lựa chọn `20/25/30/35` ("N words/day"), nút Lưu gọi
  `useUpdateUserSettings().mutate(...)`.
- **`AppLayout.tsx`**: thêm nút icon bánh răng cạnh nút Logout hiện có ở "User Card" (cả bản desktop
  sidebar lẫn mobile drawer — 2 chỗ đang render Logout tương tự), mở `AccountSettingsDialog`.

## Phạm vi & quyết định mặc định

- Chỉ giới hạn **số từ MỚI** trong hàng đợi Review — từ đã học tới hạn ôn lại **không bị giới hạn**,
  đúng chuẩn SRS (không được để lỡ lịch ôn chỉ vì "hết quota").
- Mặc định `20` cho mọi tài khoản (kể cả tài khoản cũ, backfill qua migration).
- **Không** đổi cách tính "New" trên Dashboard (`countNew`) — đó là tổng số từ chưa học còn lại
  (thông tin "còn bao nhiêu từ chưa đụng tới"), khác với "hôm nay được học tối đa bao nhiêu từ MỚI"
  —2 khái niệm khác nhau, không gộp để tránh rối thêm.
- **Không** thêm hiển thị "còn lại X/Y từ mới hôm nay" trên trang Review ở v1 này (cần đổi shape
  response `/reviews/due` từ mảng sang object bọc thêm field — để dành cho 1 lần cải tiến sau nếu
  cần, giữ thay đổi lần này gọn trong đúng phạm vi "đặt & áp dụng giới hạn").

## File cần sửa

- **Tạo** `backend/src/main/resources/db/migration/V14__add_daily_new_words_limit.sql`
- **Sửa** `backend/.../auth/domain/User.java`, `AuthService.java`, `AuthController.java`,
  `dto/UserResponse.java`; **tạo** `dto/UpdateUserSettingsRequest.java`
- **Sửa** `backend/.../srs/ReviewScheduleRepository.java`, `ReviewHistoryRepository.java`,
  `ReviewService.java`, `ReviewController.java`
- **Sửa** test: `ReviewServiceTest.java`, `ReviewIntegrationTest.java` (rà theo hành vi giới hạn mới)
- **Sửa** `frontend/src/types/domain.ts`, `api/auth.ts`, `stores/authStore.ts`, `hooks/useAuth.ts`,
  `components/ui/Icon.tsx`, `components/common/AppLayout.tsx`
- **Tạo** `frontend/src/components/common/AccountSettingsDialog.tsx`

## Test

- Backend: thêm case trong `ReviewServiceTest` cho đúng logic mới — user có 30 từ mới +
  `dailyNewWordsLimit=20`, chưa ôn gì hôm nay → `findDue` trả tối đa 20 từ mới; đã học 15 từ mới hôm
  nay rồi → chỉ còn lấy thêm tối đa 5; từ `reviewCount>0` tới hạn luôn được trả đủ, không bị đếm vào
  giới hạn. Thêm test cho `AuthService.updateDailyNewWordsLimit` (giá trị hợp lệ/không hợp lệ).
  `ReviewIntegrationTest` cập nhật theo hành vi mới.
- `cd backend && ./mvnw verify` và `cd frontend && npm run lint && npm run build && npm run test`
  đều phải xanh.
- Test tay: đổi cài đặt xuống 20, vào Review với tài khoản có nhiều từ mới → chỉ thấy tối đa 20 từ
  mới trong hàng đợi (cộng với các từ cũ tới hạn ôn lại, không giới hạn).
