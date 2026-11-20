# Nội dung đa ngôn ngữ (D18)

> Branch `phase/r1-multilingual` từ `dev`. Quyết định: D18 trong `plan/2026-11-17-japanese-learning-path-refactor.md`.
> Mục tiêu: thêm tiếng Trung/Anh sau này chỉ cần dữ liệu + một `LanguageRules`, không thêm bảng/enum/API mới.
> Không làm: nội dung hay luật cho `zh`/`en`; JSONB; đổi `meanings_vi` (người học là người Việt).

## Vì sao migration mới mà không reset

V1–V24 đã merge vào `dev`; `guard.py` chặn sửa migration đã merge. DB chưa deploy nên V25+ đổi tên/chuyển dữ
liệu cho ra cùng schema đích như reset, chỉ lịch sử dài hơn.

## Schema đích

| Bảng | Thay đổi |
|---|---|
| `proficiency_level` (mới) | `language_id`, `framework` (`JLPT`/`HSK`/`CEFR`), `code`, `rank`; seed `ja` N5–N1 |
| `course` | `level` (enum có `KANA`) → `level_id` (NULL cho khoá Kana) |
| `jp_word` → `word` | + `language_id`, `jlpt_level` → `level_id` |
| `jp_kanji` → `han_character` | + `language_id`, `jlpt_level` → `level_id`; `onyomi`/`kunyomi` → bảng `han_character_reading` |
| `han_character_reading` (mới) | `(han_character_id, position)`, `kind` (`ON`/`KUN`/`PINYIN`), `value` |
| `grammar_point` | + `language_id`, `jlpt_level` → `level_id` |
| `example_sentence` | + `language_id` |
| `lesson_item` | `kanji_id` → `han_character_id` |
| `kana` | giữ (chỉ tiếng Nhật có) |

## Tiến độ (2026-11-20, chưa merge nên chưa tick)

Backend, nội dung, script, tài liệu: xong trên branch, `./mvnw verify` xanh (81 test), script test xanh (6).
Nội dung YAML chỉ đổi cấu trúc (`jlptLevel` → `level`, `kanji` → `characters`, on/kun → `readings`), không đổi
nghĩa hay chữ, nên không cần duyệt lại. Còn lại: frontend.

## Checklist

### Backend
- [ ] Migration V25–V33, mỗi file một bảng
- [ ] Entity: `Word`, `HanCharacter` (+ readings), `ProficiencyLevel`; `language`/`level` ở course, grammar, sentence;
      xoá `JlptLevel`, `CourseLevel`
- [ ] Repository đổi tên; `ProficiencyLevelRepository`
- [ ] Engine: `LanguageRules` + `JapaneseRules` (cách đọc là kana, loại cách đọc on/kun, danh sách cấp);
      ngôn ngữ lấy từ tiền tố key; YAML `level` thay `jlptLevel`, section `characters` thay `kanji`,
      `readings: {on: [...], kun: [...]}`
- [ ] Importer: tra `language` + `proficiency_level` theo code
- [ ] API: `/dictionary/words?lang=&level=`, `/dictionary/levels?lang=`; response `level`; `CourseResponse.level`
- [ ] Test: unit + integration cập nhật; test DB levels khớp `LanguageRules`

### Nội dung, script, tài liệu
- [ ] YAML: `jlptLevel` → `level`, `kanji` → `characters`, on/kun → `readings`
- [ ] `scripts/content/`: phần riêng tiếng Nhật vào `ja/`, `lib/` dùng chung; sinh lại YAML
- [ ] `content.md`: quy ước chung + mục tiếng Nhật; `AGENTS.md`, `backend.md`; `spec-dictionary.md`
- [ ] content-reviewer (chỉ đổi cấu trúc, nội dung giữ nguyên)

### Frontend (Antigravity, theo `plan/spec-dictionary.md`)
- [ ] `jlptLevel` → `level`; gửi `lang`; lấy danh sách cấp từ `/dictionary/levels`

### Cổng kiểm tra
- [ ] `./mvnw verify`, `node --test scripts/content/scripts.test.ts`
