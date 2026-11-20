---
paths:
  - "backend/src/main/resources/content/**"
  - "scripts/content/**"
---

# Content rules (nội dung học, đa ngôn ngữ — D18)

Nguồn yêu cầu: `plan/2026-11-17-japanese-learning-path-refactor.md` §3. File này là mô tả duy nhất
của định dạng nội dung; đổi định dạng thì sửa ở đây cùng PR với `ContentBundle`.

## Vị trí và cách import

- Nội dung nằm ở `backend/src/main/resources/content/` (quyết định D11), vào jar cùng backend.
- `ContentImporter` đọc mọi `**/*.yaml` khi khởi động, kiểm tra bằng `ContentBundle`, rồi upsert theo
  `key` trong một transaction. Nội dung sai thì app **không khởi động** và không ghi gì.
- `app.content.include-drafts`: `true` ở profile `local` và `test`, `false` ở prod.
- `ContentBundleTest.shippedContent_isValidWithAndWithoutDrafts` kiểm nội dung thật ở cả hai chế độ (CI).
- Xoá mục khỏi YAML **không** xoá khỏi DB (tiến độ người dùng có thể trỏ tới). Không đổi `key` đã import.

## Định dạng

Mỗi file có thể chứa bất kỳ phần nào: `sources`, `courses`, `units`, `kana`, `words`, `characters`, `grammar`,
`sentences`. Tham chiếu được trỏ sang file khác. Enum viết chữ thường (`draft`, `hiragana`, `n5`).
Mỗi phần map sang một bảng riêng (D13); DB có CHECK, nên `ContentBundle` báo lỗi trước để dễ đọc.

```yaml
sources:
  - { key: jmdict, name: JMdict, license: CC BY-SA 4.0, url: …, licenseUrl: …, attribution: … }
courses:
  - { key: ja.course.n5, language: ja, level: n5, title: Sơ cấp N5, position: 2, status: draft }
units:
  - key: ja.n5.u01
    course: ja.course.n5
    position: 1
    title: Chào hỏi
    status: draft
    lessons:                      # vị trí bài = thứ tự trong list
      - key: ja.n5.u01.l01
        title: Lời chào hằng ngày
        status: draft
        items: [ja.word.konnichiha, …]   # key của kana/word/character/grammar/sentence, không lặp
words:
  - key: ja.word.taberu
    status: draft                 # draft | reviewed
    source: jmdict                # key trong sources
    sourceRef: 1358280            # id ở nguồn (tuỳ chọn)
    written: 食べる               # bỏ trống nếu từ chỉ viết bằng kana
    reading: たべる
    meaningsVi: [ăn]
    examples: [ja.sentence.…]     # key câu ví dụ (tuỳ chọn)
```

| Phần | Bắt buộc | Tuỳ chọn |
|---|---|---|
| `kana` | `character` (1–2 chữ đúng bảng), `script` (`hiragana`/`katakana`), `romaji` (a–z), `group` (`basic`/`dakuten`/`handakuten`/`yoon`), `row`, `position` | |
| `words` | `reading` (đúng luật ngôn ngữ: `ja` chỉ kana), `meaningsVi` (≥ 1) | `written`, `meaningsEn`, `partOfSpeech`, `level` (cấp của ngôn ngữ, viết thường: `n5`), `note`, `examples`, `sourceRef` |
| `characters` | `character` (đúng 1 chữ Hán: kanji/hán tự), `meaningsVi` (≥ 1) | `hanViet` (âm Hán Việt, viết hoa), `meaningsEn`, `readings` (`{on: [...], kun: [...]}` với `ja`; `pinyin` với `zh`; okurigana trong ngoặc: `まな(ぶ)`), `strokeCount`, `level`, `sourceRef` |
| `grammar` | `pattern`, `explanationVi` | `meaningVi`, `level`, `examples` |
| `sentences` | `text`, `translationVi` | `reading`, `translationEn`, `sourceRef`, `sourceAuthor` (bắt buộc với Tatoeba) |

Mọi mục đều cần `key`, `status`, `source`. Course cần `language`; `level` để trống với khoá ngoài khung cấp
(Kana).

## Đa ngôn ngữ (D18)

- **Ngôn ngữ của một mục là đoạn đầu của key**: `ja.word.taberu` → `ja`. Key không bắt đầu bằng mã ngôn ngữ
  đã có luật là lỗi import. Thư mục nội dung theo ngôn ngữ: `content/<lang>/`.
