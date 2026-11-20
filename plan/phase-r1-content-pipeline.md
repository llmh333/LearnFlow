# Phase R1 — Pipeline nội dung

> Nguồn yêu cầu: `plan/2026-11-17-japanese-learning-path-refactor.md` §3, §5.1, §5.3, §7 (R1).
> Mục tiêu: có dữ liệu Kana + N5 đã duyệt trong DB.
> Xong khi: Unit 1–3 N5 ở trạng thái `reviewed` và import được.

## Phân tích

R1 gồm hai nửa khác nhau về bản chất:

1. **Hạ tầng trong app (code):** schema nội dung global, định dạng YAML, `ContentImporter`, API đọc lộ trình,
   trang "Nguồn & giấy phép". Đây là phần làm và kiểm chứng được bằng test.
2. **Nội dung + công cụ ngoài app:** script import JMdict/KANJIDIC2/Tatoeba, script AI làm giàu, xác minh
   giấy phép danh sách JLPT, và **người duyệt** Unit 1–3. Phần duyệt là việc của người, không tự động được.

Vì vậy chia thành hai branch:

- `phase/r1-content-pipeline`: hạ tầng (mục A–D) + nội dung mẫu ở trạng thái `draft` (mục E).
- `phase/r1-content-pipeline/import-scripts`: script trong `scripts/content/` (mục F).

### Quyết định thiết kế

- Schema nội dung theo `plan/2026-11-18-database-redesign.md` (D12–D13): bảng riêng cho từng loại, nằm trong
  `V1`–`V16` (mỗi bảng một migration) sau khi reset database. (Bản đầu dùng một bảng `content_item` + JSONB — D10 — đã bỏ.)
- **File nội dung nằm trong `backend/src/main/resources/content/`** (D11): Docker build context của backend
  là `backend/`, để ở đây thì nội dung tự vào jar.
- `passage` (bài đọc) chưa tạo bảng: thuộc R5.

## Tiến độ (2026-11-20, chưa merge nên chưa tick)

- A–D: xong (commit `0bb66ae`).
- E: xong + thêm kana biến âm/âm ghép (208 chữ), N5 Unit 2–3, 103 kanji N5 (kèm âm Hán Việt, migration V24).
- F: `scripts/content/` có `import-kanjidic.ts`, `import-jmdict.ts`, `import-tatoeba.ts`, `enrich-ai.ts` + test.
  Danh sách JLPT N5/N4 (Waller) đã nạp bằng migration V21–V23; **giấy phép Waller chưa xác minh được**
  (tanos.co.uk không truy cập được, chỉ có xác nhận CC BY từ các repo phân phối lại).
- G: còn lại là việc của người — duyệt Unit 1–3, Kana, kanji và chuyển `reviewed`; xác minh giấy phép Waller.

## Checklist

### A. Schema (`curriculum`)
- [ ] Bảng nội dung, mỗi bảng một migration (`V3`–`V14`): `content_source`, `course`, `unit`, `lesson`, `kana`, `jp_word`,
      `jp_kanji`, `grammar_point`, `example_sentence`, `word_example`, `grammar_example`, `lesson_item`
- [ ] Entity + repository trong `com.learnflow.backend.curriculum`

### B. Import
- [ ] Định dạng YAML (`sources`, `courses`, `units` kèm `lessons`, `kana`, `words`, `kanji`, `grammar`,
      `sentences`) — mô tả trong `.claude/rules/content.md`
- [ ] `ContentBundle` (engine thuần): gộp nhiều file, kiểm trùng key, trường bắt buộc, tham chiếu, lọc `draft`
- [ ] `ContentImporter`: chạy khi khởi động, upsert theo `content_key`, idempotent, một transaction;
      `app.content.include-drafts` bật ở profile `local`/`test`
- [ ] Unit test `ContentBundleTest`, integration test import lặp lại không nhân bản dữ liệu

### C. API
- [ ] `GET /api/v1/curriculum/courses` — cây course → unit → lesson (cần đăng nhập)
- [ ] `GET /api/v1/curriculum/sources` — công khai, cho trang giấy phép
- [ ] Integration test: 401, dữ liệu trả đúng

### D. Frontend
- [ ] Trang công khai `/sources` "Nguồn dữ liệu & giấy phép" + test

### E. Nội dung mẫu (`draft`, qua subagent `content-reviewer`)
- [ ] `sources.yaml`: JMdict, KANJIDIC2, Tatoeba, AI, tự viết
- [ ] `courses.yaml`: khoá Kana, N5
- [ ] `kana.yaml`: 46 Hiragana + 46 Katakana cơ bản
- [ ] `n5/unit-01.yaml`: Unit 1 N5 (chào hỏi)

### F. Script nội dung (branch riêng)
- [ ] `import-jmdict.ts`, `import-kanjidic.ts`, `import-tatoeba.ts` (đọc file nguồn đã tải về, ghi `draft`).
      Câu Tatoeba ghi `sourceRef` = id câu, kèm tác giả trong `data` (CC BY yêu cầu ghi công từng người)
- [ ] `enrich-ai.ts` (nghĩa tiếng Việt, ví dụ; ghi lại model + prompt)
- [ ] Xác minh giấy phép danh sách JLPT của Waller; nếu không rõ thì gán cấp bằng AI + đối chiếu

### G. Đóng phase (người làm)
- [ ] Biến âm, âm ghép Kana
- [ ] Unit 2–3 N5
- [ ] Người duyệt chuyển Unit 1–3 + Kana sang `reviewed`
