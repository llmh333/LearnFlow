# LearnFlow — Kế hoạch kỹ thuật chi tiết (theo PROJECT.md mục 13)

> **Lưu ý (2026-09-22):** tài liệu thực thi hiện tại là [`plan/phases/`](./phases/00-overview.md) (decision log D1–D10,
> checklist theo phase). File này chỉ còn giá trị tham khảo cho phần thiết kế kiến trúc/DB/API tổng thể —
> các chi tiết về phạm vi ngôn ngữ (đã mở rộng thành EN/ZH/JA, gắn mục tiêu IELTS/HSK/JLPT, `meaning` luôn
> tiếng Việt) và trạng thái triển khai thực tế lấy theo `plan/phases/`, không phải theo file này.

## Context

LearnFlow là ứng dụng học ngoại ngữ cá nhân (Anh + Trung + Nhật), một người dùng, không phải SaaS. Repo hiện tại chỉ có `PROJECT.md` (tài liệu yêu cầu) và `frontend/` đã scaffold Vite+React+TS mặc định — chưa có backend, chưa có domain code. Đây là kế hoạch kỹ thuật đầy đủ trước khi viết bất kỳ dòng code nào, đúng yêu cầu mục 13 của PROJECT.md: xác định domain model, kiến trúc BE/FE, DB schema, API, chiến lược SRS/AI, testing, cấu trúc thư mục và roadmap milestone nhỏ, mỗi milestone kết thúc ở trạng thái chạy được.

Ba quyết định người dùng đã chốt (khác/bổ sung so với PROJECT.md mục 8 "auth optional"):
- **Có đăng ký/đăng nhập như một app bình thường** (không chỉ 1 password tĩnh) — dùng JWT + Spring Security, vẫn chỉ phục vụ 1 người dùng thực tế nhưng có luồng auth chuẩn.
- **AI provider đầu tiên: Claude (Anthropic API)**, qua interface `AIProvider` để dễ đổi sau.
- **Có kế hoạch deploy lên VPS/cloud** sau này (không chỉ chạy local) → kiến trúc/config phải sẵn sàng cho môi trường ngoài localhost (CORS, HTTPS, env-based secrets, Docker image buildable).

Giữ nguyên các ràng buộc lõi của PROJECT.md: modular monolith (Java Spring Boot + PostgreSQL), SRS deterministic và độc lập với AI, đa ngôn ngữ không hard-code, không multi-user/social/gamification, không over-engineer.

---

## 1. Kiến trúc tổng thể

```
┌───────────────────────────────┐
│  Frontend (Vite+React+TS SPA) │
│  Login/Register → Dashboard → │
│  Vocab / Review / AI Tutor /  │
│  Progress                     │
└───────────────┬───────────────┘
                │ REST JSON + Bearer JWT — /api
┌───────────────▼──────────────────────────────────────────┐
│           Spring Boot Modular Monolith (single JVM)      │
│                                                          │
│  common/   auth/    language/   vocabulary/   srs/       │
│  study/    mistake/ progress/   dailyplan/    ai/        │
└───────────────┬────────────────────────────┬─────────────┘
                │ JDBC (Spring Data JPA)       │ HTTPS
┌───────────────▼──────────────┐   ┌──────────▼─────────────┐
│         PostgreSQL           │   │  Claude API (Anthropic)│
└──────────────────────────────┘   └────────────────────────┘
```

