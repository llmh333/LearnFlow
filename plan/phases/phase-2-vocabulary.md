# Phase 2 — Language + Vocabulary

[← Overview](./00-overview.md) · [← Phase 1](./phase-1-auth-shell.md) · [Phase 3 →](./phase-3-srs-engine.md)

- **Milestone cũ:** M2, M3
- **Ước lượng:** 2–3 ngày
- **Trạng thái:** [x] Hoàn thành

## Goal

Kho từ vựng hoạt động đầy đủ cho cả EN, ZH và JA, đúng cơ chế attributes theo ngôn ngữ. Mỗi ngôn ngữ phục vụ
đúng 1 mục tiêu chứng chỉ (EN→IELTS, ZH→HSK, JA→JLPT — xem D9). Trường `meaning` luôn nhập bằng tiếng Việt (D10).

## Tasks

### Backend
- [x] `V2__create_language.sql`: bảng `language` + seed `('en','English')`, `('zh','Chinese')`, `('ja','Japanese')`.
- [x] `V3__create_vocabulary.sql`: `vocabulary` (có `attributes JSONB`, index GIN), `vocabulary_tag`, `vocabulary_tag_link`.
- [x] `language/`: entity + repository + service + `GET /api/languages`.
- [x] `vocabulary/domain/Vocabulary` — dùng `@JdbcTypeCode(SqlTypes.JSON) Map<String,Object> attributes` (Hibernate 6, không cần thư viện ngoài).
  > Cần thêm `@Column(columnDefinition = "jsonb")` cùng `@JdbcTypeCode` để Hibernate validate đúng cột
  > `jsonb` (mặc định JSON sqltype code của Hibernate map ra `json`, không khớp cột thật) — không có trong
  > checklist gốc nhưng bắt buộc để `ddl-auto=validate` không báo lỗi khi khởi động.
- [x] `vocabulary/domain/VocabularyTag` + quan hệ many-to-many.
- [x] `vocabulary/VocabularyRepository` + `VocabularySpecifications` cho search/filter/tag.
- [x] `vocabulary/VocabularyAttributesValidator`: whitelist theo `language.code`.
  - [x] `en`: `ipa`, `partOfSpeech`, `cefrLevel` (A1..C2), `collocations` (list).
  - [x] `zh`: `pinyin`, `hskLevel` (1..6), `examplePinyin`, `measureWord`.
  - [x] `ja`: `reading`, `exampleReading`, `partOfSpeech`, `jlptLevel` (N5..N1).
  - [x] Key lạ → 400 (qua `BadRequestException` mới, thêm handler trong `GlobalExceptionHandler`).
- [x] `vocabulary/VocabularyService`.
- [x] `vocabulary/VocabularyController`.
- [x] Endpoint `GET /api/vocabulary?language=&search=&tag=&page=&size=`.
- [x] Endpoint `GET/POST/PUT/DELETE /api/vocabulary/{id}`.
- [x] Endpoint `GET /api/vocabulary/tags`.
  > Body tạo/sửa dùng `languageCode` (không phải `languageId`) để frontend không cần biết số id — khớp với
  > query param `language=` (cũng là code) cho nhất quán.

### Frontend
- [x] `types/domain.ts` (Language, Vocabulary, EnglishAttributes, ChineseAttributes, JapaneseAttributes, PageResponse).
- [x] `api/languages.ts`.
- [x] `api/vocabulary.ts`.
- [x] `hooks/useLanguages.ts`.
- [x] `hooks/useVocabulary.ts`.
- [x] `stores/uiStore.ts`: ngôn ngữ đang chọn (đồng bộ với query param trên URL qua `VocabularyPage`).
- [x] `components/common/LanguageSwitcher.tsx`.
- [x] `pages/VocabularyPage.tsx`: bảng danh sách + ô search (debounce 300ms) + lọc ngôn ngữ/tag + phân trang.
- [x] `components/vocabulary/VocabularyForm.tsx`: field đổi theo ngôn ngữ đang chọn (EN: IPA/POS/CEFR/collocations; ZH: pinyin/HSK/example pinyin/measure word; JA: reading/POS/JLPT/example reading). Field `meaning` luôn có placeholder/label nhắc nhập tiếng Việt.
- [x] ~~`components/vocabulary/VocabularyDetail.tsx` (dialog)~~ — **gộp vào `VocabularyForm`**: mở cùng
  một dialog "Edit word" đã điền sẵn dữ liệu vừa là xem chi tiết vừa là sửa, tránh một component chỉ-đọc
  trùng lặp gần như y hệt form (đơn giản hoá hợp lý, không lệch DoD).
- [x] `components/ui/{Select, Dialog, Badge, Table}.tsx`.

### Test
- [x] `VocabularyAttributesValidatorTest` (hợp lệ/thiếu/thừa key cho cả 3 ngôn ngữ).
- [x] `VocabularyServiceTest`.
- [x] `VocabularyIntegrationTest` (CRUD + search + filter tag + phân trang).
- [x] FE test `VocabularyForm` đổi field theo ngôn ngữ (EN/ZH/JA).
  > Thêm `LanguageIntegrationTest` (không có trong checklist gốc) để phủ riêng `GET /api/languages`.

## Definition of Done
- [x] Thêm/sửa/xoá/tìm từ EN, ZH và JA qua UI. (Verify qua curl thật: register → create `ja` word với
  `reading`/`jlptLevel` → list filter `language=ja` → delete → 404. Xem log phiên làm việc Phase 2.)
- [x] Reload vẫn còn dữ liệu. (Postgres thật qua Testcontainers + docker-compose smoke test, không phải
  in-memory — dữ liệu persist bình thường.)
- [x] Nhập key lạ vào attributes bị từ chối 400. (Verify qua curl thật: `{"notReal":"z"}` cho `ja` → `HTTP 400`
  kèm message liệt kê đúng allowed keys.)

**Cổng kiểm tra đã chạy xanh hết:** `cd backend && ./mvnw verify` (30/30 test pass, gồm cả
`VocabularyIntegrationTest`/`LanguageIntegrationTest` qua Testcontainers Postgres thật) và
`cd frontend && npm run lint && npm run build && npm run test` (6/6 test pass).
