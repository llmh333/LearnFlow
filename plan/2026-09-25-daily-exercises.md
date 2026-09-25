# Bài tập hàng ngày (Daily Exercises) — thuật toán thuần + AI pre-generate 3 ngày

## Bối cảnh

Người dùng muốn có tính năng "mỗi ngày có vài bài tập" (sắp xếp câu, trắc nghiệm...), theo **2 cách
sinh song song**:
1. **Thuật toán thuần** — dựng bài tập trực tiếp từ dữ liệu từ vựng đã có (`word`, `meaning`,
   `example`), miễn phí, tức thời, không phụ thuộc AI.
2. **AI sinh bài tập, pre-generate trước 3 ngày** qua cron job — khi buffer sắp cạn (còn ≤1 ngày dự
   trữ), cron tự sinh thêm để luôn giữ sẵn 3 ngày tiếp theo.

Khảo sát codebase cho thấy: module `dailyplan` hiện có sẵn 1 loại việc `GRAMMAR_EXERCISE` trong
checklist nhưng **chỉ là nhãn chữ**, không có nội dung bài tập thật; field `targetRef` trên
`DailyPlanItem` được để dành ("Reserved... unused for now") nhưng chưa dùng. Không có engine
quiz/exercise nào tồn tại — đây là tính năng mới hoàn toàn (module `exercise`), tận dụng lại đúng các
pattern đã có: `Clock` injection (`ClockConfig`), `AIProvider` interface (3 provider Claude/Gemini/Groq),
`AIContextBuilder`/`LearnerContext` (đã biết lấy "10 từ yếu nhất" của user), và cấu trúc
Controller→Service→Repository→Entity/DTO chuẩn của dự án. **Chưa có `@Scheduled`/`@EnableScheduling`
nào trong repo** — phần cron là mới hoàn toàn nhưng không cần thêm dependency (Spring Boot đã có sẵn
`spring-context` qua các starter hiện có).

## Thiết kế tổng thể

Một bảng `exercise` duy nhất chứa **cả 2 nguồn** (`source: DETERMINISTIC | AI`), phân biệt bằng cột
`exercise_date` + `source`:
- **Thuật toán**: sinh **tức thời khi user mở trang bài tập hôm nay lần đầu** (giống hệt cách
  `DailyPlanService.generate` upsert 1 lần/ngày), lưu lại để không đổi khi user F5.
- **AI**: sinh **trước** bởi cron (chạy 1 lần/ngày), luôn giữ sẵn đúng 3 ngày tới (hôm nay,
  hôm nay+1, hôm nay+2) cho mỗi user × mỗi ngôn ngữ họ có từ vựng. Cron tự kiểm tra "mốc xa nhất đã
  sinh" mỗi lần chạy — nếu mốc đó < hôm nay+2 (tức buffer đã tụt xuống ≤1 ngày dự trữ) thì sinh bù
  đúng những ngày còn thiếu. Cách này tự chữa lành nếu 1 lần chạy cron bị lỡ, thay vì đếm cứng "đến
  ngày thứ 3".

**Quan trọng — chống lộ đáp án**: response trả về khi GET bài tập **không được chứa đáp án đúng**
(`correctTokens`/`correctOptionIndex`) — chỉ trả về sau khi user nộp câu trả lời, ở response riêng.

## Backend

### 1. Migration `V13__create_exercise.sql`

```sql
CREATE TABLE exercise (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user (id),
    language_id SMALLINT NOT NULL REFERENCES language (id),
    vocabulary_id BIGINT REFERENCES vocabulary (id),
    exercise_date DATE NOT NULL,
    type VARCHAR(30) NOT NULL,        -- SENTENCE_SCRAMBLE | MULTIPLE_CHOICE
    source VARCHAR(20) NOT NULL,      -- DETERMINISTIC | AI
    payload JSONB NOT NULL,           -- xem "Payload" bên dưới
    display_order INT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    correct BOOLEAN,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercise_user_date ON exercise (user_id, exercise_date);
CREATE INDEX idx_exercise_user_lang_date_source ON exercise (user_id, language_id, exercise_date, source);
```

**Payload theo `type`** (JSONB, giữ nguyên tokens đã tách sẵn lúc sinh — so khớp mảng, không so
chuỗi, tránh mọi nhập nhằng chuẩn hoá):
- `SENTENCE_SCRAMBLE`: `{ "correctTokens": [...], "shuffledTokens": [...] }`
- `MULTIPLE_CHOICE`: `{ "question": "...", "options": [...], "correctOptionIndex": 2 }`