- **Giữ Vite+React+TS (SPA)**, không chuyển Next.js: không cần SEO/SSR, backend API đã tách riêng, Vite tối giản đúng tinh thần "hạ tầng tối thiểu". Deploy VPS sau này: frontend build tĩnh (Nginx/serve), backend là 1 Docker image Spring Boot, Postgres riêng — 3 container, không cần orchestration phức tạp.
- **Modular monolith**, package gốc `dev.learnflow`, mỗi domain 1 package với layer controller/service/repository riêng: `common`, `auth`, `language`, `vocabulary`, `srs`, `study`, `mistake`, `progress` (không có bảng riêng, chỉ tổng hợp), `dailyplan`, `ai`.
- **Quy tắc ranh giới**: module chỉ gọi Service interface public của module khác, không gọi thẳng Repository chéo module. Quan trọng nhất: `ai` module **không có quyền ghi** vào `srs` repository — mọi thay đổi lịch ôn phải đi qua `ReviewService` công khai, giống hành vi người dùng thao tác thủ công. Điều này đảm bảo AI không quyết định SRS.
- **Auth**: Spring Security + JWT (access token, có thể thêm refresh token nếu cần). Đăng ký tạo `User` (email + password hash bcrypt); đăng nhập trả JWT; mọi API domain khác yêu cầu Bearer token hợp lệ. Vì chỉ có 1 người dùng thực tế, dữ liệu domain (vocabulary, review...) **không cần cột `user_id`** ở MVP — auth chỉ đóng vai trò cổng bảo vệ, không phải multi-tenant. Ghi rõ trong risk section để dễ mở rộng sau nếu cần.

## 2. Domain model cho MVP

**Cần ngay**: `User` (mới, cho auth), `Language`, `Vocabulary`, `VocabularyTag`, `ReviewSchedule`, `ReviewHistory`, `StudySession`.

**Hoãn tới milestone tương ứng**: `Mistake`/`MistakeCategory` (M9), `AIConversation`/`AIMessage` (M8), `GrammarTopic` (dùng free-text `topic` field thay vì bảng riêng cho tới khi thực sự cần cấu trúc hóa), `DailyPlan`/`DailyPlanItem` (M11). `Progress` không phải entity — service tổng hợp.

ERD (text):
```
User (1) ──── (đăng nhập, không liên kết trực tiếp dữ liệu domain ở MVP)

Language (1) ──< Vocabulary (N)
Vocabulary (1) ──< VocabularyTagLink >── VocabularyTag (N)   [many-to-many]
Vocabulary (1) ──1:1── ReviewSchedule
Vocabulary (1) ──< ReviewHistory (N)
ReviewSchedule (1) ──< ReviewHistory (N)
StudySession (N) >── Language (1);  ReviewHistory.study_session_id → StudySession (nullable FK)

-- Hoãn --
Mistake (N) >── Language (1), >── MistakeCategory (1), >── Vocabulary (0..1)
AIConversation (1) ──< AIMessage (N); AIConversation (N) >── Language (1)
DailyPlan (1) ──< DailyPlanItem (N)
```

## 3. Database schema

Nguyên tắc: field chung là cột thật; field riêng theo ngôn ngữ (IPA/CEFR/collocations vs pinyin/HSK/measure_word) nằm trong **cột JSONB `attributes`** trên `vocabulary` — tránh tách bảng theo ngôn ngữ, validate ở tầng Service bằng record Java cố định theo `language_id`. Dùng **Flyway** cho migration, mỗi milestone 1 file `V{n}__*.sql`.

