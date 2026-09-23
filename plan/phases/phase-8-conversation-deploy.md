# Phase 8 — Conversation nâng cao + Deploy

[← Overview](./00-overview.md) · [← Phase 7](./phase-7-daily-plan.md)

- **Milestone cũ:** M12
- **Ước lượng:** 2 ngày (Conversation) + ~1 ngày (Deploy/CI-CD)
- **Trạng thái:** [x] Hoàn thành — đã deploy thật, verify OK trên `https://leminhi.id.vn`

> **Cập nhật sau khi deploy thật (D17, xem Overview):** Supabase (D14) bị revert — đo được
> latency mạng VPS→Supabase ~300-400ms/request (routing quốc tế của nhà cung cấp VPS), gây cảm
> giác app chậm. Đã quay lại tự host Postgres trên VPS (3 container thay vì 2). Phần "Deploy —
> kiến trúc" bên dưới giữ nguyên làm lịch sử quyết định ban đầu; kiến trúc **thật sự đang chạy**
> là 3 container `postgres` + `backend` + `frontend`, xem D17.

## Goal

Hoàn thiện trải nghiệm hội thoại, và đưa app lên VPS thật (1 vCPU / 1GB RAM) chạy ổn định qua CI/CD tự
động — không cần thao tác tay mỗi lần deploy.

