# Phase 7 — Daily Plan

[← Overview](./00-overview.md) · [← Phase 6](./phase-6-mistake-book.md) · [Phase 8 →](./phase-8-conversation-deploy.md)

- **Milestone cũ:** M11
- **Ước lượng:** 2 ngày
- **Trạng thái:** [x] Hoàn thành

## Goal

Trả lời trọn vẹn câu hỏi "hôm nay tôi nên học gì", với số liệu do ứng dụng tính — AI chỉ diễn đạt.

> Câu hỏi mở đã trả lời trước phase này: **D13** — số "từ mới mỗi ngày" do **engine tự tính** theo thời
> gian rảnh còn lại sau khi trừ thời gian ôn từ due, không cố định/không cần Settings.

## Tasks

### Backend
- [x] `V8__create_daily_plan.sql`: `daily_plan` (date, available_minutes, created_at).
  > Thêm cột `intro TEXT` (không có trong checklist gốc) để lưu câu mở đầu AI sinh ra — cần chỗ lưu để
  > `GET /today` trả lại đúng nội dung đã sinh, không phải gọi lại AI mỗi lần xem.
- [x] `V8__create_daily_plan.sql`: `daily_plan_item` (plan_id, language_id, minutes, kind, description, target_ref, completed).
- [x] `dailyplan/PlanningEngine` — deterministic, pure, không AI: input `availableMinutes` + số liệu từ `ReviewService`/`ProgressService`/`MistakeService` → output danh sách item.
  > Thực tế chỉ cần `ReviewService.countDue()` (không cần `ProgressService` — dữ liệu due đã đủ) +
  > `MistakeService.recurring(language, 1)` (lỗi lặp nhiều nhất làm chủ đề bài tập ngữ pháp).
  > `PlanningEngine` bản thân **không** import bất kỳ Service nào — nó là pure function nhận sẵn
  > `List<LanguageDemand>` (đã tính `dueCount`/`weakTopic` từ bên ngoài) rồi ra `DailyPlanDraft`, đúng
  > tinh thần `srs.engine.Sm2Algorithm` (thuần, test được không cần Spring/DB).
- [x] `PlanningEngine`: phân bổ phút theo tỉ lệ due count giữa các ngôn ngữ.
  > Thuật toán largest-remainder để tổng phút phân bổ luôn khớp chính xác `availableMinutes` (không lệch
  > do làm tròn). Không ngôn ngữ nào due → chia đều.
- [x] `dailyplan/DailyPlanService` gọi `PlanningEngine` trước, rồi đưa kết quả cho `AIProvider.generateDailyPlan` chỉ để viết mô tả task (AI không được đổi số phút / số từ).
  > Thực tế AI chỉ viết 1 đoạn "intro" ngắn 2-3 câu tạo động lực cho cả kế hoạch — **không** viết lại
  > từng mô tả item riêng lẻ (các mô tả "Review N overdue words", "Grammar exercise: X" đã đủ rõ và do
  > `PlanningEngine` sinh ra nguyên văn). Cách này đảm bảo tuyệt đối AI không thể chạm vào số liệu:
  > `DailyPlanContext` gửi cho AI chỉ là chuỗi mô tả đã render sẵn, không phải object có thể sửa.
  > `AIProviderException` (vd chưa có `ANTHROPIC_API_KEY`) được bắt và bỏ qua — `intro` = null, kế
  > hoạch vẫn sinh ra bình thường (graceful degrade, giống Phase 5).
- [x] Endpoint `POST /api/daily-plan/generate { availableMinutes }`.
  > Gọi lại trong cùng ngày sẽ **cập nhật** plan hiện có (xoá item cũ, tạo lại) thay vì tạo bản ghi mới —
  > `daily_plan.plan_date` là UNIQUE.
- [x] Endpoint `GET /api/daily-plan/today`.
- [x] Endpoint `PATCH /api/daily-plan/item/{id} { completed }`.

### Frontend
- [x] `components/dashboard/TodayPlanCard.tsx` (thay placeholder ở P4) — nhập số phút → sinh kế hoạch → tick từng item.
  > Nhóm item theo ngôn ngữ, hiển thị intro AI (nếu có), checkbox tick từng item gọi PATCH ngay. Nút
  > "Regenerate" quay lại form nhập phút.

### Test
- [x] `PlanningEngineTest`: nhiều mốc phút.
- [x] `PlanningEngineTest`: 1 vs 2 ngôn ngữ.
- [x] `PlanningEngineTest`: không có từ due.
- [x] `PlanningEngineTest`: thiếu thời gian.
  > Phủ cả 2 mức: "thiếu vừa" (gộp hết vào 1 item conversation ngắn) và "thiếu cực độ" (< 3 phút, không
  > sinh item nào — trả kế hoạch rỗng thay vì ép tạo item vô nghĩa).
- [x] Test khẳng định output AI không làm thay đổi số liệu engine đã tính.
  > `DailyPlanServiceTest#generate_aiProviderFails_stillReturnsAPlanWithoutIntro` — khi AI lỗi hoàn
  > toàn, toàn bộ số liệu/item vẫn nguyên vẹn, chỉ thiếu `intro`. Vì kiến trúc gửi AI *chuỗi mô tả đã
  > render sẵn* (không phải số/object có thể sửa) và chỉ nhận lại 1 `String` độc lập gán vào `intro`,
  > việc AI "làm thay đổi số liệu" **không thể xảy ra về mặt kiểu dữ liệu** — không cần thêm test kiểm
  > tra "AI trả về số khác nhưng bị bỏ qua" vì AI chưa từng nhận được số để trả lại.

## Definition of Done
- [x] Nhập `45 minutes` → nhận kế hoạch đúng cấu trúc `PROJECT.md` §4.7. **Verify thật bằng curl**: tạo
  3 từ tiếng Anh + 1 mistake "Grammar/Past tense", gọi `POST /daily-plan/generate {"availableMinutes":45}`
  → nhận đúng cấu trúc theo ngôn ngữ, mỗi item có `minutes`/`kind`/`description`, tổng khớp cấu trúc ví
  dụ trong PROJECT.md (Review/Learn/Grammar/Conversation).
- [x] Tick item → Dashboard cập nhật. **Verify thật bằng curl**: `PATCH /daily-plan/item/{id}
  {"completed":true}` → trả về đúng item với `completed:true`; frontend checkbox gọi cùng endpoint qua
  `useUpdatePlanItem`, invalidate cache để `TodayPlanCard` tự re-render.

**Cổng kiểm tra đã chạy xanh hết:** `cd backend && ./mvnw verify` (106/106 test pass, gồm
`PlanningEngineTest` 11 case, `DailyPlanServiceTest`, `DailyPlanIntegrationTest` qua Testcontainers
Postgres thật) và `cd frontend && npm run lint && npm run build && npm run test` (9/9 test pass).

**Lưu ý branch:** Phase 6 (Mistake Book) chưa merge vào `dev` tại thời điểm làm Phase 7 (PR #8 đang chờ),
nên branch `phase/7-daily-plan` được tạo từ `phase/6-mistake-book` cục bộ (không phải từ `dev`) để có đủ
`MistakeService` mà `PlanningEngine`/`DailyPlanService` cần. PR của Phase 7 vì vậy sẽ nhắm vào `dev` và sẽ
gồm cả các thay đổi của Phase 6 cho tới khi PR #8 merge trước — không có gì bất thường, chỉ cần merge theo
đúng thứ tự (Phase 6 trước Phase 7).
