# LearnFlow — Kế hoạch triển khai theo Phase (Overview)

> Tài liệu thực thi. `PROJECT.md` là nguồn yêu cầu gốc, `plan/2026-09-21-mvp-technical-plan.md` là thiết kế kỹ thuật.
> Thư mục này (`plan/phases/`) chia kế hoạch thành từng file phase riêng để dễ theo dõi tiến độ. File này
> chứa phần dùng chung: decision log, quy ước bắt buộc, bản đồ phase, luật cấm, rủi ro, câu hỏi mở.
>
> Mỗi phase có file riêng: `phase-0-foundation.md` … `phase-8-conversation-deploy.md`. Mỗi phase có checklist
> task dạng `- [ ]`; **khi làm xong một task, tick thành `- [x]`** trong đúng phiên làm việc đó.

---

## 0. Quyết định đã chốt (decision log)

| # | Vấn đề | Quyết định | Ghi chú |
|---|---|---|---|
| D1 | Base package backend | `com.learnflow.backend` | Giữ nguyên scaffold hiện có. Plan cũ ghi `dev.learnflow` → **bỏ**. |
| D2 | Ngôn ngữ UI | **Tiếng Anh** | Hardcode tiếng Anh, không dùng i18n library. |
| D3 | Styling frontend | **Tailwind CSS v4** (`@tailwindcss/vite`) | Không config file, không component library ngoài. |
| D4 | Dev workflow | Docker **chỉ chạy Postgres**; backend `./mvnw spring-boot:run`, frontend `npm run dev` | Compose full 3 container chỉ dùng khi deploy (Phase 8). |
| D5 | AI provider đầu tiên | Claude (Anthropic API), model `claude-sonnet-5` | Qua interface `AIProvider`. |
| D6 | Thuật toán SRS | SM-2 rút gọn, qua interface `SrsAlgorithm` | FSRS để sau khi đủ dữ liệu. |
| D7 | Auth | JWT thật (register/login), 1 user thực tế | Domain table **không có `user_id`** ở MVP. |
| D8 | Field riêng theo ngôn ngữ | Cột JSONB `attributes` trên `vocabulary` | Validate ở tầng Service, không tách bảng. |
| D9 | Ngôn ngữ học hỗ trợ + mục tiêu chứng chỉ | **EN → IELTS, ZH → HSK, JA → JLPT** (3 ngôn ngữ ở MVP) | `language` seed 3 dòng: `en`/`zh`/`ja`. `VocabularyAttributesValidator` whitelist thêm bộ key cho `ja`: `reading`, `examplePinyin`→ dùng `exampleReading` cho `ja`, `partOfSpeech`, `jlptLevel` (N5..N1). |
| D10 | Trường `meaning` | Luôn là **văn bản tiếng Việt**, với mọi ngôn ngữ (kể cả UI hardcode tiếng Anh ở D2) | Không đổi D2 (UI copy vẫn tiếng Anh) — chỉ riêng dữ liệu `vocabulary.meaning` là tiếng Việt. Validate ở `VocabularyService` (không bắt buộc kiểm tra ngôn ngữ ký tự, chỉ là quy ước nhập liệu). |
| D11 | Trình độ hiện tại (CEFR/HSK/JLPT) cho AI | **Suy ra tự động** từ `attributes.cefrLevel`/`hskLevel`/`jlptLevel` của các từ đã có review (`reviewCount > 0`) trong mỗi ngôn ngữ — lấy mức cao nhất đã chạm tới | Không thêm bảng/màn hình Settings mới. Logic nằm trong `ai.context.AIContextBuilder`. Không có từ nào đã ôn → mặc định A1/HSK 1/N5. |
| D12 | Tone giọng AI Tutor | **Thân thiện, khích lệ** | Đưa thẳng vào system prompt của `ClaudeAIProvider` cho mọi tác vụ (giải thích ngữ pháp, sửa câu, hội thoại, tổng kết). |
| D13 | Số "từ mới mỗi ngày" | **Engine tự tính** theo thời gian rảnh còn lại sau khi trừ thời gian ôn từ due | Không cố định, không cần Settings. Công thức trong `dailyplan.engine.PlanningEngine`: 40% thời gian còn lại (sau review) ÷ 1 phút/từ mới. |
| D14 | Database khi deploy | **Supabase free tier** (Postgres managed), không tự host Postgres trên VPS | VPS 1 vCPU/1GB RAM — bỏ hẳn container Postgres khỏi VPS để dồn RAM cho JVM. Rủi ro chấp nhận: free tier tự pause sau ~7 ngày không hoạt động, giới hạn 500MB (dư dả cho dữ liệu 1 người dùng cá nhân). Backend chỉ đổi `SPRING_DATASOURCE_URL` sang connection string Supabase, không đổi code (vẫn là Postgres chuẩn). |
| D15 | Kiến trúc deploy + CI/CD | **2 image duy nhất**: `backend` (Spring Boot JRE) và `frontend` (build React → `FROM caddy:alpine`, Caddy vừa serve static vừa lo HTTPS vừa reverse-proxy `/api` sang backend) | Không chạy Postgres/Caddy riêng lẻ trên VPS — tối ưu tối đa cho 1GB RAM. GitHub Actions: build + push `ghcr.io/.../learnflow-{backend,frontend}` khi merge vào `main`, lọc theo `paths:` (chỉ build image nào có thay đổi), rồi **tự SSH vào VPS** chạy `docker compose pull && up -d`. Cần 3 GitHub Secrets do người dùng tự tạo: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (deploy key riêng, không dùng key cá nhân) — Claude Code không tự sinh/lưu secret này. |
| D16 | Export/import dữ liệu trong app | **Không cần** — chỉ dựa vào backup hạ tầng (`pg_dump` nhắm vào Supabase connection string, hoặc backup tự động của Supabase) | Đúng tinh thần "không over-engineer" — không thêm endpoint/UI export-import CSV/JSON. |

