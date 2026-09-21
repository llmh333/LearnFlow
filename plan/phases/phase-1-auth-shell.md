# Phase 1 — Auth + App shell

[← Overview](./00-overview.md) · [← Phase 0](./phase-0-foundation.md) · [Phase 2 →](./phase-2-vocabulary.md)

- **Milestone cũ:** M1
- **Ước lượng:** 1–1.5 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Có luồng đăng ký/đăng nhập thật và khung ứng dụng đã bảo vệ; mọi phase sau chỉ việc cắm màn hình vào.

## Tasks

### Backend
- [ ] `V1__create_app_user.sql` → bảng `app_user` (id, email unique, password_hash, display_name, created_at).
- [ ] `auth/domain/User`.
- [ ] `auth/UserRepository`.
- [ ] `auth/AuthService`.
- [ ] `auth/AuthController`.
- [ ] `auth/JwtService` (issue/parse, HS256, secret từ `JWT_SECRET`, TTL cấu hình `app.auth.token-ttl`).
- [ ] `auth/JwtAuthenticationFilter`.
- [ ] `common/config/SecurityConfig`: stateless, CSRF off, `permitAll` cho `/api/auth/**` + `/api/health`, còn lại `authenticated`, `BCryptPasswordEncoder`.
- [ ] `common/config/CorsConfig`: origin từ `app.cors.allowed-origins` (local: `http://localhost:5173`).
- [ ] Cờ `app.auth.registration-enabled` (default `true`).
- [ ] Endpoint `POST /api/auth/register`.
- [ ] Endpoint `POST /api/auth/login` → `{ token, expiresAt, user }`.
- [ ] Endpoint `GET /api/auth/me`.

### Frontend
- [ ] `stores/authStore.ts` (zustand + persist localStorage: token, user).
- [ ] `api/client.ts` hoàn thiện: gắn Bearer, parse `ProblemDetail` thành `ApiError`, gặp 401 → clear auth + redirect `/login`.
- [ ] `api/auth.ts`.
- [ ] `hooks/useAuth.ts`.
- [ ] `pages/LoginPage.tsx`.
- [ ] `pages/RegisterPage.tsx`.
- [ ] `components/common/ProtectedRoute.tsx`.
- [ ] `components/common/AppLayout.tsx` (sidebar 5 mục: Dashboard, Vocabulary, Review, AI Tutor, Progress + nút Logout — các mục chưa làm hiển thị placeholder).
- [ ] `router.tsx`.
- [ ] `components/ui/{Button,Input,Card}.tsx` đầu tiên.

### Test
- [ ] `AuthServiceTest` (hash, email trùng → 409).
- [ ] `AuthIntegrationTest` (register → login → me; gọi endpoint bảo vệ không token → 401; token sai → 401).
- [ ] FE test `ProtectedRoute` redirect.

## Definition of Done
- [ ] Đăng ký → tự đăng nhập → thấy layout có sidebar.
- [ ] F5 vẫn giữ phiên.
- [ ] Xoá token trong localStorage → bị đẩy về `/login`.
- [ ] Gọi API bảo vệ không token → 401.
