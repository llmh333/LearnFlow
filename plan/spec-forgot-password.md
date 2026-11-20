# Đặc tả: Quên mật khẩu (mã xác thực qua email)

> Backend đã triển khai: `PasswordResetService`, migration `V20__create_password_reset_code_table.sql`.
> Nhánh `phase/r0-foundation`. Frontend: trang quên mật khẩu theo luồng dưới đây.

## Luồng

1. Người dùng nhập email → backend gửi **mã 6 chữ số** về email.
2. Người dùng nhập mã → backend kiểm tra mã (chưa dùng mã).
3. Người dùng nhập mật khẩu mới (+ xác nhận) → backend đổi mật khẩu, dùng hết mã, **đăng xuất mọi thiết bị**.
4. Frontend chuyển về trang đăng nhập (không tự đăng nhập).

## API (`/api/v1/auth`, công khai, không cần token)

| Bước | Method + URL | Body | Thành công |
|---|---|---|---|
| 1 | `POST /password-reset/request` | `{ email }` | `202`, không body |
| 2 | `POST /password-reset/verify` | `{ email, code }` | `204`, không body |
| 3 | `POST /password-reset/confirm` | `{ email, code, newPassword, confirmNewPassword }` | `204`, không body |

- `code`: đúng 6 chữ số (`^\d{6}$`).
- Mật khẩu mới: cùng luật với đăng ký — ≥ 8 ký tự, ≤ 72 byte, có ít nhất 1 chữ cái và 1 chữ số, trùng xác nhận.

## Lỗi (RFC 7807 `ProblemDetail`, lỗi theo trường ở `errors.<field>`)

| Tình huống | Status | Trường |
|---|---|---|
| Email sai định dạng / thiếu | 400 | `errors.email` |
| Mã không đúng 6 chữ số | 400 | `errors.code` |
| Mã sai, hết hạn, đã dùng, đã sai quá 5 lần, hoặc email không có tài khoản | 400 | `errors.code` = `Invalid or expired code` |
| Mật khẩu mới yếu / quá dài | 400 | `errors.newPassword` |
| Xác nhận không khớp | 400 | `errors.confirmNewPassword` |
| Gọi quá nhiều (chung giới hạn với đăng nhập: 10 lần / 5 phút / IP) | 429 | — |

## Quy tắc frontend cần biết

- **Bước 1 luôn trả 202**, kể cả email không tồn tại (chống dò tài khoản). Luôn hiện cùng một câu:
  "Nếu email có tài khoản, chúng tôi đã gửi mã. Kiểm tra hộp thư (cả thư rác)."
- **Gửi lại mã**: backend bỏ qua yêu cầu trong vòng **60 giây** kể từ mã trước, và tối đa **5 mã / giờ**
  (vẫn trả 202). Frontend nên khoá nút "Gửi lại mã" và đếm ngược 60 giây.
- Mã sống **10 phút**. Mỗi mã sai tối đa **5 lần**, sau đó mã bị khoá → yêu cầu mã mới.
  Gửi mã mới làm mã cũ mất hiệu lực.
- Bước 3 kiểm tra mật khẩu **trước** khi kiểm tra mã, nên mật khẩu yếu không làm mất lượt thử mã.
- Bước 3 thành công → mọi refresh token của user bị thu hồi. Frontend xoá state auth (nếu có) và chuyển
  tới `/login` kèm thông báo "Đã đặt lại mật khẩu, hãy đăng nhập".
- Lỗi `errors.code` ở bước 3 (ví dụ mã hết hạn trong lúc nhập mật khẩu) → quay lại bước 2 hoặc 1.

## Vận hành

- Prod bắt buộc SMTP: `SMTP_HOST`, `SMTP_PORT` (mặc định 587, STARTTLS), `SMTP_USERNAME`, `SMTP_PASSWORD`,
  `MAIL_FROM` (`.env.example`). Thiếu `SMTP_HOST` thì backend không khởi động.
- Local dev không cấu hình SMTP: mã được **in ra log backend** (`password reset code for ...`).
