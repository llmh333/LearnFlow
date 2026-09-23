# Phase 8 — Conversation nâng cao + Deploy

[← Overview](./00-overview.md) · [← Phase 7](./phase-7-daily-plan.md)

- **Milestone cũ:** M12
- **Ước lượng:** 2 ngày (Conversation) + ~1 ngày (Deploy/CI-CD)
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Hoàn thiện trải nghiệm hội thoại, và đưa app lên VPS thật (1 vCPU / 1GB RAM) chạy ổn định qua CI/CD tự
động — không cần thao tác tay mỗi lần deploy.

> Câu hỏi mở đã trả lời trước phase này (xem [Overview §0](./00-overview.md#0-quyết-định-đã-chốt-decision-log)):
> **D14** dùng Supabase free tier thay vì tự host Postgres trên VPS, **D15** kiến trúc 2-image +
> GitHub Actions tự SSH deploy, **D16** không cần export/import trong app, chỉ backup hạ tầng.

## Tasks

### Conversation
- [ ] Role-play theo scenario preset (EN: meeting, interview, restaurant, travel, daily; ZH: restaurant, shopping, work, travel, daily).
- [ ] Không ngắt sửa lỗi giữa chừng.
- [ ] Tổng kết cuối hội thoại: `Mistakes / New vocabulary / Better expressions / Grammar problems`.
- [ ] Tự đẩy lỗi đáng chú ý sang Mistake Book.
- [ ] Từ mới → đề xuất thêm vào Vocabulary.
- [ ] Streaming response qua SSE.

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

- [ ] `backend/Dockerfile` multi-stage: `maven:3.9-eclipse-temurin-21-alpine` build → `eclipse-temurin:21-jre-alpine` runtime. Set `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=50 -XX:+UseSerialGC -Xss256k` (tối ưu RAM cho VPS nhỏ — không set `-Xmx` cứng để JVM tự co giãn theo `MaxRAMPercentage` khi container có memory limit).
- [ ] `frontend/Dockerfile` multi-stage: `node:22-alpine` build `npm run build` → `FROM caddy:2-alpine`, `COPY --from=build /app/dist /srv`, `COPY Caddyfile /etc/caddy/Caddyfile`.
- [ ] `frontend/Caddyfile`: domain thật, `root * /srv`, `file_server`, `reverse_proxy /api/* backend:8080`, `encode gzip`.
- [ ] `docker-compose.yml` thêm profile `prod`: chỉ 2 service `backend` + `frontend` (không có `postgres` — Supabase ở ngoài). `frontend` publish port 80/443, `backend` không publish port ra ngoài (chỉ nội bộ docker network).
- [ ] Backend: `SPRING_DATASOURCE_URL`/`SPRING_DATASOURCE_USERNAME`/`SPRING_DATASOURCE_PASSWORD` trỏ sang connection string Supabase (qua `.env` trên VPS, không commit). Bật `sslmode=require`.
- [ ] Tune cho VPS nhỏ: `spring.datasource.hikari.maximum-pool-size=3` (mặc định 10 — thừa cho 1 user), `server.tomcat.threads.max=10`.
- [ ] Secrets qua env trên VPS (`.env`, không commit — đã có `.gitignore` từ Phase 0).
- [ ] `app.cors.allowed-origins` = domain thật.
- [ ] `app.auth.registration-enabled=false` trên prod (chỉ 1 tài khoản, đăng ký 1 lần lúc setup rồi tắt).
- [ ] Rate limit `/api/auth/login` (bucket4j hoặc filter đơn giản — chống brute-force dù chỉ 1 user).
- [ ] Thêm swap 2GB trên VPS (lệnh vận hành, ghi vào docs, không phải code) — lưới an toàn chống OOM-kill khi có spike, không thay thế cho việc tune RAM đúng.
- [ ] `scripts/backup.sh` — `pg_dump` nhắm vào connection string Supabase (không phải Postgres local), chạy qua cron trên VPS, xoay vòng giữ N bản gần nhất.

### CI/CD — GitHub Actions (D15)

- [ ] `.github/workflows/ci.yml`: chạy `mvn verify` (backend) + `npm run lint && npm run build && npm run test` (frontend) trên mọi PR vào `dev`/`main` — tách biệt với phần deploy bên dưới, không phụ thuộc secret nào.
- [ ] `.github/workflows/deploy.yml`: trigger khi push vào `main`.
  - Job `changes`: dùng `paths-filter` xác định `backend/**` và/hoặc `frontend/**` có đổi không.
  - Job `build-backend` (chỉ chạy nếu `backend` đổi): build + push `ghcr.io/<owner>/learnflow-backend:{latest,sha}`.
  - Job `build-frontend` (chỉ chạy nếu `frontend` đổi): build + push `ghcr.io/<owner>/learnflow-frontend:{latest,sha}`.
  - Job `deploy` (chạy sau khi ít nhất 1 trong 2 job build thành công): SSH vào VPS (`appleboy/ssh-action` hoặc tương đương), chạy `docker compose -f /opt/learnflow/docker-compose.yml --profile prod pull && ... up -d --remove-orphans && docker image prune -f`.
- [ ] **Cần người dùng tự tạo và thêm vào GitHub Secrets** (Claude Code không tự sinh/lưu):
  - `VPS_HOST`, `VPS_USER` — thông tin kết nối VPS.
  - `VPS_SSH_KEY` — **deploy key riêng** (khuyến nghị: tạo user non-root riêng trên VPS chỉ có quyền chạy docker, không dùng key cá nhân/root).
  - Registry `ghcr.io` dùng sẵn `GITHUB_TOKEN` có sẵn của Actions, không cần secret thêm.
- [ ] VPS cần sẵn: Docker + Docker Compose plugin cài sẵn, thư mục `/opt/learnflow` có `docker-compose.yml` (profile `prod`) + `.env` (đã điền `DATABASE_URL` Supabase, `JWT_SECRET`, `ANTHROPIC_API_KEY`, domain) — chuẩn bị thủ công 1 lần lúc setup ban đầu, sau đó CI/CD tự động hoàn toàn.

## Definition of Done
- [ ] `docker compose --profile prod up` chạy được 2 container (`backend`, `frontend`) trỏ đúng Supabase, không có Postgres local.
- [ ] Push code vào `main` → GitHub Actions tự build đúng image đã đổi, tự SSH deploy, VPS chạy bản mới mà không cần thao tác tay.
- [ ] Domain thật truy cập được qua HTTPS (Caddy tự xin chứng chỉ Let's Encrypt).
- [ ] Có script backup chạy thật một lần thành công nhắm vào Supabase.
- [ ] RAM VPS ổn định dưới ~700-800MB lúc chạy bình thường (theo dõi qua `docker stats`/`free -m`), có swap làm lưới an toàn.