### 2. Module mới `com.learnflow.backend.exercise`

```
exercise/
├── ExerciseController.java
├── ExerciseService.java
├── ExerciseRepository.java
├── domain/Exercise.java, ExerciseType.java, ExerciseSource.java
├── dto/ExerciseResponse.java (KHÔNG có đáp án), ExerciseAnswerRequest.java,
│   ExerciseAnswerResponse.java (CÓ đáp án + đúng/sai)
├── engine/SentenceScrambleGenerator.java, MultipleChoiceGenerator.java   ← thuật toán thuần
└── scheduler/ExerciseGenerationScheduler.java                            ← cron AI
```

**`ExerciseController`** (`/api/exercises`):
- `GET /today?language=xx` → `ExerciseService.getToday(userId, languageCode)`
- `PATCH /{id}/answer` → `ExerciseService.submitAnswer(userId, id, request)`

**`ExerciseService`** (`@Service @Transactional`, inject `Clock`):
- `getToday(userId, languageCode)`: nếu chưa có exercise nào `source=DETERMINISTIC` cho
  (user, language, hôm nay) → sinh `app.exercise.deterministic-count-per-day` bài (mặc định 5) từ
  `SentenceScrambleGenerator`/`MultipleChoiceGenerator`, lưu lại. Gộp với các bài `source=AI` đã có
  sẵn cho hôm nay (do cron sinh từ trước), sắp theo `display_order`, map sang `ExerciseResponse`
  (loại bỏ đáp án).
- `submitAnswer(userId, id, request)`: ownership check qua `findByIdAndUser_Id`, so khớp
  `submittedTokens`/`selectedOptionIndex` với payload lưu trong DB, set `completed=true`,
  `correct`, `answeredAt=Instant.now(clock)`, trả về `ExerciseAnswerResponse` (có đáp án đúng để
  hiển thị feedback).

**Nguồn từ vựng để sinh bài tập — 2 tầng, có fallback cho user mới toanh**: đã kiểm tra kỹ
`ProgressService.weakAreas` (dòng `filter(s -> s.reviewCount() > 0)`) — **lọc bỏ hoàn toàn mọi từ
chưa từng ôn**. Một user vừa đăng ký, dù đã có sẵn 300 từ seed (mỗi từ có `review_schedule` khởi tạo
`easeFactor=2.50, reviewCount=0`), thì **`weakAreas` trả về danh sách rỗng** — không có "từ yếu" nào
để bám vào, vì chưa có lịch sử ôn tập nào để đánh giá yếu ở đâu. Nếu chỉ dựa vào `weakAreas` như thiết
kế trước, user mới sẽ **không sinh được bài tập nào cả**.

→ `ExerciseService` dùng logic 2 tầng:
1. Gọi `progressService.weakAreas(userId, languageCode, limit)` (Service công khai, đúng luật ranh
   giới module) lấy từ yếu nhất — hiệu quả nhất khi user đã có lịch sử ôn tập.
2. Nếu kết quả thiếu (kể cả rỗng, vd user mới) để đủ số lượng cần cho `limit`, **lấp đầy phần còn
   thiếu bằng cách lấy ngẫu nhiên** (qua `Random` đã inject) từ toàn bộ từ vựng của user trong ngôn
   ngữ đó — `vocabularyService.list(userId, languageCode, ...)` đã có sẵn, phân trang, không cần
   endpoint mới. Với `SentenceScrambleGenerator` ưu tiên lọc thêm các từ có `example` khác null trong
   bước lấy ngẫu nhiên này.

Kết quả: user mới đăng ký vẫn có đủ bài tập ngay lần đầu mở trang (100% random từ 300 từ seed có sẵn
example), user đã học lâu thì bài tập dần thiên về đúng các từ họ yếu — tự nhiên chuyển tiếp mà không
cần theo dõi "user có phải mới hay không" ở đâu cả, `ExerciseService` chỉ cần "lấp cho đủ số lượng".

**AI path cũng cần lưu ý điều tương tự**: `AIContextBuilder.build(userId, languageCode)` (dùng cho
`LearnerContext.weakWords`) sắp xếp theo `easeFactor` tăng dần nhưng **không lọc `reviewCount=0`**
như `weakAreas` — với user mới, mọi từ đều `easeFactor=2.50` bằng nhau nên không rỗng (khác
`weakAreas`), nhưng danh sách trả về chỉ là 10 từ đầu tiên tuỳ thứ tự ổn định, không thực sự "yếu".
Chấp nhận được cho AI context (AI chỉ dùng để lấy chủ đề sinh câu, không bắt buộc phải là từ yếu thật
sự) — không cần sửa gì thêm ở `AIContextBuilder`.

