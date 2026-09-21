# Phase 0 — Nền tảng & toolchain

[← Overview](./00-overview.md)

- **Milestone cũ:** —
- **Ước lượng:** 0.5–1 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

`git clone` → chạy được BE + FE + DB trong vài lệnh, có health check xanh, có quy ước ghi thành văn bản.

## Ngoài phạm vi

Bất kỳ entity nghiệp vụ nào, auth, UI thật.

## DB

Chưa có migration (Flyway chỉ cần được wire đúng).

## Tasks

### Toolchain & môi trường
- [ ] `mise.toml` ở gốc: pin `java = "temurin-21"`, `node = "22"`.
- [ ] `mise install` chạy được, kéo Node về máy.

### Docker & env
- [ ] `docker-compose.yml`: chỉ service `postgres:17-alpine`, named volume `learnflow-pgdata`, healthcheck, port 5432. (Service backend/frontend để sau Phase 8 dùng compose profile.)
- [ ] `.env.example` + đọc `.env`: `POSTGRES_*`, `JWT_SECRET`, `ANTHROPIC_API_KEY` (để trống tới P5).

### Backend — `pom.xml`
- [ ] Xoá: `spring-boot-starter-mail`, `spring-boot-starter-quartz`, `spring-boot-starter-mail-test`, `spring-boot-starter-quartz-test`.
- [ ] Thêm: `spring-boot-starter-data-jpa`, `flyway-core`, `flyway-database-postgresql`.
- [ ] Thêm: `io.jsonwebtoken:jjwt-api/jjwt-impl/jjwt-jackson` (0.12.x).
- [ ] Thêm: `spring-boot-testcontainers` + `org.testcontainers:postgresql` + `junit-jupiter` (scope test).
- [ ] Giữ nguyên: security, validation, webmvc, postgresql, lombok, devtools.

### Backend — config
- [ ] `application.yml` + `application-local.yml`: datasource từ env, `flyway.enabled=true`, `jpa.hibernate.ddl-auto=validate`, `jpa.open-in-view=false`, Jackson `non_null` + `WRITE_DATES_AS_TIMESTAMPS=false`.
- [ ] Package `common/config/ClockConfig`.
- [ ] Package `common/error/{GlobalExceptionHandler, NotFoundException, ConflictException}`.
- [ ] Package `common/web/PageResponse`.
- [ ] `HealthController` (public): `GET /api/health` → `{ "status": "UP", "time": "..." }`.

### Frontend
- [ ] Cài `react-router-dom`, `@tanstack/react-query`, `zustand`.
- [ ] Cài `tailwindcss` + `@tailwindcss/vite`.
- [ ] Cài `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom`, thêm script `test`.
- [ ] `vite.config.ts`: thêm tailwind plugin, alias `@ → src`, `server.proxy: { '/api': 'http://localhost:8080' }`.
- [ ] `src/api/client.ts` (khung).
- [ ] `App.tsx` gọi `/api/health` hiển thị trạng thái backend.

### Tài liệu
- [ ] `AGENTS.md` ở gốc repo: copy nguyên mục 1 (Conventions Contract) của `00-overview.md`.
- [ ] `README.md` gốc: 5 lệnh chạy dự án.

### Test
- [ ] `BackendApplicationTests` context load.
- [ ] `npm run build` pass.

## Definition of Done
- [ ] `mise install` → `java -version` ra 21, `node -v` ra 22.
- [ ] `docker compose up -d postgres` → healthy.
- [ ] `./mvnw spring-boot:run` khởi động không lỗi, Flyway kết nối được DB.
- [ ] `npm run dev` → trang hiển thị `Backend: UP`.
- [ ] `./mvnw verify` và `npm run lint && npm run build && npm run test` đều xanh.