```sql
-- V1: auth
CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- V2: language
CREATE TABLE language (
    id   SMALLSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,   -- 'en', 'zh'
    name VARCHAR(50) NOT NULL
);

-- V3: vocabulary
CREATE TABLE vocabulary (
    id          BIGSERIAL PRIMARY KEY,
    language_id SMALLINT NOT NULL REFERENCES language(id),
    word        VARCHAR(255) NOT NULL,
    meaning     TEXT NOT NULL,
    example     TEXT,
    difficulty  SMALLINT DEFAULT 0,
    attributes  JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vocab_language ON vocabulary(language_id);
CREATE INDEX idx_vocab_attributes ON vocabulary USING gin (attributes);

CREATE TABLE vocabulary_tag (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE);
CREATE TABLE vocabulary_tag_link (
    vocabulary_id BIGINT REFERENCES vocabulary(id) ON DELETE CASCADE,
    tag_id INT REFERENCES vocabulary_tag(id) ON DELETE CASCADE,
    PRIMARY KEY (vocabulary_id, tag_id)
);

-- V4: review schedule/history
CREATE TABLE review_schedule (
    vocabulary_id   BIGINT PRIMARY KEY REFERENCES vocabulary(id) ON DELETE CASCADE,
    last_review     TIMESTAMPTZ,
    next_review     TIMESTAMPTZ NOT NULL DEFAULT now(),
    interval_days   NUMERIC(10,2) NOT NULL DEFAULT 0,
    ease_factor     NUMERIC(4,2) NOT NULL DEFAULT 2.5,
    review_count    INT NOT NULL DEFAULT 0,
    success_count   INT NOT NULL DEFAULT 0,
    failure_count   INT NOT NULL DEFAULT 0,
    memory_strength NUMERIC(5,2) NOT NULL DEFAULT 0
);
CREATE INDEX idx_review_due ON review_schedule(next_review);

CREATE TABLE study_session (
    id             BIGSERIAL PRIMARY KEY,
    language_id    SMALLINT REFERENCES language(id),
    started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at       TIMESTAMPTZ,
    words_reviewed INT NOT NULL DEFAULT 0,
    words_learned  INT NOT NULL DEFAULT 0,
    mistakes_count INT NOT NULL DEFAULT 0
);

CREATE TABLE review_history (
    id                BIGSERIAL PRIMARY KEY,
    vocabulary_id     BIGINT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    study_session_id  BIGINT REFERENCES study_session(id),
    reviewed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    rating            VARCHAR(10) NOT NULL,   -- AGAIN/HARD/GOOD/EASY
    previous_interval NUMERIC(10,2),
    new_interval      NUMERIC(10,2),
    response_time_ms  INT
);
CREATE INDEX idx_history_vocab ON review_history(vocabulary_id);
CREATE INDEX idx_history_date ON review_history(reviewed_at);

-- Hoãn: mistake_category/mistake (M9), ai_conversation/ai_message (M8), daily_plan/daily_plan_item (M11)
-- Chi tiết các bảng này giữ nguyên như thiết kế milestone tương ứng, thêm vào khi tới milestone.
```

## 4. API design (REST, base `/api`, JWT Bearer bắt buộc trừ `/auth/*`)

**Auth**: `POST /auth/register` `{email,password,displayName}`; `POST /auth/login` `{email,password}` → `{token}`; `GET /auth/me`.

**Language**: `GET /languages`.

**Vocabulary**: `GET /vocabulary?language=&search=&tag=&dueOnly=&page=&size=`; `GET/{id}`; `POST`; `PUT/{id}`; `DELETE/{id}`; `GET /vocabulary/tags`.

**Review/SRS**: `GET /reviews/due?language=&limit=`; `POST /reviews/{vocabularyId}/submit` `{rating, responseTimeMs}`; `GET /reviews/history/{vocabularyId}`.

**Study Session**: `POST /study-sessions/start` `{languageId}`; `POST /study-sessions/{id}/end`.

**Dashboard**: `GET /dashboard/today` → due count, new suggested, progress theo từng ngôn ngữ, estimated minutes.

**Progress**: `GET /progress/summary?language=`; `GET /progress/retention?language=&days=`; `GET /progress/history?language=&from=&to=`; `GET /progress/weak-areas?language=`.

**AI Tutor** (M8): `POST /ai/grammar/explain`; `POST /ai/examples/generate`; `POST /ai/sentence/correct`; `POST /ai/conversation/{id?}/message`; `POST /ai/conversation/{id}/end`.

**Mistake Book** (M9): `GET/POST /mistakes`; `GET /mistakes/recurring?language=`.

**Daily Plan** (M11): `POST /daily-plan/generate` `{availableMinutes}`; `GET /daily-plan/today`; `PATCH /daily-plan/item/{id}`.

## 5. SRS strategy

**SM-2 (biến thể đơn giản hóa)** cho MVP, không dùng FSRS ngay — FSRS cần lượng dữ liệu lớn để calibrate, không có lợi khi mới bắt đầu; SM-2 đơn giản, thuần Java, 100% deterministic, dễ test. Thiết kế `SrsAlgorithm` là **interface** để thay bằng FSRS sau này khi đủ dữ liệu, không phá kiến trúc.

