# Phase R0 — Dọn nền

> Nguồn yêu cầu: `plan/2026-11-17-japanese-learning-path-refactor.md` §5.4, §7 (R0), D1, D7, D8.
> Xong khi: ranh giới ngày tính theo giờ của người dùng (giờ VN); gọi AI vượt quota trả 429.
> Branch `phase/r0-foundation`, xếp chồng trên commit reset database (D12).

## Quyết định nhỏ trong phase

- Module mới `account`: `user_profile` + `AccountService.today(userId)` (ngày hôm nay theo timezone của user).
- Không có mã mời (bỏ 2026-11-19): đăng ký mở, tắt bằng `app.auth.registration-enabled`.
- Quota AI tính trên **tổng** lượt gọi trong ngày (mặc định 50, `app.ai.daily-quota`), lưu theo từng tính năng
  để thống kê. Trừ quota trong transaction có `pg_advisory_xact_lock(user_id)`, nên gọi song song không vượt.
  Lượt AI lỗi vẫn bị tính.
- Mặc định profile: `daily_minutes = 10`, `daily_new_items = 10`.

## Checklist

### A. Nợ kỹ thuật (§5.4)
- [ ] `AiTutorService` không giữ transaction trong lúc chờ AI
- [ ] Bỏ map `IllegalStateException` → 403; `RegistrationClosedException` riêng
- [ ] Bắt buộc `JWT_SECRET` ≥ 32 byte (không còn giá trị mặc định ở prod)
- [ ] Rate limit đăng nhập đọc IP thật sau Caddy (`server.forward-headers-strategy: native` ở prod)
- [ ] ArchUnit: Service module A không dùng Repository của module B
- [ ] `GET /api/v1/languages` chỉ trả ngôn ngữ `enabled`

### B. Hồ sơ người dùng
- [ ] Migration, mỗi bảng một file: `V17` `user_profile`, `V18` `ai_usage`
- [ ] Đăng ký nhận `timezone` (từ trình duyệt), tạo `user_profile`
- [ ] `GET`/`PATCH /api/v1/account/profile` + test

### C. Auth chuẩn (D16)
- [ ] `V19` `refresh_token`; access token 15 phút, refresh token xoay vòng trong cookie HttpOnly
- [ ] `POST /api/v1/auth/refresh`, `/logout`, `/change-password` (đổi mật khẩu thu hồi mọi phiên)
- [ ] Đăng ký: `confirmPassword`, mật khẩu 8 ký tự – 72 byte có chữ và số; đăng ký trùng cùng lúc → 409
- [ ] Đăng nhập không lộ email qua thời gian phản hồi
- [ ] Test: xoay vòng + dùng lại token cũ, logout, đổi mật khẩu, lỗi field

### D. Quota AI
- [ ] `AiUsageService.consume(userId, feature)` đếm theo ngày địa phương, vượt quota → 429
- [ ] Test: lượt thứ `quota + 1` trả 429; ranh giới ngày theo giờ VN (Clock cố định)

### E. Frontend
- [ ] Form đăng ký: gửi timezone, ô xác nhận mật khẩu
- [ ] Lưu access token trong bộ nhớ, tự gọi `/auth/refresh` khi 401 (một request refresh tại một thời điểm), nút đăng xuất gọi `/auth/logout`
- [ ] Trang đổi mật khẩu
- [ ] Hộp thoại sửa hồ sơ (timezone, mục tiêu, phút/ngày, số mục mới/ngày)
- [ ] Trang AI báo rõ khi hết lượt (429)
