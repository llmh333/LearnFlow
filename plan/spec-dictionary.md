# Đặc tả: Từ điển và phân loại từ theo trình độ

> **Cập nhật D18 (2026-11-20):** API theo ngôn ngữ — `lang` bắt buộc; trường `level` thay `jlptLevel`;
> `/levels` trả cả `name`. Frontend cần sửa theo.

> Backend đã triển khai: `curriculum/DictionaryService`, `curriculum/api/v1/DictionaryController`.
> Dữ liệu lấy từ bảng `jp_word` (nội dung global đã import). Không cần migration mới.

## API (`/api/v1/dictionary`, cần đăng nhập — Bearer JWT)

### 1. Tìm / duyệt từ — `GET /words?lang=ja&q=&level=&page=0&size=20`

`lang` bắt buộc (hiện có `ja`); thiếu hoặc sai → 400 `errors.lang`. Còn lại tuỳ chọn; không có `q` và
`level` → duyệt toàn bộ từ điển của ngôn ngữ đó.

| Tham số | Ý nghĩa |
|---|---|
| `q` | Chuỗi tìm (≤ 100 ký tự). Khớp: **đầu** cách đọc kana (`がく` → `がくせい`), **một phần** chữ viết (`学` → `学生`), **một phần** nghĩa tiếng Việt hoặc tiếng Anh (`sinh viên`, `student`, không phân biệt hoa thường). |
| `level` | Mã cấp của ngôn ngữ, lấy từ `/levels` (`ja`: `N5`…`N1`), không phân biệt hoa thường. |
| `page`, `size` | Phân trang, `size` tối đa 50 (lớn hơn sẽ bị kẹp về 50). |

Sắp xếp: khớp chính xác cách đọc/chữ viết lên đầu → cấp dễ trước (từ chưa có cấp ở cuối) → theo cách đọc.

Trả về `PageResponse<WordSummary>`:
```json
{
  "content": [
    { "id": 12, "written": "学生", "reading": "がくせい",
      "meaningsVi": ["sinh viên", "học sinh"], "partOfSpeech": ["noun"], "level": "N5" }
  ],
  "page": 0, "size": 20, "totalElements": 1, "totalPages": 1
}
```
`written` = `null` khi từ không có dạng viết riêng (ví dụ chỉ viết bằng kana); `level` = `null` khi chưa xếp cấp.

### 2. Số từ theo cấp — `GET /levels?lang=ja`

Dùng cho tab/bộ lọc cấp độ. Luôn đủ mọi cấp của ngôn ngữ, cấp dễ trước (kể cả cấp chưa có từ), thêm một dòng
`level: null` ở cuối nếu có từ chưa xếp cấp. **Frontend lấy danh sách cấp từ đây, không viết cứng.**
```json
[ { "level": "N5", "name": "JLPT N5", "wordCount": 718 }, …, { "level": "N1", "name": "JLPT N1", "wordCount": 0 } ]
```

### 3. Chi tiết từ — `GET /words/{id}`

```json
{
  "id": 12, "written": "学生", "reading": "がくせい",
  "meaningsVi": ["sinh viên", "học sinh"], "meaningsEn": ["student"],
  "partOfSpeech": ["noun"], "level": "N5",
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
| `lang` thiếu hoặc không hỗ trợ | 400 | `errors.lang` |
| `level` không hợp lệ với ngôn ngữ | 400 | `errors.level` |
| `q` dài hơn 100 ký tự | 400 | `errors.q` |
| `id` không tồn tại | 404 | — |
| Không có token | 401 | — |

## Giới hạn hiện tại

- Chưa tìm được bằng romaji (`gakusei`) và chưa quy đổi hiragana ↔ katakana khi tìm.
- Dữ liệu hiện chỉ có từ của N5 Unit 1 (bản nháp). Từ điển đầy đủ cần script import JMdict (R1 mục F).
- Chưa có tra chữ Hán (bảng `han_character` đã có, có thể thêm cùng khuôn sau).
