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
docker compose up -d postgres

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
