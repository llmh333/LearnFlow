# Phase 0 — Nền tảng & toolchain

[← Overview](./00-overview.md) · [Phase 1 →](./phase-1-auth-shell.md)

- **Milestone cũ:** —
- **Ước lượng:** 0.5–1 ngày
- **Trạng thái:** [x] Hoàn thành

## Goal

`git clone` → chạy được BE + FE + DB trong vài lệnh, có health check xanh, có quy ước ghi thành văn bản.

## Ngoài phạm vi

Bất kỳ entity nghiệp vụ nào, auth, UI thật.

## DB

Chưa có migration (Flyway chỉ cần được wire đúng).

## Tasks

### Toolchain & môi trường
- [x] `mise.toml` ở gốc: pin `java = "temurin-21"`, `node = "22"`.
- [x] `mise install` chạy được, kéo Node về máy.

### Docker & env
- [x] `docker-compose.yml`: chỉ service `postgres:17-alpine`, named volume `learnflow-pgdata`, healthcheck, port 5432. (Service backend/frontend để sau Phase 8 dùng compose profile.)
- [x] `.env.example` + đọc `.env`: `POSTGRES_*`, `JWT_SECRET`, `ANTHROPIC_API_KEY` (để trống tới P5).

### Backend — `pom.xml`
- [x] Xoá: `spring-boot-starter-mail`, `spring-boot-starter-quartz`, `spring-boot-starter-mail-test`, `spring-boot-starter-quartz-test`.
- [x] Thêm: `spring-boot-starter-data-jpa`, `flyway-core`, `flyway-database-postgresql`.
- [x] Thêm: `io.jsonwebtoken:jjwt-api/jjwt-impl/jjwt-jackson` (0.12.x).
- [x] Thêm: `spring-boot-testcontainers` + Testcontainers Postgres/JUnit5 module (scope test).
  > Lệch nhỏ so với kế hoạch gốc: Testcontainers 2.x (kéo về qua Spring Boot 4.1.1 BOM) đổi tên artifact
  > từ `org.testcontainers:postgresql`/`junit-jupiter` thành `org.testcontainers:testcontainers-postgresql`/
  > `testcontainers-junit-jupiter`. Đã dùng tên mới; import package Java tương ứng cũng đổi, cần lưu ý khi
  > viết `AbstractIntegrationTest` ở Phase 1.
- [x] Giữ nguyên: security, validation, webmvc, postgresql, lombok, devtools.

### Backend — config
- [x] `application.yml` + `application-local.yml`: datasource từ env, `flyway.enabled=true`, `jpa.hibernate.ddl-auto=validate`, `jpa.open-in-view=false`, Jackson `non_null`.
  > Lệch nhỏ: Spring Boot 4.1.1 dùng Jackson 3 (`tools.jackson`), `SerializationFeature` không còn
  > `WRITE_DATES_AS_TIMESTAMPS` — hành vi ISO-8601 cho `Instant` đã là mặc định qua module JSR-310 nên
  > không cần set gì thêm (đã ghi chú trong `application.yml`).
- [x] Package `common/config/ClockConfig`.
- [x] Package `common/error/{GlobalExceptionHandler, NotFoundException, ConflictException}`.
- [x] Package `common/web/PageResponse`.
- [x] `HealthController` (public): `GET /api/health` → `{ "status": "UP", "time": "..." }`.
  > Thêm luôn `common/config/SecurityConfig` tạm thời (`permitAll` toàn bộ, CSRF off) vì
  > `spring-boot-starter-security` trên classpath sẽ tự khoá mọi endpoint bằng user sinh ngẫu nhiên nếu
  > không có config — nếu không thì `/api/health` không public được như DoD yêu cầu. Phase 1 sẽ thay bằng
  > `SecurityConfig` JWT thật.

### Frontend
- [x] Cài `react-router-dom`, `@tanstack/react-query`, `zustand`.
- [x] Cài `tailwindcss` + `@tailwindcss/vite`.
- [x] Cài `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom`, thêm script `test`.
- [x] `vite.config.ts`: thêm tailwind plugin, alias `@ → src`, `server.proxy: { '/api': 'http://localhost:8080' }`.
- [x] `src/api/client.ts` (khung).
- [x] `App.tsx` gọi `/api/health` hiển thị trạng thái backend.
  > Đã xoá trang demo mặc định của Vite scaffold (App.css, assets hero/react/vite svg) vì Phase 0 không
  > giữ UI mẫu — `index.css` chỉ còn `@import "tailwindcss";`.

### Tài liệu
- [x] `AGENTS.md` ở gốc repo: copy nguyên mục 1 (Conventions Contract) của `00-overview.md`.
- [x] `README.md` gốc: 5 lệnh chạy dự án.

### Test
- [x] `BackendApplicationTests` context load.
- [x] `npm run build` pass.
- [x] FE test smoke cho `App.tsx` (trạng thái "checking" trước khi health resolve) — thêm ngoài checklist gốc để có ít nhất 1 test chạy qua `npm run test`.

## Definition of Done
- [x] `mise install` → `java -version` ra 21, `node -v` ra 22.
- [x] `docker compose up -d postgres` → healthy.
- [x] `./mvnw spring-boot:run` khởi động không lỗi, Flyway kết nối được DB.
- [x] `npm run dev` → trang hiển thị `Backend: UP` (verify qua proxy `/api/health` khi cả hai server chạy).
- [x] `./mvnw verify` và `npm run lint && npm run build && npm run test` đều xanh.
