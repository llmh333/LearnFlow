# LearnFlow

Ứng dụng web học ngoại ngữ cá nhân (Anh + Trung + Nhật), phục vụ đúng một người dùng. Backend Java
Spring Boot + PostgreSQL, frontend Vite + React + TypeScript.

Kế hoạch triển khai theo phase: [`plan/phases/`](./plan/phases/00-overview.md). Quy ước code bắt buộc:
[`AGENTS.md`](./AGENTS.md).

## Chạy dự án (dev local)

```bash
# 1. Cài đúng version Java 21 + Node 22
mise install

# 2. Tạo file .env từ mẫu (một lần)
cp .env.example .env

# 3. Chạy Postgres bằng Docker (chỉ Postgres, không chạy backend/frontend trong container)
docker compose --profile dev up -d postgres

# 4. Chạy backend (terminal riêng)
cd backend && ./mvnw spring-boot:run

# 5. Chạy frontend (terminal riêng)
cd frontend && npm install && npm run dev
```

Mở `http://localhost:5173` — trang sẽ hiển thị `Backend: UP` nếu mọi thứ chạy đúng.

## Kiểm tra trước khi mở PR

```bash
cd backend  && ./mvnw verify
cd frontend && npm run lint && npm run build && npm run test
```

## Deploy production (Phase 8)

Kiến trúc: VPS 1 vCPU/1GB chạy 3 container — `postgres` (tự host, không dùng Supabase nữa — xem
D14 reversal), `backend` (Spring Boot JRE), và `frontend` (React build tĩnh do Caddy phục vụ, Caddy
cũng lo HTTPS tự động qua ACME và reverse-proxy `/api/*` sang `backend:8080`). Ban đầu dùng Supabase
free-tier (D14) nhưng đã đổi lại tự host sau khi đo được latency mạng VPS→Supabase ~300-400ms mỗi
request (routing quốc tế của nhà cung cấp VPS không tốt) — self-host loại bỏ hoàn toàn network hop
này. Chi tiết: [`plan/phases/00-overview.md`](./plan/phases/00-overview.md) (D14–D16 + ghi chú reversal).

### CI/CD

- `.github/workflows/ci.yml`: chạy test backend (`mvnw verify`) + frontend (lint/build/test) trên
  mọi PR vào `dev`/`main` và mọi push vào `dev`.
- `.github/workflows/deploy.yml`: khi merge vào `main`, chỉ build lại image (`ghcr.io/<owner>/learnflow-backend`
  hoặc `learnflow-frontend`) của phần đã đổi (path-filtered), rồi SSH vào VPS để `docker compose
  --profile prod pull && up -d`.

Cần các GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (deploy key riêng, không phải key cá nhân).

### Setup lần đầu trên VPS

```bash
mkdir -p /opt/learnflow && cd /opt/learnflow
# copy docker-compose.yml lên đây, tạo .env với các biến:
#   GHCR_OWNER, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD (mật khẩu mạnh, khác default dev),
#   JWT_SECRET, ANTHROPIC_API_KEY, DOMAIN, ACME_EMAIL
docker compose --profile prod up -d
```

### Backup

`scripts/backup.sh` chạy `docker exec learnflow-postgres pg_dump` định kỳ (qua cron trên VPS), nén
gzip, giữ lại `RETENTION_DAYS` ngày gần nhất (mặc định 14). Không có tính năng export/import trong
app (quyết định D16) — backup hoàn toàn ở tầng hạ tầng.