**Sai lệch của scaffold hiện tại cần sửa ở Phase 0:**
- `pom.xml` **thiếu** `spring-boot-starter-data-jpa`, `flyway-core`, `flyway-database-postgresql`, JWT lib, Testcontainers.
- `pom.xml` **thừa** `spring-boot-starter-mail`, `spring-boot-starter-quartz` (+ 2 starter test tương ứng) → xoá.
- `application.properties` → chuyển sang `application.yml` + profile.
- Frontend thiếu router / react-query / zustand / tailwind / vitest.
- Môi trường máy: Java 21 đã có trong `mise` nhưng **chưa activate**, **Node chưa cài**.

---

## 1. Bản giao kèo quy ước (Conventions Contract)

> Phần này quan trọng nhất cho yêu cầu "thống nhất, nhất quán".
> Ở Phase 0 sẽ được copy vào `AGENTS.md` ở thư mục gốc để mọi phiên/agent sau đều tuân theo.

### 1.1. Cấu trúc module backend

Mỗi domain là **một package phẳng** dưới `com.learnflow.backend`:

```
com.learnflow.backend.<module>/
├── <Xxx>Controller.java        // @RestController — chỉ map HTTP <-> DTO, không có business logic
├── <Xxx>Service.java           // @Service @Transactional — toàn bộ business logic
├── <Xxx>Repository.java        // interface extends JpaRepository<Entity, Long>
├── domain/<Entity>.java        // @Entity
└── dto/<Xxx>Request.java, <Xxx>Response.java   // java record + jakarta validation
```

Module list (tạo dần theo phase): `common`, `auth`, `language`, `vocabulary`, `srs`, `study`, `progress`, `dashboard`, `ai`, `mistake`, `dailyplan`.

**Ba luật ranh giới — không được vi phạm:**
1. Controller **không bao giờ** inject Repository. Luôn đi qua Service.
2. Service của module A **không** inject Repository của module B. Chỉ gọi Service public của B.
3. Module `ai` **không** được depend vào bất kỳ repository nào của `srs`. AI không được ghi lịch ôn. → Chặn cứng bằng ArchUnit test ở Phase 5.