**`engine/SentenceScrambleGenerator`** (pure, không phụ thuộc Spring, nhận `Random` qua constructor
để test được deterministic — giống triết lý `Sm2Algorithm`):
- Cần `vocabulary.example` khác null/rỗng mới sinh được — bỏ qua từ không có example.
- Tokenize theo ngôn ngữ: `en` tách theo khoảng trắng; `zh`/`ja` tách theo từng ký tự Unicode CJK
  (tương tự logic `splitIntoCjkCharacters` bên frontend, viết lại bản Java thuần).
- Lưu `correctTokens` = thứ tự gốc, `shuffledTokens` = xáo trộn (đảm bảo khác thứ tự gốc, tránh case
  bài tập vô nghĩa khi shuffle ra trùng thứ tự cũ).

**`engine/MultipleChoiceGenerator`** (pure, cùng nhận `Random`):
- Câu hỏi: "What does '<word>' mean?", đáp án đúng = `meaning` của từ target, 3 đáp án nhiễu lấy
  `meaning` của 3 từ khác cùng ngôn ngữ (từ pool `weakAreas`/toàn bộ vocab của user), xáo trộn vị trí.

**AI provider — thêm 1 method mới** trên `AIProvider` (interface trong `ai` module, implement lại ở
cả `ClaudeAIProvider`, `GeminiAIProvider`, `GroqAIProvider` theo đúng pattern JSON tool-call sẵn có
của `generateExamples`/`correctSentence`):
```java
List<GeneratedExercise> generateExercises(ExerciseGenerationRequest request);
```
- `ExerciseGenerationRequest(LearnerContext context, int count)` — tái dùng thẳng
  `AIContextBuilder.build(userId, languageCode)` đã có, không viết lại logic lấy context.
- `GeneratedExercise` (record, đặt cạnh các DTO khác trong `ai` module): `type, word,
  correctSentence, shuffledWords, question, options, correctOptionIndex` (field nào không dùng theo
  `type` thì null).
- Prompt mới trong `AIPrompts.java` (theo đúng style các factory method hiện có), nhấn mạnh AI phải
  trả JSON đúng schema qua tool-call, không tự chấm điểm gì thêm.
- `ExerciseService` map `GeneratedExercise` → `Exercise` entity với `source=AI`.

**`scheduler/ExerciseGenerationScheduler`** (`@Component`):
```java
@Scheduled(cron = "${app.exercise.cron:0 0 3 * * *}")
void topUpAiExercises() { ... }
```
- Với mỗi user thật (bỏ qua `seed@learnflow.system`) × mỗi ngôn ngữ họ có từ vựng: tìm
  `exerciseRepository.findMaxExerciseDate(userId, languageId, AI)`. Nếu null hoặc
  `< today.plusDays(app.exercise.pregenerate-days - 1)` (mặc định 3 ngày → `today+2`), sinh AI
  exercises cho các ngày còn thiếu từ `max(today, mốc+1)` đến `today + (pregenerateDays-1)`.
- Bọc try/catch quanh mỗi user×language — 1 lần gọi AI lỗi không được làm hỏng cả batch (giống
  `DailyPlanService.tryGenerateIntro` bắt `AIProviderException` rồi log+tiếp tục).
- Cần thêm `@EnableScheduling` — đặt trong 1 config class mới `common/config/SchedulingConfig.java`
  (tách riêng, theo đúng cách `ClockConfig`/`CorsConfig` đang tách).

**Config mới** (`app.exercise.*`, theo pattern `VocabularyProperties`/`AuthProperties`):
`deterministic-count-per-day` (mặc định 5), `ai-count-per-day` (mặc định 3),
`pregenerate-days` (mặc định 3), `cron` (mặc định `0 0 3 * * *`).

## Frontend

- **`types/domain.ts`**: thêm `ExerciseType`, `Exercise` (không có field đáp án),
  `ExerciseAnswerResult` (có đáp án đúng + `correct: boolean`).
- **`api/exercises.ts`**: `fetchTodayExercises(language)`, `submitExerciseAnswer(id, payload)` — theo
  đúng khuôn `api/reviews.ts` (`apiFetch` wrapper thuần).