```
easeFactor' = clamp(easeFactor + deltaEF(rating), min=1.3)
  AGAIN: -0.20   HARD: -0.15   GOOD: 0.00   EASY: +0.15

if AGAIN:            interval' = 0 (relearning, next_review = now + 10 phút)
else if reviewCount==0: interval' = 1 ngày
else if reviewCount==1: interval' = 6 ngày
else:
  interval' = round(interval * easeFactor')
  if HARD: interval' = round(interval * 1.2)
  if EASY: interval' = round(interval * easeFactor' * 1.3)

next_review = now + interval' ngày
```

`SrsAlgorithm.compute(currentState, rating) -> newState` là pure function (không DB/AI side-effect) → unit test bảng chân trị đầy đủ. Mỗi lần review ghi `review_history` với previous/new interval để tái tạo được.

## 6. AI integration strategy

```java
interface AIProvider {
    String explainGrammar(GrammarExplainRequest req);
    List<GeneratedExample> generateExamples(ExampleRequest req);
    SentenceCorrection correctSentence(CorrectionRequest req);
    MistakeAnalysis analyzeMistake(MistakeAnalysisRequest req);
    Exercise generateExercise(ExerciseRequest req);
    DailyPlanDraft generateDailyPlan(DailyPlanContext ctx);
    ConversationTurn conversation(ConversationRequest req);
}
```

- **ClaudeAIProvider** implement trước (API key qua env var `ANTHROPIC_API_KEY`, không hardcode/không lưu DB), dùng structured output/tool-use để ép JSON schema thay vì parse free text. `OpenAIProvider`/`GeminiProvider` để interface sẵn, có thể là stub tới khi cần.
- `AIContextBuilder` lấy dữ liệu **có chọn lọc** (top-N due/weak words, vài mistake gần đây, N message gần nhất trong conversation) — không gửi toàn bộ DB.
- Ranh giới cứng: `ai` module không ghi `review_schedule` trực tiếp; `generateDailyPlan` chỉ nhận số liệu đã tính sẵn từ `dailyplan.PlanningEngine` (deterministic) và chỉ "diễn đạt", không tự tính lại priority.
- Chọn provider qua config (`ai.provider=claude`, `@ConditionalOnProperty`).

## 7. Frontend structure

Thêm dependency nhẹ: `react-router-dom`, `@tanstack/react-query`; Zustand chỉ nếu cần global UI state ngoài server state (ví dụ auth token/session). Không Redux, không UI framework nặng.

```
frontend/src/
├── api/         client.ts (fetch wrapper + JWT header), auth.ts, vocabulary.ts, reviews.ts, dashboard.ts, progress.ts, ai.ts
├── pages/       LoginPage, RegisterPage, DashboardPage, VocabularyPage, ReviewPage, AiTutorPage, ProgressPage
├── components/  auth/ (LoginForm, RegisterForm), dashboard/, vocabulary/, review/, ai-tutor/, progress/, common/ (Layout, ProtectedRoute, LanguageSwitcher)
├── hooks/       useAuth, useVocabulary, useDueReviews, useDashboard, useProgress
├── stores/      authStore.ts (JWT token, current user)
├── types/       domain.ts
├── router.tsx   (ProtectedRoute wraps app routes, redirect → /login nếu chưa auth)
├── App.tsx, main.tsx
```

## 8. Testing strategy

| Loại | Phạm vi | Công cụ |
|---|---|---|
| Unit SRS (ưu tiên cao nhất) | `Sm2Algorithm`: mọi rating × trạng thái, biên ease factor, deterministic | JUnit 5 parameterized |
| Unit domain service | VocabularyService (validate attributes theo language), ProgressService, PlanningEngine | JUnit 5 + Mockito |
| Unit/integration auth | Register/login flow, password hashing, JWT validate, protected endpoint 401 khi thiếu token | Spring Security Test |
| Integration API | Vocabulary CRUD, Review submit→schedule đúng, Dashboard aggregation | Spring Boot Test + Testcontainers (Postgres) |
| AI module | Mock `AIProvider`, test `AIContextBuilder` giới hạn context đúng | JUnit + Mockito |
| Frontend | ReviewCard rating flow, VocabForm validate theo ngôn ngữ, ProtectedRoute redirect | Vitest + React Testing Library |
| E2E (tùy chọn, sau MVP) | Luồng login → review đầy đủ | Playwright |