### 1.2. Quy ước API

- Base path `/api`. Tất cả endpoint yêu cầu `Authorization: Bearer <jwt>`, **trừ** `/api/auth/register`, `/api/auth/login`, `/api/health`.
- Resource dạng số nhiều, kebab-case: `/api/vocabulary`, `/api/reviews/due`, `/api/study-sessions`, `/api/daily-plan/today`.
- Request/Response body là **java `record`**, đặt tên `XxxRequest` / `XxxResponse`. Không trả entity trực tiếp ra ngoài.
- JSON field: `camelCase`. Thời gian: ISO-8601 UTC (`Instant`).
- Lỗi: **RFC 7807 `ProblemDetail`** (built-in Spring). Lỗi validate trả 400 kèm extension `errors: { "<field>": "<message>" }`.
- Phân trang: query `?page=0&size=20`, trả `PageResponse<T> { content, page, size, totalElements, totalPages }` (tự định nghĩa ở `common/web`, **không** trả `Page` của Spring ra ngoài).

### 1.3. Quy ước database

- Migration: `backend/src/main/resources/db/migration/V{n}__{snake_case_desc}.sql`, đánh số tăng dần, **không bao giờ sửa file đã apply** — sai thì thêm migration mới.
- `spring.jpa.hibernate.ddl-auto=validate` **luôn luôn**. Schema chỉ do Flyway tạo.
- `spring.jpa.open-in-view=false`.
- Tên bảng/cột: `snake_case`, số ít (`vocabulary`, `review_history`, `app_user`).
- Mọi cột thời gian: `TIMESTAMPTZ`, map sang `Instant`.
- Khoá chính: `BIGSERIAL` → `Long` (trừ `language` dùng `SMALLSERIAL`).

### 1.4. Thời gian & tính xác định

- **Luôn inject `java.time.Clock`**, không bao giờ gọi `Instant.now()` trực tiếp trong service.
- `common/config/ClockConfig` cung cấp `Clock.systemUTC()`; test inject `Clock.fixed(...)`.
- Đây là điều kiện để test SRS deterministic được.

### 1.5. Quy ước frontend

```
frontend/src/
├── api/
│   ├── client.ts               // fetch wrapper: gắn Bearer, parse ProblemDetail, ném ApiError, 401 -> logout
│   └── <domain>.ts             // hàm thuần gọi API: fetchVocabularyList, createVocabulary...
├── hooks/use<Domain>.ts        // wrap react-query, export <domain>Keys
├── pages/<Name>Page.tsx
├── components/
│   ├── ui/                     // Button, Input, Select, Card, Dialog, Badge — dùng chung
│   └── <domain>/<Name>.tsx
├── stores/authStore.ts, uiStore.ts   // zustand (+ persist cho auth)
├── types/domain.ts             // mirror DTO backend, viết tay
├── lib/cn.ts, lib/format.ts
└── router.tsx
```

- Tên file component = tên component, PascalCase. Hook `useXxx`. Hàm API dùng động từ (`fetch*`, `create*`, `update*`, `delete*`).
- Query key tập trung mỗi domain: `export const vocabularyKeys = { all: ['vocabulary'], list: (p) => [...], detail: (id) => [...] }`. Không viết mảng key rời rạc trong component.
- Server state **chỉ** ở react-query. Zustand chỉ giữ auth token + UI state (ngôn ngữ đang chọn).
- UI copy: **tiếng Anh**.
- Không thêm dependency ngoài danh sách đã chốt nếu không có lý do ghi vào decision log.

### 1.6. Quy ước test

| Loại | Đặt tên | Công cụ |
|---|---|---|
| Unit (không Spring context) | `XxxTest.java` | JUnit 5 (+ Mockito khi cần) |
| Integration (có DB thật) | `XxxIntegrationTest.java` extends `AbstractIntegrationTest` | `@SpringBootTest` + Testcontainers `@ServiceConnection` |
| Ranh giới kiến trúc | `ArchitectureTest.java` | ArchUnit (từ Phase 5) |
| Frontend | `Xxx.test.tsx` cạnh file | Vitest + React Testing Library |

