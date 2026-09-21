# Phase 8 — Conversation nâng cao + Deploy

[← Overview](./00-overview.md) · [← Phase 7](./phase-7-daily-plan.md)

- **Milestone cũ:** M12
- **Ước lượng:** 2 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Hoàn thiện trải nghiệm hội thoại và đưa app lên VPS chạy ổn định.

> Câu hỏi mở cần trả lời trước phase này (xem [Overview §5](./00-overview.md#5-câu-hỏi-còn-mở-không-chặn-p0p4)):
> có cần export/import dữ liệu (CSV/JSON) trong app, hay chỉ dựa vào `pg_dump`.

## Tasks

### Conversation
- [ ] Role-play theo scenario preset (EN: meeting, interview, restaurant, travel, daily; ZH: restaurant, shopping, work, travel, daily).
- [ ] Không ngắt sửa lỗi giữa chừng.
- [ ] Tổng kết cuối hội thoại: `Mistakes / New vocabulary / Better expressions / Grammar problems`.
- [ ] Tự đẩy lỗi đáng chú ý sang Mistake Book.
- [ ] Từ mới → đề xuất thêm vào Vocabulary.
- [ ] Streaming response qua SSE.

### Deploy
- [ ] `backend/Dockerfile` multi-stage (maven build → JRE 21 slim).
- [ ] `frontend/Dockerfile` (node build → nginx).
- [ ] `docker-compose.yml` thêm profile `full`: postgres + backend + frontend.
- [ ] Reverse proxy (Caddy) lo HTTPS.
- [ ] Secrets qua env, `.env` không commit.
- [ ] `app.cors.allowed-origins` = domain thật.
- [ ] `app.auth.registration-enabled=false` trên prod.
- [ ] Rate limit `/api/auth/login` (bucket4j hoặc filter đơn giản).
- [ ] `scripts/backup.sh` — `pg_dump` định kỳ.

## Definition of Done
- [ ] `docker compose --profile full up` chạy toàn bộ stack.
- [ ] Deploy VPS được.
- [ ] Có script backup chạy thật một lần thành công.
