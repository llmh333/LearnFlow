# Đặc tả: Từ điển và phân loại từ theo trình độ (JLPT)

> Backend đã triển khai: `curriculum/DictionaryService`, `curriculum/api/v1/DictionaryController`.
> Dữ liệu lấy từ bảng `jp_word` (nội dung global đã import). Không cần migration mới.

## API (`/api/v1/dictionary`, cần đăng nhập — Bearer JWT)

### 1. Tìm / duyệt từ — `GET /words?q=&level=&page=0&size=20`

Mọi tham số đều tuỳ chọn. Không có `q` và `level` → duyệt toàn bộ từ điển.

| Tham số | Ý nghĩa |
|---|---|
| `q` | Chuỗi tìm (≤ 100 ký tự). Khớp: **đầu** cách đọc kana (`がく` → `がくせい`), **một phần** chữ viết (`学` → `学生`), **một phần** nghĩa tiếng Việt hoặc tiếng Anh (`sinh viên`, `student`, không phân biệt hoa thường). |
| `level` | `N5`, `N4`, `N3`, `N2`, `N1` (không phân biệt hoa thường). |
| `page`, `size` | Phân trang, `size` tối đa 50 (lớn hơn sẽ bị kẹp về 50). |

Sắp xếp: khớp chính xác cách đọc/chữ viết lên đầu → N5 → N1 (từ chưa có cấp ở cuối) → theo cách đọc.

Trả về `PageResponse<WordSummary>`:
```json
{
  "content": [
    { "id": 12, "written": "学生", "reading": "がくせい",
      "meaningsVi": ["sinh viên", "học sinh"], "partOfSpeech": ["noun"], "jlptLevel": "N5" }
  ],
  "page": 0, "size": 20, "totalElements": 1, "totalPages": 1
}
```
`written` = `null` khi từ chỉ viết bằng kana; `jlptLevel` = `null` khi từ chưa được xếp cấp.

### 2. Số từ theo cấp — `GET /levels`

Dùng cho tab/bộ lọc cấp độ. Luôn đủ N5 → N1 theo thứ tự (kể cả cấp chưa có từ), thêm một dòng
`level: null` ở cuối nếu có từ chưa xếp cấp.
```json
[ { "level": "N5", "wordCount": 13 }, { "level": "N4", "wordCount": 0 }, …, { "level": "N1", "wordCount": 0 } ]
```

### 3. Chi tiết từ — `GET /words/{id}`

```json
{
  "id": 12, "written": "学生", "reading": "がくせい",
  "meaningsVi": ["sinh viên", "học sinh"], "meaningsEn": ["student"],
  "partOfSpeech": ["noun"], "jlptLevel": "N5",
  "note": "Thường chỉ sinh viên đại học; …",
  "examples": [ { "text": "私は学生です。", "reading": "わたしはがくせいです。",
                  "translationVi": "Tôi là sinh viên.", "sourceAuthor": null } ],
  "source": { "key": "ai", "name": "…", "url": "…", "license": "…", "licenseUrl": "…", "attribution": "…" }
}
```
- `source` phải hiện ở trang chi tiết (yêu cầu giấy phép, ví dụ JMdict CC BY-SA). `sourceAuthor` của câu
  ví dụ (Tatoeba) cũng phải hiện khi có.

## Lỗi (ProblemDetail)

| Tình huống | Status | Trường |
|---|---|---|
| `level` không hợp lệ | 400 | `errors.level` |
| `q` dài hơn 100 ký tự | 400 | `errors.q` |
| `id` không tồn tại | 404 | — |
| Không có token | 401 | — |

## Giới hạn hiện tại

- Chưa tìm được bằng romaji (`gakusei`) và chưa quy đổi hiragana ↔ katakana khi tìm.
- Dữ liệu hiện chỉ có từ của N5 Unit 1 (bản nháp). Từ điển đầy đủ cần script import JMdict (R1 mục F).
- Chưa có tra kanji (bảng `jp_kanji` đã có, có thể thêm cùng khuôn sau).
