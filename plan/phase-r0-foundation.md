# Phase R0 — Dọn nền

> Nguồn yêu cầu: `plan/2026-11-17-japanese-learning-path-refactor.md` §5.4, §7 (R0), D1, D7, D8.
> Xong khi: ranh giới ngày tính theo giờ của người dùng (giờ VN); gọi AI vượt quota trả 429.
> Branch `phase/r0-foundation`, xếp chồng trên commit reset database (D12).

## Quyết định nhỏ trong phase

- Module mới `account`: `user_profile` + `AccountService.today(userId)` (ngày hôm nay theo timezone của user).
- Mã mời tạo bằng SQL (hướng dẫn ở README); chưa có trang admin. `app.auth.invite-required` mặc định `true`.
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
- [ ] Migration, mỗi bảng một file: `V17` `invite_code`, `V18` `app_user.invite_code_id`, `V19` `user_profile`,
      `V20` `ai_usage`
- [ ] Đăng ký nhận `timezone` (từ trình duyệt), tạo `user_profile`
- [ ] `GET`/`PATCH /api/v1/account/profile` + test

### C. Mã mời
- [ ] Đăng ký kiểm mã: tồn tại, chưa hết hạn, chưa hết lượt (khoá dòng `FOR UPDATE`)
- [ ] Test: không mã / mã sai / hết lượt / hết hạn

### D. Quota AI
- [ ] `AiUsageService.consume(userId, feature)` đếm theo ngày địa phương, vượt quota → 429
- [ ] Test: lượt thứ `quota + 1` trả 429; ranh giới ngày theo giờ VN (Clock cố định)

### E. Frontend
- [ ] Form đăng ký: ô mã mời, gửi timezone
- [ ] Hộp thoại sửa hồ sơ (timezone, mục tiêu, phút/ngày, số mục mới/ngày)
- [ ] Trang AI báo rõ khi hết lượt (429)