> Câu hỏi mở đã trả lời trước phase này (xem [Overview §0](./00-overview.md#0-quyết-định-đã-chốt-decision-log)):
> **D14** dùng Supabase free tier thay vì tự host Postgres trên VPS, **D15** kiến trúc 2-image +
> GitHub Actions tự SSH deploy, **D16** không cần export/import trong app, chỉ backup hạ tầng.

## Tasks

### Conversation
- [x] Role-play theo scenario preset (EN: meeting, interview, restaurant, travel, daily; ZH: restaurant, shopping, work, travel, daily — JA dùng chung bộ với ZH, không có trong PROJECT.md gốc nhưng app đã hỗ trợ JA theo D9).
- [x] Không ngắt sửa lỗi giữa chừng.
- [x] Tổng kết cuối hội thoại: `Mistakes / New vocabulary / Better expressions / Grammar problems`.
- [x] Tự đẩy lỗi đáng chú ý sang Mistake Book.
- [x] Từ mới → đề xuất thêm vào Vocabulary.
- [x] Streaming response qua SSE.

### Deploy — kiến trúc (D14 + D15)

VPS chỉ có 1GB RAM nên **không tự host Postgres**: dùng **Supabase free tier** làm database, VPS chỉ chạy
đúng **2 container**:

```
┌─────────────────────────── VPS (1 vCPU / 1GB RAM) ───────────────────────────┐
│                                                                                 │
│  ┌──────────────────────┐        ┌──────────────────────────────────────┐    │
│  │  backend              │        │  frontend                              │    │
│  │  (Spring Boot, JRE)    │◄──────┤  FROM caddy:alpine                     │    │
│  │  port 8080 (internal)  │        │  + dist/ (React build) + Caddyfile     │    │
│  │                        │        │  → serve static + HTTPS (Let's        │    │
│  │                        │        │    Encrypt tự động) + reverse-proxy   │    │
│  │                        │        │    /api/* → backend:8080              │    │
│  └──────────────────────┘        └───────────────┬──────────────────────┘    │
│                                                     │ 80/443                    │
└─────────────────────────────────────────────────────┼──────────────────────────┘
                                                        ▼
                                                   Internet (domain thật)

                              Backend ──── DATABASE_URL ────► Supabase (Postgres managed, free tier)
```

- [x] `backend/Dockerfile` multi-stage: `maven:3.9-eclipse-temurin-21-alpine` build → `eclipse-temurin:21-jre-alpine` runtime. Set `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=50 -XX:+UseSerialGC -Xss256k` (tối ưu RAM cho VPS nhỏ — không set `-Xmx` cứng để JVM tự co giãn theo `MaxRAMPercentage` khi container có memory limit).
- [x] `frontend/Dockerfile` multi-stage: `node:22-alpine` build `npm run build` → `FROM caddy:2-alpine`, `COPY --from=build /app/dist /srv`, `COPY Caddyfile /etc/caddy/Caddyfile`.
- [x] `frontend/Caddyfile`: domain thật (`{$DOMAIN}`), `root * /srv`, `file_server`, `try_files` cho SPA fallback, `handle /api/* { reverse_proxy backend:8080 }`, `encode gzip`, global `email {$ACME_EMAIL}` cho ACME.
- [x] `docker-compose.yml` thêm profile `prod`: chỉ 2 service `backend` + `frontend` (không có `postgres` — Supabase ở ngoài, `postgres` chuyển sang profile `dev`). `frontend` publish port 80/443, `backend` chỉ `expose` nội bộ docker network.
- [x] Backend: `SPRING_DATASOURCE_URL`/`SPRING_DATASOURCE_USERNAME`/`SPRING_DATASOURCE_PASSWORD` trỏ sang connection string Supabase qua `.env` trên VPS (không commit) — `sslmode=require` là trách nhiệm của connection string Supabase cấp sẵn.
- [x] Tune cho VPS nhỏ (`application-prod.yml`): `spring.datasource.hikari.maximum-pool-size=3`, `server.tomcat.threads.max=10`.
- [x] Secrets qua env trên VPS (`.env`, không commit — đã có `.gitignore` từ Phase 0).
- [x] `app.cors.allowed-origins` = domain thật (`APP_CORS_ALLOWED_ORIGINS=https://${DOMAIN}` trong `docker-compose.yml`).
- [x] `app.auth.registration-enabled=false` trên prod (`application-prod.yml`).
- [x] Rate limit `/api/auth/login`: `LoginRateLimitFilter` (in-memory fixed-window, 10 lần/5 phút theo IP) — không dùng bucket4j để tránh thêm dependency cho nhu cầu 1-user; tắt dưới `@Profile("!test")` vì state của filter là singleton dùng chung suốt cả integration test suite.
- [ ] Thêm swap 2GB trên VPS (lệnh vận hành lúc setup thật trên VPS — chưa thực hiện, cần chạy tay khi có quyền truy cập VPS thật).
- [x] `scripts/backup.sh` — `pg_dump` nhắm vào `DATABASE_URL` (Supabase), nén gzip, xoay vòng giữ `RETENTION_DAYS` (mặc định 14) bản gần nhất, chạy qua cron trên VPS.

### CI/CD — GitHub Actions (D15)

- [x] `.github/workflows/ci.yml`: chạy `./mvnw verify` (backend) + `npm run lint && npm run build && npm run test` (frontend) trên mọi PR vào `dev`/`main` và push vào `dev` — tách biệt với phần deploy bên dưới, không phụ thuộc secret nào.
- [x] `.github/workflows/deploy.yml`: trigger khi push vào `main`.
  - Job `changes`: dùng `dorny/paths-filter` xác định `backend/**` và/hoặc `frontend/**` có đổi không.
  - Job `build-backend` (chỉ chạy nếu `backend` đổi): build + push `ghcr.io/<owner>/learnflow-backend:{latest,sha}`.
  - Job `build-frontend` (chỉ chạy nếu `frontend` đổi): build + push `ghcr.io/<owner>/learnflow-frontend:{latest,sha}`.
  - Job `deploy` (chạy sau `changes`+2 job build, `if: always() && !failure() && !cancelled()` nên vẫn chạy khi 1 trong 2 job build bị skip vì không đổi): SSH vào VPS qua `appleboy/ssh-action`, chạy `docker compose --profile prod pull && ... up -d --remove-orphans && docker image prune -f`.
- [x] Workflow đã viết xong, dùng đúng tên secret theo kế hoạch: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (đã được thêm vào GitHub Secrets ở bước chuẩn bị VPS trước đó — deploy key riêng, không phải key cá nhân/root). Registry `ghcr.io` dùng `GITHUB_TOKEN` có sẵn của Actions.
- [ ] VPS cần sẵn thủ công 1 lần: Docker + Docker Compose plugin, thư mục `/opt/learnflow` có `docker-compose.yml` (profile `prod`) + `.env` (điền `DATABASE_URL` Supabase, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `DOMAIN`, `ACME_EMAIL`) — **chưa thực hiện**, cần thông tin Supabase + domain thật từ người dùng trước khi deploy lần đầu.

## Definition of Done
- [x] `docker compose --profile prod up` chạy được 2 container (`backend`, `frontend`), không có Postgres local — cấu hình đã sẵn sàng, đã verify qua build (`./mvnw verify`, `npm run build`), chưa chạy thật trên VPS.
- [x] CI/CD workflow (`ci.yml` + `deploy.yml`) đã viết đúng theo kiến trúc build-changed-then-ssh-deploy — chưa verify bằng 1 lần deploy thật (cần push lên `main` + VPS đã setup).
- [ ] Domain thật truy cập được qua HTTPS (Caddy tự xin chứng chỉ Let's Encrypt) — cần domain thật + VPS setup, ngoài phạm vi tự động hóa của phiên làm việc này.
- [x] `scripts/backup.sh` đã viết, chưa chạy thật một lần nhắm vào Supabase (cần connection string thật).
- [ ] RAM VPS ổn định dưới ~700-800MB lúc chạy bình thường, có swap 2GB làm lưới an toàn — cần verify trên VPS thật sau khi deploy.