- `AbstractIntegrationTest` giữ **một** `PostgreSQLContainer` static dùng chung cho cả suite.
- **Không test nào được gọi API Claude thật.** Luôn mock `AIProvider`.
- Ưu tiên tuyệt đối: `Sm2AlgorithmTest` phải phủ đủ mọi rating × mọi trạng thái.

### 1.7. Quy ước git & vòng lặp làm việc

- **`main` và `dev` không bao giờ nhận commit/push trực tiếp.** Mọi thay đổi — kể cả 1 task nhỏ trong 1 phase —
  đi qua branch riêng rồi mở Pull Request merge vào `dev`. `dev` merge vào `main` khi có bản release/deploy.
- Branch đặt từ `dev`, đặt tên `phase/<n>-<slug>` cho cả phase, hoặc `phase/<n>-<slug>/<task-slug>` khi một
  task đủ lớn để tách branch riêng trong phase (vd `phase/3-srs-review`, `phase/3-srs-review/sm2-algorithm`).
  Tên branch phải cho biết ngay đang làm phase nào để dễ theo dõi tiến độ trên GitHub.
- Mỗi branch → một Pull Request nhắm vào `dev`, tiêu đề nêu rõ phase/task, mô tả liệt kê task nào trong
  checklist của file phase đã xong. Merge PR xong mới tick `- [x]` các task tương ứng trong file phase.
- Commit: Conventional Commits, scope = tên module — `feat(vocabulary): add attribute validation per language`.
- **Thứ tự làm trong mỗi phase** (giữ nguyên ở mọi phase để nhất quán):
  1. Migration SQL → 2. Entity → 3. Repository → 4. Service + unit test → 5. Controller + integration test
  → 6. `types/domain.ts` → 7. `api/<domain>.ts` → 8. `hooks/use<Domain>.ts` → 9. Component/Page → 10. FE test
- **Cổng kiểm tra trước khi mở PR / đóng phase** (bắt buộc chạy hết, xanh hết):
  ```
  cd backend  && ./mvnw verify
  cd frontend && npm run lint && npm run build && npm run test
  ```
- Đóng phase: PR cuối cùng của phase merge vào `dev` xong, tick hết checkbox trong file phase tương ứng,
  cập nhật decision log ở đây nếu có thay đổi.

---

## 2. Bản đồ phase

| Phase | File | Nội dung | Milestone cũ | Ước lượng | Trạng thái |
|---|---|---|---|---|---|
| P0 | [phase-0-foundation.md](./phase-0-foundation.md) | Nền tảng & toolchain | — | 0.5–1 ngày | [ ] |
| P1 | [phase-1-auth-shell.md](./phase-1-auth-shell.md) | Auth + App shell | M1 | 1–1.5 ngày | [ ] |
| P2 | [phase-2-vocabulary.md](./phase-2-vocabulary.md) | Language + Vocabulary | M2, M3 | 2–3 ngày | [x] |
| P3 | [phase-3-srs-engine.md](./phase-3-srs-engine.md) | SRS engine + Review + History | M4, M5 | 2–3 ngày | [x] |
| P4 | [phase-4-study-dashboard.md](./phase-4-study-dashboard.md) | Study session + Dashboard + Progress | M6, M7, M10 | 2–3 ngày | [x] |
| **— MỐC A: app dùng được hằng ngày, không cần AI —** | | | | | |
| P5 | [phase-5-ai-tutor.md](./phase-5-ai-tutor.md) | AI Tutor | M8 | 2–3 ngày | [x] |
| **— MỐC B: MVP đủ 5 màn hình theo PROJECT.md §9 —** | | | | | |
| P6 | [phase-6-mistake-book.md](./phase-6-mistake-book.md) | Mistake Book | M9 | 1–2 ngày | [x] |
| P7 | [phase-7-daily-plan.md](./phase-7-daily-plan.md) | Daily Plan | M11 | 2 ngày | [x] |
| P8 | [phase-8-conversation-deploy.md](./phase-8-conversation-deploy.md) | Conversation nâng cao + Deploy | M12 | 2 ngày | [ ] |