## 9. Project folder structure (root)

```
LearnFlow/
├── PROJECT.md, LICENSE
├── plan/                      # kế hoạch kỹ thuật, theo dõi lâu dài (file này)
├── docker-compose.yml         # postgres + backend + frontend (build cho cả local và VPS deploy)
├── docs/ (architecture.md, api.md, srs-algorithm.md)
├── backend/
│   ├── pom.xml (hoặc build.gradle.kts)
│   ├── src/main/java/dev/learnflow/{common,auth,language,vocabulary,srs,study,mistake,progress,dailyplan,ai}
│   ├── src/main/resources/application.yml, db/migration/V*.sql (Flyway)
│   └── src/test/java/dev/learnflow/...
└── frontend/                  # đã có, bổ sung src/{api,pages,components,hooks,stores,types,router.tsx}
```

## 10. Development milestones

**M1 — Project architecture & Authentication**
Goal: scaffold chạy được end-to-end với auth thật (đặt sớm vì mọi API khác đều cần Bearer token).
BE: Spring Boot project theo package structure mục 1; Flyway V1 (`app_user`); Spring Security + JWT filter; `/auth/register`, `/auth/login`, `/auth/me`; `/api/health` (public).
FE: `api/client.ts` (đính JWT header), `authStore`, `LoginPage`/`RegisterPage`, `ProtectedRoute`, gọi health-check sau khi login.
DB: `docker-compose.yml` Postgres, V1 migration.
Tests: register/login/401-without-token, context loads, frontend build.
DoD: `docker compose up`; đăng ký tài khoản, đăng nhập, gọi `/api/health` thành công với token, bị 401 nếu thiếu token.

**M2 — Language model**: `Language` entity + seed EN/ZH, `GET /languages`, `LanguageSwitcher` FE. DoD: API trả về 2 ngôn ngữ.

**M3 — Vocabulary management**: `Vocabulary`/`VocabularyTag` + JSONB attributes validate theo ngôn ngữ, CRUD+search+tag đầy đủ, `VocabularyPage`/`VocabForm`/`VocabList`. DoD: thêm/sửa/xóa/tìm từ EN & ZH qua UI, persist DB.

**M4 — SRS/Review engine**: `ReviewSchedule` + `Sm2Algorithm` (pure, test kỹ), `due`/`submit` endpoints, `ReviewPage`/`RatingButtons`. DoD: review, chấm điểm, next_review cập nhật đúng công thức mục 5.

**M5 — Review history**: `ReviewHistory` ghi mỗi lần submit, `GET /reviews/history/{id}`, hiển thị lịch sử trong vocab detail. DoD: xem lại lịch sử review từng từ.

**M6 — Basic Dashboard**: `DashboardService` aggregation, `GET /dashboard/today`, `DashboardPage` với due count + progress tạm tính. DoD: mở app thấy ngay due count + progress theo ngôn ngữ.

**M7 — Study sessions**: `StudySession` start/end tự động quanh ReviewPage lifecycle, link `review_history.study_session_id`. DoD: sau review thấy tóm tắt "đã ôn X từ trong Y phút".

**M8 — AI integration**: `AIProvider`/`ClaudeAIProvider`, `AIContextBuilder`, `AIConversation`/`AIMessage`, endpoints AI Tutor, `AiTutorPage`/`ChatWindow`. DoD: hỏi AI nhận trả lời hợp lý, hội thoại lưu lại xem được.

**M9 — Mistake Book**: `Mistake`/`MistakeCategory`, liên kết từ AI correction, recurring aggregation. DoD: lỗi từ AI Tutor tự lưu, xem danh sách lỗi lặp lại.

