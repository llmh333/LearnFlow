# Content scripts (R1 mục F)

Chạy tay, không chạy trong app. Node 22 chạy thẳng file `.ts` (không cần build). Kết quả là YAML ở
`backend/src/main/resources/content/` với `status: draft`; người duyệt mới chuyển sang `reviewed`.
Quy ước nội dung và giấy phép: `.claude/rules/content.md`.

## Luồng

```
nguồn (tải về, không commit)  →  import-*.ts  →  candidates.json  →  enrich-ai.ts  →  content/*.yaml
```

| Script | Đầu vào | Ra |
|---|---|---|
| `import-kanjidic.ts --input kanjidic2-en.json --level N5 --out kanji.json` | KANJIDIC2 JSON (jmdict-simplified) | kanji theo cấp, kèm âm Hán Việt, on/kun, số nét |
| `import-jmdict.ts --input jmdict-eng.json --words words.tsv --out words.json` | JMdict JSON + danh sách từ | id JMdict, từ loại, nghĩa tiếng Anh (nghĩa đầu tiên) |
| `import-tatoeba.ts --sentences … --vie-links … --vie … --eng-links … --eng … --words words.tsv --out s.json` | file per-language của Tatoeba | câu ngắn chứa từ, kèm id + tác giả (CC BY) |
| `enrich-ai.ts --in x.json --out file.yaml [--vi file.tsv] [--model …]` | candidates | YAML; tiếng Việt lấy từ `--vi` hoặc Claude API |

`words.tsv`: `key<TAB>written<TAB>reading<TAB>level`. File `--vi`: `key<TAB>nghĩa|nghĩa…` (câu: `dịch|cách đọc`;
kanji thêm cột 3 là âm Hán Việt giữ lại). Dữ liệu đầu vào đã dùng nằm ở `data/` để chạy lại được.

## Nguồn tải

- JMdict / KANJIDIC2: https://github.com/scriptin/jmdict-simplified/releases (`jmdict-eng-*.json.tgz`,
  `kanjidic2-en-*.json.tgz`), CC BY-SA 4.0 © EDRDG.
- Tatoeba: https://downloads.tatoeba.org/exports/per_language/ (`jpn_sentences_detailed`, `jpn-vie_links`,
  `vie_sentences`, `jpn-eng_links`, `eng_sentences`), CC BY 2.0 FR. Không dùng audio.

## Chế độ AI

Không có `--vi`: `npm install` trong thư mục này, rồi đăng nhập (`ANTHROPIC_API_KEY` hoặc `ant auth login`).
Mặc định model `claude-opus-5-5`. Header của YAML ghi model và prompt đã dùng.

## Test

`node --test scripts/content/scripts.test.ts` (chỉ hàm thuần, không cần file nguồn).

## Đã chạy (2026-11-20)

- `ja/kanji/n5.yaml`: 103 kanji N5 (KANJIDIC2 3.6.2+20261116), nghĩa Việt `data/kanji-n5.vi.tsv`.
- `ja/n5/unit-02-03.words.yaml`: 38 từ (JMdict), nghĩa Việt giống migration V22.
- `ja/n5/unit-02-03.sentences.yaml`: 9 câu Tatoeba chọn tay (đúng cấp N5, qua content-reviewer) từ 151 ứng viên;
  id các câu giữ lại nằm trong `data/n5-units-02-03.sentences.vi.tsv`.
