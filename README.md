# LearnFlow

Ứng dụng web học ngoại ngữ có lộ trình, ưu tiên tiếng Nhật (Kana → N5 → N3). Backend Java
Spring Boot + PostgreSQL, frontend Vite + React + TypeScript.

Kế hoạch refactor: [`plan/2026-11-17-japanese-learning-path-refactor.md`](./plan/2026-11-17-japanese-learning-path-refactor.md).
Quy ước code bắt buộc: [`AGENTS.md`](./AGENTS.md).

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

## Deploy production

Kiến trúc: VPS 1 vCPU/1GB chạy 3 container — `postgres` (tự host), `backend` (Spring Boot JRE), và
`frontend` (React build tĩnh do Caddy phục vụ, Caddy cũng lo HTTPS tự động qua ACME và reverse-proxy
`/api/*` sang `backend:8080`). Postgres tự host thay vì dịch vụ managed vì latency mạng từ VPS tới
Supabase đo được ~300-400ms mỗi request.

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
#   JWT_SECRET, AI_PROVIDER (claude|gemini|groq), key tương ứng, DOMAIN, ACME_EMAIL
docker compose --profile prod up -d
```

### AI provider

AI Tutor hỗ trợ 3 provider chọn được qua `AI_PROVIDER` trong `.env` (không cần đổi code hay build
lại image) — `claude` (mặc định, cần `ANTHROPIC_API_KEY`), `gemini` (cần `GEMINI_API_KEY`, key từ
Google AI Studio — lưu ý free tier chỉ 20 request/ngày cho model mặc định), hoặc `groq` (cần
`GROQ_API_KEY`, key từ console.groq.com). Đổi xong, `docker compose --profile prod up -d backend`
để áp dụng.

### Backup

`scripts/backup.sh` chạy `docker exec learnflow-postgres pg_dump` định kỳ (qua cron trên VPS), nén
gzip, giữ lại `RETENTION_DAYS` ngày gần nhất (mặc định 14). Không có tính năng export/import trong
app — backup hoàn toàn ở tầng hạ tầng.