**M10 — Progress analysis**: `ProgressService` đầy đủ (retention thực từ history, weak areas từ ease_factor+mistake), `ProgressPage` hoàn chỉnh. DoD: 5 màn hình MVP hoàn chỉnh.

**M11 — AI-generated Daily Plan**: `PlanningEngine` (deterministic) + `DailyPlan`/`DailyPlanItem` + AI diễn đạt nội dung, `TodayPlanCard` thật trên Dashboard. DoD: nhập số phút → nhận kế hoạch chia theo ngôn ngữ đúng cấu trúc PROJECT.md mục 4.7.

**M12 — Conversation improvements**: role-play theo scenario, tổng kết cuối hội thoại, tự động tạo Mistake. DoD: hội thoại mượt không ngắt sửa lỗi, có tổng kết + lỗi vào Mistake Book.

Mỗi milestone: sau khi hoàn thành, `docker compose up` chạy được, có thể demo qua UI thật, có test đi kèm.

## 11. Technical risks

- **AI cost/latency**: giới hạn context top-N, cache/tóm tắt hội thoại cũ, stream response FE.
- **SRS tuning**: SM-2 mặc định có thể chưa tối ưu; log đủ history để sau chuyển FSRS.
- **Prompt context phình to** theo thời gian: luôn giới hạn top-N, không gửi full history.
- **JSONB validate lỏng ở DB-level**: bù bằng validate Service layer + test theo từng ngôn ngữ.
- **AI vô tình ảnh hưởng SRS**: chặn cứng bằng ranh giới module (`ai` không có Repository access tới `srs`).
- **Parsing AI response không ổn định**: dùng structured output/tool-use, có fallback lỗi.
- **Auth đơn giản nhưng cần chuẩn khi deploy VPS**: bcrypt cho password, JWT secret qua env var (không hardcode), bắt buộc HTTPS khi deploy ngoài localhost, cân nhắc rate-limit `/auth/login` để chống brute-force dù chỉ 1 user.
- **Deploy VPS**: cần CORS config đúng domain, secrets qua env (không commit `.env`), backup Postgres định kỳ (pg_dump) vì dữ liệu học tập tích lũy lâu dài rất quý.
- **BE-FE type drift**: chưa cần codegen OpenAPI ở MVP, cân nhắc thêm sau khi API ổn định.

## 12. Open questions còn lại (đã chốt auth/AI-provider/deploy, còn các điểm sau)

1. Trình độ hiện tại (CEFR/HSK) để AI giải thích đúng level: người dùng tự khai báo (cần 1 "Settings" tối thiểu) hay hệ thống tự suy ra từ vocab đã học?
2. Định nghĩa "thành thạo" (mastered) cho Progress — ngưỡng ease_factor/reviewCount cụ thể?
3. Số "từ mới mỗi ngày" trên Dashboard: cấu hình cố định, user set trong Settings, hay Engine tự tính theo thời gian rảnh?
4. Ngôn ngữ giao diện UI: tiếng Việt hay tiếng Anh?
5. Có cần export/backup dữ liệu (CSV/JSON) trong app, hay chỉ dựa vào pg_dump thủ công?
6. Tone giọng AI mong muốn (nghiêm túc/thân thiện) — ảnh hưởng system prompt mặc định.

Các câu hỏi này không chặn việc bắt đầu code M1–M7 (chưa cần AI); sẽ cần trả lời trước M8 (AI integration) và M11 (Daily Plan).

---

### File quan trọng khi triển khai
- `PROJECT.md` — nguồn yêu cầu gốc
- `frontend/package.json`, `frontend/src/{App.tsx,main.tsx}` — điểm gắn Router/QueryClientProvider ở M1
- (mới) `backend/pom.xml` — khởi tạo Spring Boot theo cấu trúc modular monolith mục 1
- (mới, M4) `backend/src/main/java/dev/learnflow/srs/engine/Sm2Algorithm.java` — thành phần lõi quan trọng nhất, phải pure/deterministic
