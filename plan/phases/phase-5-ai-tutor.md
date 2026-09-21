# Phase 5 — AI Tutor ⟶ MỐC B (MVP đủ 5 màn hình)

[← Overview](./00-overview.md) · [← Phase 4](./phase-4-study-dashboard.md) · [Phase 6 →](./phase-6-mistake-book.md)

- **Milestone cũ:** M8
- **Ước lượng:** 2–3 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Trợ lý AI hoạt động trên dữ liệu thật, trong ranh giới cứng — không đụng tới SRS.

> Câu hỏi mở cần trả lời trước phase này (xem [Overview §5](./00-overview.md#5-câu-hỏi-còn-mở-không-chặn-p0p4)):
> trình độ hiện tại (CEFR/HSK) khai báo thế nào, tone giọng AI.

## Tasks

### Backend
- [ ] `V6__create_ai_conversation.sql`: `ai_conversation`, `ai_message`.
- [ ] `ai/provider/AIProvider` interface + các record request/response (`GrammarExplainRequest`, `SentenceCorrection`, `ConversationTurn`, ...).
- [ ] `ai/provider/ClaudeAIProvider`: gọi Anthropic Messages API qua `RestClient`, model `claude-sonnet-5`, key từ env `ANTHROPIC_API_KEY` (không hardcode, không lưu DB).
- [ ] `ClaudeAIProvider`: ép JSON bằng tool-use / structured output thay vì parse free text.
- [ ] `ClaudeAIProvider`: timeout 60s, retry 1 lần, log token usage.
- [ ] Chọn provider qua `app.ai.provider=claude` + `@ConditionalOnProperty`.
- [ ] `ai/context/AIContextBuilder`: dựng context giới hạn — top-N từ due/weak, trình độ hiện tại, N message gần nhất.
- [ ] `ai/domain/{AIConversation, AIMessage}`.
- [ ] `ai/AiTutorService`.
- [ ] `ai/AiTutorController`.
- [ ] Endpoint `POST /api/ai/grammar/explain`.
- [ ] Endpoint `POST /api/ai/examples/generate`.
- [ ] Endpoint `POST /api/ai/sentence/correct`.
- [ ] Endpoint `POST /api/ai/conversation/{id?}/message`.
- [ ] Endpoint `POST /api/ai/conversation/{id}/end`.
- [ ] Endpoint `GET /api/ai/conversations`.
- [ ] Thêm dependency test `com.tngtech.archunit:archunit-junit5`.
- [ ] `ArchitectureTest`: package `..ai..` không được depend vào `..srs..repository..` hay `..srs..domain..`.
- [ ] `ArchitectureTest`: `..controller` (class `*Controller`) không được depend vào `*Repository`.

### Frontend
- [ ] `api/ai.ts`.
- [ ] `hooks/useAiTutor.ts`.
- [ ] `pages/AiTutorPage.tsx` với 3 mode tab: `Ask` (giải thích ngữ pháp) / `Correct` (sửa câu) / `Chat` (hội thoại).
- [ ] `components/ai-tutor/ChatWindow.tsx`.
- [ ] `components/ai-tutor/MessageBubble.tsx`.
- [ ] `components/ai-tutor/ModeTabs.tsx`.
- [ ] `components/ai-tutor/ConversationList.tsx`.
- [ ] Non-streaming cho phase này (streaming để Phase 8).
- [ ] Trạng thái loading/error rõ ràng (AI có thể chậm hoặc lỗi — không được làm vỡ UI).

### Test
- [ ] `AIContextBuilderTest` (giới hạn đúng N, không rò dữ liệu thừa).
- [ ] `AiTutorServiceTest` với `AIProvider` mock.
- [ ] `ArchitectureTest` xanh.
- [ ] Xác nhận: không test nào gọi API thật.

## Definition of Done
- [ ] Hỏi ngữ pháp có trả lời hợp lý theo trình độ.
- [ ] Sửa câu trả về câu đúng + lý do.
- [ ] Hội thoại lưu lại và mở lại xem được.
- [ ] API key sai → lỗi hiển thị tử tế, không crash.
- [ ] ArchUnit xanh.
- [ ] **MVP đủ 5 màn hình theo PROJECT.md §9 (Mốc B đạt).**