- Bảng dùng chung mọi ngôn ngữ: `word`, `han_character` (+ `han_character_reading`), `grammar_point`,
  `example_sentence`, `course`. Chỉ thứ thật sự riêng một ngôn ngữ mới có bảng riêng (`kana`).
- **Cấp độ là dữ liệu**, không phải enum: bảng `proficiency_level` (JLPT, HSK, CEFR). YAML ghi mã cấp viết
  thường (`n5`, `hsk1`, `a1`).
- Luật riêng từng ngôn ngữ nằm trong `curriculum/engine/LanguageRules` (cách đọc hợp lệ, loại cách đọc của chữ
  Hán, danh sách cấp). Thêm ngôn ngữ = một `LanguageRules` + dòng `language` + seed `proficiency_level`
  (test `languageRuleLevels_matchTheSeededLevels` kiểm hai bên khớp). Không thêm bảng, enum hay API.

- Quy ước key: `ja.<loại>.<slug>`, kana `ja.kana.hira.<romaji>` / `ja.kana.kata.<romaji>` (ぢ/づ dùng `di`/`du`),
  từ `ja.word.<romaji cách đọc>` (đồng âm thêm `-2`, `-3`, trùng key với migration V22/V23 để YAML ghi đè),
  chữ Hán `<lang>.kanji.<chữ>` (`zh` dùng `zh.hanzi.<chữ>`), câu Tatoeba `<lang>.sentence.tatoeba-<id>`.
  Key là duy nhất trên mọi loại mục.
- YAML ở đây không có boolean: `no`, `on`, `off` được đọc là chuỗi, không cần bọc nháy.
- Mục `reviewed` chỉ được trỏ tới mục `reviewed` (course của unit, item của lesson, câu ví dụ); vi phạm là
  lỗi import.

## Nguyên tắc

- **File YAML trong thư mục nội dung là nguồn sự thật.** Duyệt nội dung chính là review PR.
- Mỗi mục có `content_key` ổn định (ví dụ `ja.word.taberu`), không đổi sau khi đã import.
- Mỗi mục có trạng thái `draft` hoặc `reviewed`. Chỉ `reviewed` được import vào môi trường thật.
  Nội dung do AI sinh luôn bắt đầu ở `draft`.
- Mỗi mục ghi **nguồn** (JMdict, KANJIDIC2, Tatoeba, danh sách JLPT, AI, tự viết).
- Nghĩa (`meaning`) luôn là **tiếng Việt**, tự nhiên, nghĩa thông dụng nhất đặt trước. Giữ nghĩa tiếng
  Anh gốc ở trường riêng để đối chiếu.
- Câu ví dụ chỉ dùng từ vựng và ngữ pháp **không vượt cấp** của mục đó.
- Cách đọc (furigana, pinyin…) khớp ngữ cảnh và khớp chữ Hán tương ứng.
- Không chép nội dung từ giáo trình hoặc trang web thương mại không có giấy phép tương thích.

## Giấy phép

| Nguồn | Giấy phép | Phải làm |
|---|---|---|
| JMdict, KANJIDIC2 | CC BY-SA 4.0 | Ghi nguồn; dữ liệu phái sinh giữ CC BY-SA. Không dùng số liệu tần suất của Halpern |
| Tatoeba | CC BY 2.0 FR (một phần CC0) | Ghi nguồn và link; không dùng audio của Tatoeba |
| Danh sách JLPT của Waller | CC BY theo các repo phân phối lại (chưa xác minh trực tiếp; tanos.co.uk không truy cập được) | Đã nạp N5/N4 ở `DRAFT` bằng migration V21–V23. **Xác minh giấy phép (và việc nghĩa tiếng Anh có lấy từ JMdict, CC BY-SA, hay không) trước khi chuyển sang `reviewed`** |
| AnimCJK | LGPL / Arphic | Giữ ghi nguồn như ở `WordStrokeOrder.tsx` |

## Quy trình

- Script nhập/làm giàu nằm ở `scripts/content/` (TypeScript), chạy tay, không chạy trong app. Phần dùng chung
  ở `lib/` và `enrich-ai.ts`; nguồn riêng từng ngôn ngữ ở `scripts/content/<lang>/`.
- Script làm giàu bằng AI ghi lại model và prompt đã dùng để làm lại được.
- Mọi thay đổi nội dung đi qua subagent `content-reviewer` trước khi mở PR.
