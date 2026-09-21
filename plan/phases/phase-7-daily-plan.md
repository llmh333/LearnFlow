# Phase 7 — Daily Plan

[← Overview](./00-overview.md) · [← Phase 6](./phase-6-mistake-book.md) · [Phase 8 →](./phase-8-conversation-deploy.md)

- **Milestone cũ:** M11
- **Ước lượng:** 2 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Trả lời trọn vẹn câu hỏi "hôm nay tôi nên học gì", với số liệu do ứng dụng tính — AI chỉ diễn đạt.

> Câu hỏi mở cần trả lời trước phase này (xem [Overview §5](./00-overview.md#5-câu-hỏi-còn-mở-không-chặn-p0p4)):
> số "từ mới mỗi ngày" cố định / cấu hình / engine tự tính.

## Tasks

### Backend
- [ ] `V8__create_daily_plan.sql`: `daily_plan` (date, available_minutes, created_at).
- [ ] `V8__create_daily_plan.sql`: `daily_plan_item` (plan_id, language_id, minutes, kind, description, target_ref, completed).
- [ ] `dailyplan/PlanningEngine` — deterministic, pure, không AI: input `availableMinutes` + số liệu từ `ReviewService`/`ProgressService`/`MistakeService` → output danh sách item.
- [ ] `PlanningEngine`: phân bổ phút theo tỉ lệ due count giữa các ngôn ngữ.
- [ ] `dailyplan/DailyPlanService` gọi `PlanningEngine` trước, rồi đưa kết quả cho `AIProvider.generateDailyPlan` chỉ để viết mô tả task (AI không được đổi số phút / số từ).
- [ ] Endpoint `POST /api/daily-plan/generate { availableMinutes }`.
- [ ] Endpoint `GET /api/daily-plan/today`.
- [ ] Endpoint `PATCH /api/daily-plan/item/{id} { completed }`.

### Frontend
- [ ] `components/dashboard/TodayPlanCard.tsx` (thay placeholder ở P4) — nhập số phút → sinh kế hoạch → tick từng item.

### Test
- [ ] `PlanningEngineTest`: nhiều mốc phút.
- [ ] `PlanningEngineTest`: 1 vs 2 ngôn ngữ.
- [ ] `PlanningEngineTest`: không có từ due.
- [ ] `PlanningEngineTest`: thiếu thời gian.
- [ ] Test khẳng định output AI không làm thay đổi số liệu engine đã tính.

## Definition of Done
- [ ] Nhập `45 minutes` → nhận kế hoạch đúng cấu trúc `PROJECT.md` §4.7.
- [ ] Tick item → Dashboard cập nhật.
