# Phase 5 — AI Tutor ⟶ MỐC B (MVP đủ 5 màn hình)

[← Overview](./00-overview.md) · [← Phase 4](./phase-4-study-dashboard.md) · [Phase 6 →](./phase-6-mistake-book.md)

- **Milestone cũ:** M8
- **Ước lượng:** 2–3 ngày
- **Trạng thái:** [x] Hoàn thành

## Goal

Trợ lý AI hoạt động trên dữ liệu thật, trong ranh giới cứng — không đụng tới SRS.

> Câu hỏi mở đã trả lời trước phase này (xem [Overview §0](./00-overview.md#0-quyết-định-đã-chốt-decision-log)):
> **D11** trình độ hiện tại suy ra tự động từ vocabulary đã học (không thêm Settings), **D12** tone AI thân
> thiện/khích lệ.

## Tasks

### Backend
- [x] `V6__create_ai_conversation.sql`: `ai_conversation`, `ai_message`.
- [x] `ai/provider/AIProvider` interface + các record request/response (`GrammarExplainRequest`, `SentenceCorrection`, `ConversationTurn`, ...).
  > Interface gồm 5 method khớp đúng 5 hành động của MVP: `explainGrammar`, `generateExamples`,
  > `correctSentence`, `continueConversation`, `summarizeConversation`. `analyzeMistake`/
  > `generateExercise`/`generateDailyPlan` (nhắc tới trong plan kỹ thuật gốc) chưa cần ở Phase 5 — sẽ
  > thêm khi tới Phase 6 (Mistake Book) / Phase 7 (Daily Plan).
- [x] `ai/provider/ClaudeAIProvider`: gọi Anthropic Messages API qua `RestClient`, model `claude-sonnet-5`, key từ env `ANTHROPIC_API_KEY` (không hardcode, không lưu DB).
- [x] `ClaudeAIProvider`: ép JSON bằng tool-use / structured output thay vì parse free text.
  > Áp dụng cho `generateExamples` (tool `generate_examples`) và `correctSentence` (tool
  > `correct_sentence`) — 2 tác vụ thật sự cần dữ liệu có cấu trúc. `explainGrammar`/hội thoại/tổng kết
  > dùng text thường vì bản chất là văn xuôi tự do.
- [x] `ClaudeAIProvider`: timeout 60s, retry 1 lần, log token usage.
- [x] Chọn provider qua `app.ai.provider=claude` + `@ConditionalOnProperty`.
- [x] `ai/context/AIContextBuilder`: dựng context giới hạn — top-N từ due/weak, trình độ hiện tại, N message gần nhất.
  > Đọc dữ liệu qua `srs.ReviewService.allSchedules()` (Service công khai, không phải repository) — mở
  > rộng `ScheduleSnapshot` (Phase 4) thêm field `attributes` để suy ra level (D11). Top 10 từ yếu nhất
  > theo ease factor. N message gần nhất của hội thoại lấy trực tiếp trong `AiTutorService` (không qua
  > context builder vì đó là dữ liệu của chính `ai` module, không phải dữ liệu học tập).
- [x] `ai/domain/{AIConversation, AIMessage}`.
- [x] `ai/AiTutorService`.
- [x] `ai/AiTutorController`.
- [x] Endpoint `POST /api/ai/grammar/explain`.
- [x] Endpoint `POST /api/ai/examples/generate`.
- [x] Endpoint `POST /api/ai/sentence/correct`.
- [x] Endpoint `POST /api/ai/conversation/{id?}/message`.
  > Spring MVC không hỗ trợ `{id?}` optional path variable trực tiếp — tách thành 2 endpoint:
  > `POST /api/ai/conversation/message` (tạo mới) và `POST /api/ai/conversation/{id}/message` (tiếp tục).
- [x] Endpoint `POST /api/ai/conversation/{id}/end`.
- [x] Endpoint `GET /api/ai/conversations`.
  > Thêm `GET /api/ai/conversations/{id}` (không có trong checklist gốc) để thực sự "mở lại xem được"
  > đúng như DoD yêu cầu — list chỉ trả tóm tắt, cần endpoint riêng lấy đủ message.
- [x] Thêm dependency test `com.tngtech.archunit:archunit-junit5`.
- [x] `ArchitectureTest`: package `..ai..` không được depend vào `..srs..repository..` hay `..srs..domain..`.
  > Repository của `srs` thực tế nằm cùng cấp package `com.learnflow.backend.srs` (không có
  > sub-package `repository`) — rule viết theo tên class kết thúc bằng `Repository` trong `..srs..`
  > thay vì theo sub-package, để đúng tinh thần ("ai không được đụng repository của srs") mà vẫn khớp
  > cấu trúc thật.
- [x] `ArchitectureTest`: `..controller` (class `*Controller`) không được depend vào `*Repository`.

### Frontend
- [x] `api/ai.ts`.
- [x] `hooks/useAiTutor.ts`.
- [x] `pages/AiTutorPage.tsx` với 3 mode tab: `Ask` (giải thích ngữ pháp) / `Correct` (sửa câu) / `Chat` (hội thoại).
- [x] `components/ai-tutor/ChatWindow.tsx`.
- [x] `components/ai-tutor/MessageBubble.tsx`.
- [x] `components/ai-tutor/ModeTabs.tsx`.
- [x] `components/ai-tutor/ConversationList.tsx`.
  > `examples/generate` có API backend nhưng chưa có tab riêng ở frontend (checklist chỉ yêu cầu đúng 3
  > tab Ask/Correct/Chat) — để dành gắn vào màn Vocabulary sau nếu cần, không thuộc phạm vi Phase 5.
- [x] Non-streaming cho phase này (streaming để Phase 8).
- [x] Trạng thái loading/error rõ ràng (AI có thể chậm hoặc lỗi — không được làm vỡ UI).

### Test
- [x] `AIContextBuilderTest` (giới hạn đúng N, không rò dữ liệu thừa).
- [x] `AiTutorServiceTest` với `AIProvider` mock.
- [x] `ArchitectureTest` xanh.
- [x] Xác nhận: không test nào gọi API thật.

## Definition of Done
- [x] Hỏi ngữ pháp có trả lời hợp lý theo trình độ. (Logic verify qua `AiTutorServiceTest` +
  `AIContextBuilderTest`; **không verify bằng cú gọi Claude thật** vì chưa có `ANTHROPIC_API_KEY` — xem
  ghi chú bên dưới.)
- [x] Sửa câu trả về câu đúng + lý do. (Cùng ghi chú trên — cấu trúc response đã chốt, nội dung thật cần
  key thật để verify.)
- [x] Hội thoại lưu lại và mở lại xem được. (`AIConversation`/`AIMessage` + endpoint
  `GET /api/ai/conversations/{id}` — verify qua `AiTutorServiceTest`.)
- [x] API key sai → lỗi hiển thị tử tế, không crash. **Verify thật bằng curl** (xem bên dưới) — vì `.env`
  hiện chưa có `ANTHROPIC_API_KEY`, đây chính xác là tình huống "key sai/thiếu" thật, không phải giả lập.
- [x] ArchUnit xanh.
- [x] **MVP đủ 5 màn hình theo PROJECT.md §9 (Mốc B đạt).** Dashboard, Vocabulary, Review, AI Tutor,
  Progress đều đã có UI thật.

**Verify thật (curl + docker-compose Postgres + backend chạy thật):** gọi `POST /api/ai/grammar/explain`
mà không có `ANTHROPIC_API_KEY` hợp lệ → log cho thấy `ClaudeAIProvider` gọi thật tới
`api.anthropic.com`, nhận `401 Unauthorized`, **retry đúng 1 lần**, rồi ném `AIProviderException` →
`AiExceptionHandler` trả `HTTP 502` kèm message thân thiện `"AI service is temporarily unavailable.
Please try again."` — không có stack trace lộ ra client, không crash server. `GET /api/ai/conversations`
(không cần gọi AI) trả `200 []` bình thường; `GET /api/ai/conversations/999` (không tồn tại) trả `404`.

> **Còn thiếu để verify đầy đủ nội dung AI thật** (không chặn merge phase, đã trao đổi với người dùng —
> họ sẽ tự điền `ANTHROPIC_API_KEY` vào `.env` sau khi review code): chất lượng câu trả lời thật từ
> Claude (giải thích ngữ pháp đúng trình độ, sửa câu đúng, hội thoại tự nhiên, tổng kết hợp lý) chưa được
> verify bằng lời gọi API thật — toàn bộ logic xung quanh (context, lưu trữ, lỗi) đã verify chắc chắn.

**Cổng kiểm tra đã chạy xanh hết:** `cd backend && ./mvnw verify` (82/82 test pass — không test nào gọi
Claude API thật, tất cả mock `AIProvider`) và `cd frontend && npm run lint && npm run build && npm run
test` (9/9 test pass).