- **`hooks/useExercises.ts`**: `exerciseKeys`, `useTodayExercises`, `useSubmitExerciseAnswer` — theo
  đúng khuôn `hooks/useReviews.ts`.
- **`pages/ExercisesPage.tsx`**: tái dùng đúng pattern "1 câu tại 1 thời điểm" của `ReviewPage.tsx`
  (queue cục bộ, `current = queue[0]`, advance sau khi nộp, màn hình tổng kết cuối). 2 nhánh hiển thị
  theo `current.type`:
  - `SENTENCE_SCRAMBLE`: các từ xáo trộn hiện thành chip bấm được, bấm theo thứ tự để ghép câu (không
    cần thư viện drag-and-drop — khảo sát xác nhận repo chưa có dnd lib nào, tap-to-order là đủ và
    không phải thêm dependency mới), nút "Reset"/"Nộp bài".
  - `MULTIPLE_CHOICE`: các `options` hiện thành nút bấm, bấm 1 cái là nộp luôn.
  - Sau khi nộp: hiện đúng/sai + đáp án đúng (từ `ExerciseAnswerResult`).
- **`components/exercises/SentenceScrambleCard.tsx`**, **`MultipleChoiceCard.tsx`**: tách riêng cho
  gọn, theo đúng cách `components/review/` tách `StrokeOrderDiagram`/`WordStrokeOrder`.
- **`router.tsx`**: thêm route `/exercises`. **`AppLayout.tsx`**: thêm mục nav (tái dùng icon đã có
  sẵn, vd `IconZap`, không cần thêm icon mới).
- (Tuỳ chọn, polish nhỏ) `TodayPlanCard.tsx`'s mục `GRAMMAR_EXERCISE` gắn link sang `/exercises`.

## Phạm vi & quyết định mặc định

- Bài tập **tách biệt hoàn toàn khỏi SRS** — làm đúng/sai bài tập không tự động đổi lịch ôn tập
  `review_schedule`. Đây là quyết định mặc định hợp lý (an toàn, không ảnh hưởng thuật toán SM-2 đã
  tinh chỉnh kỹ) — có thể mở rộng sau nếu cần.
- V1 chỉ 2 loại bài tập (sắp xếp câu, trắc nghiệm) như đã thống nhất, không làm thêm loại khác.
- Không đụng gì tới `dailyplan` module hiện có ngoài optional link ở `TodayPlanCard`.

## Test

- **Backend**: `SentenceScrambleGeneratorTest`/`MultipleChoiceGeneratorTest` (pure, phủ đủ case như
  không có example, ngôn ngữ en vs zh/ja, shuffle luôn khác thứ tự gốc). `ExerciseServiceTest` (mock
  repo + `ProgressService`/`VocabularyService`/`AIProvider`, **bắt buộc có case
  `weakAreas` trả rỗng (user mới) → vẫn lấp đủ bằng random pool**, đúng đúng lỗ hổng vừa phát hiện).
  `ExerciseIntegrationTest` (đăng ký user mới đã có 300 từ seed sẵn `example` → GET `/exercises/today`
  trả về đủ bài **ngay cả khi chưa ôn từ nào** → nộp đáp án đúng/sai).
  `ExerciseGenerationSchedulerTest` (`Clock.fixed` + mock `AIProvider`, xác nhận chỉ sinh bù khi mốc
  xa nhất < ngưỡng, không sinh lại khi buffer đã đủ). **Luôn mock `AIProvider`, không gọi API thật**
  (AGENTS.md §1.6).
- **Frontend**: `ExercisesPage.test.tsx` theo khuôn `ReviewPage.test.tsx` — mock `api/exercises`, test
  cả 2 luồng scramble/multiple-choice submit đúng payload.
- `cd backend && ./mvnw verify` và `cd frontend && npm run lint && npm run build && npm run test` đều
  phải xanh trước khi mở PR.

## Kiểm tra thủ công

- Mở `/exercises` lần đầu trong ngày → thấy đủ bài tập (thuật toán sinh ngay + AI nếu cron đã chạy
  trước đó). F5 lại → không đổi bộ bài tập (đã lưu). Làm bài sắp xếp câu + trắc nghiệm, nộp → thấy
  đúng/sai + đáp án đúng.
- Chạy tay `topUpAiExercises()` (hoặc gọi cron sớm bằng cách chỉnh `Clock` trong test) → xác nhận
  bảng `exercise` có đủ 3 ngày AI sắp tới cho user/ngôn ngữ đó.
