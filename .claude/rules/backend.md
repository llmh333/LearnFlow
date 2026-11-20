---
paths:
  - "backend/src/main/java/**"
---

# Backend rules (Java / Spring Boot)

Chi tiết cho AGENTS.md §1.1, §1.2, §1.4. Nạp khi làm việc với code backend.

## Cấu trúc module

Mỗi domain là **một package phẳng** dưới `com.learnflow.backend`:

```
com.learnflow.backend.<module>/
├── api/v1/<Xxx>Controller.java // @RestController — chỉ map HTTP <-> DTO, không có business logic
├── <Xxx>Service.java           // @Service @Transactional — toàn bộ business logic
├── <Xxx>Repository.java        // interface extends JpaRepository<Entity, Long>
├── domain/<Entity>.java        // @Entity
├── dto/request/<Xxx>Request.java   // record client gửi lên + jakarta validation
├── dto/response/<Xxx>Response.java // record trả về (kể cả record con lồng trong response)
└── engine/                     // thuật toán thuần (SRS, planning, generator): không Spring, không DB
```

Module hiện có: `common`, `auth`, `language`, `curriculum`, `ai`, `health`. Module sẽ có theo lộ trình R0–R7
(`learning`, `srs`, `practice`, `account`) xem `plan/2026-11-17-japanese-learning-path-refactor.md` §5.

## Ba luật ranh giới — không được vi phạm

1. Controller **không bao giờ** inject Repository. Luôn đi qua Service.
2. Service của module A **không** inject Repository của module B. Chỉ gọi Service public của B
   (hoặc `EntityManager.getReference` khi chỉ cần tham chiếu khoá ngoại).
3. Module `ai` **không** được depend vào bất kỳ repository nào của `srs`. AI không được ghi lịch ôn,
   cũng không quyết định lộ trình học. Chặn cứng bằng `ArchitectureTest`.

Tránh phụ thuộc vòng giữa các Service; nếu cần, lấy dữ liệu ở Controller rồi truyền xuống.

## API

- **Mọi API có version trong URL: `/api/v1/...`, `/api/v2/...`.**
- **Mọi URL định nghĩa tập trung ở `common/web/ApiPaths`**, chia theo version rồi theo module:
  `ApiPaths.V1.Account.BASE` (= `/api/v1/account`, dùng cho `@RequestMapping` của class) và các đường dẫn con
  `ApiPaths.V1.Account.PROFILE` (= `/profile`, dùng cho `@GetMapping`…). Controller, `SecurityConfig`, filter
  **chỉ dùng hằng số này**, không viết chuỗi đường dẫn. (Annotation cần hằng số lúc biên dịch nên dùng
  `static final String`, không dùng được enum.) Integration test cố ý viết URL dạng chữ để bắt lỗi đổi
  hợp đồng API ngoài ý muốn.
- Thư mục khớp version: controller dùng `ApiPaths.V1` nằm trong `<module>/api/v1/`. `ArchitectureTest` chặn
  controller nằm ngoài package `api.vN`.
- Ra version mới khi đổi hợp đồng API theo cách làm hỏng client cũ (đổi/xoá trường, đổi nghĩa). Thêm trường
  mới không cần version mới. Version mới: thêm `ApiPaths.V2`, tạo `<module>/api/v2/` (DTO riêng của v2 đặt ở
  `api/v2/dto/request`, `api/v2/dto/response`), giữ v1 chạy song song đến khi frontend chuyển xong.
- Mọi endpoint yêu cầu `Authorization: Bearer <jwt>`, **trừ** `/api/v1/auth/register`, `/api/v1/auth/login`,
  `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/health`, `/api/v1/curriculum/sources`.
- Resource số nhiều, kebab-case: `/api/v1/vocabulary`, `/api/v1/reviews/due`, `/api/v1/study-sessions`.
- Request/Response là **java `record`** tên `XxxRequest` / `XxxResponse`. Không trả entity ra ngoài.
- JSON `camelCase`. Thời gian ISO-8601 UTC (`Instant`).
- Lỗi: **RFC 7807 `ProblemDetail`** qua các exception trong `common/error`. Lỗi validate trả 400 kèm
  `errors: { "<field>": "<message>" }`. Không mượn exception có nghĩa khác để map status.
- Phân trang: `?page=0&size=20`, trả `PageResponse<T> { content, page, size, totalElements, totalPages }`
  (`common/web`). Không trả `Page` của Spring.

## Auth (D16)

- Access token: JWT trong body (`token`), sống `app.auth.access-token-ttl` (15 phút).
- Refresh token: chuỗi ngẫu nhiên 256 bit, **chỉ** nằm trong cookie `refresh_token` (HttpOnly, Secure,
  SameSite=Strict, Path=`/api/v1/auth`); DB chỉ lưu SHA-256. Mỗi lần refresh xoay vòng token; dùng lại token đã
  xoay → thu hồi cả chuỗi (`family_id`). Đổi mật khẩu thu hồi mọi refresh token của user.
- Mật khẩu mới: ≥ 8 ký tự, ≤ 72 byte (giới hạn BCrypt), có chữ và số, phải khớp ô xác nhận. Kiểm ở
  `AuthService`, lỗi trả 400 kèm `errors.<field>`.
- Đăng nhập sai email hay sai mật khẩu trả cùng 401 và cùng thời gian (BCrypt chạy cả khi không có email).

## Dữ liệu theo người dùng

- Mọi bảng dữ liệu của người dùng có `user_id`; mọi Service nhận `userId` làm tham số đầu tiên.
- Tra cứu theo id luôn kèm chủ sở hữu: `findByIdAndUser_Id(...)`. Id không thuộc về mình trả 404 giống
  hệt id không tồn tại.

## Thời gian & tính xác định

- **Luôn inject `java.time.Clock`**, không gọi `Instant.now()` / `LocalDate.now()` mà không truyền `Clock`.
- `common/config/ClockConfig` cung cấp `Clock.systemUTC()`; test inject `Clock.fixed(...)`.
- "Hôm nay", streak, giới hạn từ mới tính theo **múi giờ của người dùng** (quyết định D7), không phải UTC.
- Thuật toán thuần đặt trong `engine/`, không phụ thuộc Spring/DB/Clock, để test được tất định.

## AI

- Không giữ transaction DB mở trong lúc chờ phản hồi `AIProvider` (pool kết nối nhỏ).
- Không tin đầu ra AI: kiểm tra độ dài, enum, cấu trúc JSON trước khi lưu.
- Mọi lượt gọi AI được đếm vào quota theo người dùng (quyết định D8).
- Nội dung học (từ, ngữ pháp, bài đọc) là dữ liệu cố định đã duyệt, **không** sinh lúc người dùng học.