**Vì sao thứ tự này nhanh nhất & ổn định nhất:** toàn bộ giá trị lõi (vocabulary + SRS + lịch sử học) là deterministic, test được 100%, không phụ thuộc dịch vụ ngoài. Làm xong P4 là đã có app học thật sự dùng được mỗi ngày. AI — phần rủi ro nhất về chi phí, latency và tính ổn định — được đẩy xuống sau, khi nền dữ liệu đã chắc và AI có context thật để làm việc.

> Cập nhật cột "Trạng thái" ở bảng trên bằng tay khi đóng một phase (đổi `[ ]` → `[x]`), song song với việc tick hết checkbox trong file phase đó.

---

## 3. Những điều tuyệt đối không vi phạm

1. **AI không bao giờ ghi vào `review_schedule`.** Mọi thay đổi lịch ôn đi qua `ReviewService`. ArchUnit chặn cứng.
2. `spring.jpa.hibernate.ddl-auto` luôn là `validate`. Schema chỉ do Flyway tạo.
3. Không sửa migration đã apply — chỉ thêm file mới.
4. Không gọi `Instant.now()` trong service — luôn inject `Clock`.
5. Controller không inject Repository; service không inject repository của module khác.
6. Không thêm dependency ngoài danh sách đã chốt mà không ghi vào decision log (mục 0).
7. Không test nào gọi API Claude thật.
8. Không implement bất cứ thứ gì trong `PROJECT.md` §11 (multi-user, social, payment, gamification...).
9. Không bắt đầu phase sau khi phase trước chưa qua cổng kiểm tra ở §1.7.

---

## 4. Rủi ro & cách chặn

| Rủi ro | Chặn bằng |
|---|---|
| SM-2 tinh chỉnh chưa tối ưu | Ghi đủ `review_history` (previous/new interval) để sau chuyển FSRS không mất dữ liệu; `SrsAlgorithm` là interface. |
| JSONB `attributes` thành bãi rác | `VocabularyAttributesValidator` whitelist theo ngôn ngữ + test riêng cho từng ngôn ngữ (P2). |
| AI chậm / tốn tiền / trả JSON hỏng | Giới hạn context top-N, structured output, timeout + retry 1 lần, log token usage, UI có trạng thái lỗi rõ ràng. |
| Lệch type giữa BE và FE | `types/domain.ts` viết tay đối chiếu DTO ngay trong cùng phase (bước 6 của §1.7). Cân nhắc OpenAPI codegen sau khi API ổn định. |
| Phase phình to, kéo dài | Mỗi phase có mục "Ngoài phạm vi"; việc phát sinh ghi thành phase sau, không nhét vào phase đang làm. |
| Mất dữ liệu học tích luỹ | `scripts/backup.sh` + volume Postgres có tên; migration không bao giờ `DROP` dữ liệu. |
| Deploy VPS hở bảo mật | `JWT_SECRET` qua env, bcrypt, HTTPS bắt buộc, tắt đăng ký, rate limit login (P8). |

---

## 5. Câu hỏi còn mở (không chặn P0–P4)

1. ~~Trình độ hiện tại (CEFR/HSK)~~ — đã chốt ở D11 (P5): suy ra tự động từ vocabulary đã học.
2. ~~Số "từ mới mỗi ngày"~~ — đã chốt ở D13 (P7): engine tự tính theo thời gian rảnh.
3. ~~Tone giọng AI~~ — đã chốt ở D12 (P5): thân thiện, khích lệ.
4. ~~Export/import dữ liệu~~ — đã chốt ở D16 (P8): không cần, chỉ dựa vào backup hạ tầng.

Không còn câu hỏi mở nào chặn tiến độ — tất cả đã được chốt qua D11–D16.

> Ngưỡng "mastered" đã được chốt ở P4 (`intervalDays >= 21 && easeFactor >= 2.5`, đặt trong `MasteryPolicy`), không còn là câu hỏi mở.
