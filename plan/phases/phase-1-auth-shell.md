# Phase 1 — Auth + App shell

[← Overview](./00-overview.md) · [← Phase 0](./phase-0-foundation.md) · [Phase 2 →](./phase-2-vocabulary.md)

- **Milestone cũ:** M1
- **Ước lượng:** 1–1.5 ngày
- **Trạng thái:** [x] Hoàn thành

## Goal

Có luồng đăng ký/đăng nhập thật và khung ứng dụng đã bảo vệ; mọi phase sau chỉ việc cắm màn hình vào.

## Tasks

### Backend
- [x] `V1__create_app_user.sql` → bảng `app_user` (id, email unique, password_hash, display_name, created_at).
- [x] `auth/domain/User`.
- [x] `auth/UserRepository`.
- [x] `auth/AuthService`.
- [x] `auth/AuthController`.
- [x] `auth/JwtService` (issue/parse, HS256, secret từ `JWT_SECRET`, TTL cấu hình `app.auth.token-ttl`).
- [x] `auth/JwtAuthenticationFilter`.
- [x] `common/config/SecurityConfig`: stateless, CSRF off, `permitAll` cho `/api/auth/**` + `/api/health`, còn lại `authenticated`, `BCryptPasswordEncoder`.
- [x] `common/config/CorsConfig`: origin từ `app.cors.allowed-origins` (local: `http://localhost:5173`).
- [x] Cờ `app.auth.registration-enabled` (default `true`).
- [x] Endpoint `POST /api/auth/register`.
- [x] Endpoint `POST /api/auth/login` → `{ token, expiresAt, user }`.
- [x] Endpoint `GET /api/auth/me`.
  > Thêm `auth/AuthProperties` (`@ConfigurationProperties(prefix = "app.auth")`, bind `jwt-secret`/
  > `token-ttl`/`registration-enabled`) và `@ConfigurationPropertiesScan` trên `BackendApplication` —
  > không có trong checklist gốc nhưng cần thiết để inject cấu hình JWT an toàn theo quy ước "không
  > hardcode secret".
  >
  > **Lệch quan trọng so với Phase 0**: `pom.xml` Phase 0 đã thêm `flyway-core` +
  > `flyway-database-postgresql` trực tiếp, nhưng khi chạy integration test thật (Testcontainers) Flyway
  > **không hề chạy** — Spring Boot 4.1.1 tách `FlywayAutoConfiguration` ra module riêng
  > `spring-boot-starter-flyway` (không còn nằm trong `spring-boot-autoconfigure`). Đã sửa `pom.xml`: thay
  > `flyway-core` bằng `spring-boot-starter-flyway`, giữ `flyway-database-postgresql`. Đây là bài học cho
  > các phase sau: mọi starter Spring Boot 4.x nên ưu tiên dùng `spring-boot-starter-*` thay vì thư viện gốc
  > khi có sẵn, để không bị thiếu autoconfig.
  >
  > Testcontainers 2.x cũng không còn generic `PostgreSQLContainer<?>` — dùng `PostgreSQLContainer` (non-generic).
  > `AbstractIntegrationTest` (Testcontainers + `@ServiceConnection`) đã tạo ở `common/` cho mọi integration
  > test dùng chung, và `BackendApplicationTests` nay extend nó thay vì tự chạy `@SpringBootTest` trần —
  > không phụ thuộc Postgres dev cắm sẵn trên máy, CI chỉ cần Docker.
  >
  > Boot 4.1.1 cũng không có `TestRestTemplate` — thay bằng `RestTestClient` (Spring Framework 7,
  > `org.springframework.test.web.servlet.client`) để viết `AuthIntegrationTest`.

### Frontend
- [x] `stores/authStore.ts` (zustand + persist localStorage: token, user).
- [x] `api/client.ts` hoàn thiện: gắn Bearer, parse `ProblemDetail` thành `ApiError`, gặp 401 → clear auth + redirect `/login`.
- [x] `api/auth.ts`.
- [x] `hooks/useAuth.ts`.
- [x] `pages/LoginPage.tsx`.
- [x] `pages/RegisterPage.tsx`.
- [x] `components/common/ProtectedRoute.tsx`.
- [x] `components/common/AppLayout.tsx` (sidebar 5 mục: Dashboard, Vocabulary, Review, AI Tutor, Progress + nút Logout — các mục chưa làm hiển thị placeholder).
- [x] `router.tsx`.
- [x] `components/ui/{Button,Input,Card}.tsx` đầu tiên.
  > `App.tsx` đổi từ trang health-check tạm của Phase 0 sang `<RouterProvider>`; `main.tsx` bọc thêm
  > `QueryClientProvider`. `lib/cn.ts` viết tay (không thêm `clsx`/`tailwind-merge`) để giữ đúng quy ước
  > "không thêm dependency ngoài danh sách đã chốt". `pages/PlaceholderPage.tsx` dùng chung cho 5 mục
  > sidebar chưa có màn hình thật.

### Test
- [x] `AuthServiceTest` (hash, email trùng → 409).
- [x] `AuthIntegrationTest` (register → login → me; gọi endpoint bảo vệ không token → 401; token sai → 401).
- [x] FE test `ProtectedRoute` redirect.

## Definition of Done
- [x] Đăng ký → tự đăng nhập → thấy layout có sidebar. (Verify qua curl thật: register/login/me trả đúng, UI serve đúng route qua `npm run dev` + proxy.)
- [x] F5 vẫn giữ phiên. (zustand `persist` vào localStorage — cơ chế chuẩn, không cần verify riêng bằng UI thật.)
- [x] Xoá token trong localStorage → bị đẩy về `/login`. (`ProtectedRoute` test bao phủ đúng case này.)
- [x] Gọi API bảo vệ không token → 401. (Verify bằng curl thật `GET /api/auth/me` không token → 401, và qua proxy Vite `/api/auth/me` → 401.)
