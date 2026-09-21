# Phase 2 — Language + Vocabulary

[← Overview](./00-overview.md) · [← Phase 1](./phase-1-auth-shell.md) · [Phase 3 →](./phase-3-srs-engine.md)

- **Milestone cũ:** M2, M3
- **Ước lượng:** 2–3 ngày
- **Trạng thái:** [ ] Chưa bắt đầu

## Goal

Kho từ vựng hoạt động đầy đủ cho cả EN và ZH, đúng cơ chế attributes theo ngôn ngữ.

## Tasks

### Backend
- [ ] `V2__create_language.sql`: bảng `language` + seed `('en','English')`, `('zh','Chinese')`.
- [ ] `V3__create_vocabulary.sql`: `vocabulary` (có `attributes JSONB`, index GIN), `vocabulary_tag`, `vocabulary_tag_link`.
- [ ] `language/`: entity + repository + service + `GET /api/languages`.
- [ ] `vocabulary/domain/Vocabulary` — dùng `@JdbcTypeCode(SqlTypes.JSON) Map<String,Object> attributes` (Hibernate 6, không cần thư viện ngoài).
- [ ] `vocabulary/domain/VocabularyTag` + quan hệ many-to-many.
- [ ] `vocabulary/VocabularyRepository` + `VocabularySpecifications` cho search/filter/tag.
- [ ] `vocabulary/VocabularyAttributesValidator`: whitelist theo `language.code`.
  - [ ] `en`: `ipa`, `partOfSpeech`, `cefrLevel` (A1..C2), `collocations` (list).
  - [ ] `zh`: `pinyin`, `hskLevel` (1..6), `examplePinyin`, `measureWord`.
  - [ ] Key lạ → 400.
- [ ] `vocabulary/VocabularyService`.
- [ ] `vocabulary/VocabularyController`.
- [ ] Endpoint `GET /api/vocabulary?language=&search=&tag=&page=&size=`.
- [ ] Endpoint `GET/POST/PUT/DELETE /api/vocabulary/{id}`.
- [ ] Endpoint `GET /api/vocabulary/tags`.

### Frontend
- [ ] `types/domain.ts` (Language, Vocabulary, EnglishAttributes, ChineseAttributes, PageResponse).
- [ ] `api/languages.ts`.
- [ ] `api/vocabulary.ts`.
- [ ] `hooks/useLanguages.ts`.
- [ ] `hooks/useVocabulary.ts`.
- [ ] `stores/uiStore.ts`: ngôn ngữ đang chọn (đồng bộ với query param trên URL).
- [ ] `components/common/LanguageSwitcher.tsx`.
- [ ] `pages/VocabularyPage.tsx`: bảng danh sách + ô search (debounce) + lọc tag + phân trang.
- [ ] `components/vocabulary/VocabularyForm.tsx`: field đổi theo ngôn ngữ đang chọn (EN: IPA/POS/CEFR/collocations; ZH: pinyin/HSK/example pinyin/measure word).
- [ ] `components/vocabulary/VocabularyDetail.tsx` (dialog).
- [ ] `components/ui/{Select, Dialog, Badge, Table}.tsx`.

### Test
- [ ] `VocabularyAttributesValidatorTest` (hợp lệ/thiếu/thừa key cho cả 2 ngôn ngữ).
- [ ] `VocabularyServiceTest`.
- [ ] `VocabularyIntegrationTest` (CRUD + search + filter tag + phân trang).
- [ ] FE test `VocabularyForm` đổi field theo ngôn ngữ.

## Definition of Done
- [ ] Thêm/sửa/xoá/tìm từ EN và ZH qua UI.
- [ ] Reload vẫn còn dữ liệu.
- [ ] Nhập key lạ vào attributes bị từ chối 400.
