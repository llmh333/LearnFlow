# Frontend: chuyển theo API đa ngôn ngữ (D18)

> Dành cho người/agent làm frontend. Backend đã xong trên branch `phase/r1-multilingual` (chưa commit lúc viết).
> Bối cảnh: `plan/2026-11-20-multilingual-content.md`, quyết định D18 trong
> `plan/2026-11-17-japanese-learning-path-refactor.md`. Hợp đồng API chi tiết: `plan/spec-dictionary.md`.
> Quy ước frontend: `.claude/rules/frontend.md` (react-query, `<domain>Keys`, Ant Design + Tailwind, Prettier).

## Mục tiêu

Frontend không còn giả định "tiếng Nhật / JLPT". Ngôn ngữ đang học và danh sách cấp độ lấy từ API, không viết
cứng. Thêm tiếng Trung/Anh sau này không phải sửa code frontend của từ điển.

## Hợp đồng API đã đổi (breaking)

| Endpoint | Trước | Sau |
|---|---|---|
| `GET /api/v1/dictionary/words` | `?q=&level=&page=&size=` | **`?lang=ja`** bắt buộc + `q`, `level`, `page`, `size` |
| `GET /api/v1/dictionary/levels` | không tham số | **`?lang=ja`** bắt buộc |
| `GET /api/v1/dictionary/words/{id}` | — | không đổi đường dẫn |
| Trường cấp độ trong từ (`WordSummary`, `WordDetail`) | `jlptLevel: "N5" \| null` | **`level: string \| null`** |
| `LevelCount` (`/levels`) | `{ level, wordCount }` | **`{ level: string \| null, name: string \| null, wordCount }`** |
| `Course.level` (`/curriculum/courses`) | `"KANA" \| "N5" …` | **`string \| null`** (khoá Kana = `null`) |
| Lỗi | — | thiếu/sai `lang` → 400 `errors.lang`; `level` không thuộc ngôn ngữ → 400 `errors.level` |

Ví dụ `/dictionary/levels?lang=ja`:
```json
[ { "level": "N5", "name": "JLPT N5", "wordCount": 718 }, { "level": "N4", "name": "JLPT N4", "wordCount": 667 },
  { "level": "N3", "name": "JLPT N3", "wordCount": 0 }, …, { "level": "N1", "name": "JLPT N1", "wordCount": 0 } ]
```
Cấp trả về đúng thứ tự dễ → khó. Có thể có thêm một dòng `level: null` ở cuối (từ chưa xếp cấp).

Ngôn ngữ backend hỗ trợ: `GET /api/v1/languages` (chỉ trả ngôn ngữ `enabled`; hiện chỉ có `ja`).

## Việc cần làm

Theo thứ tự quy ước: types → api → hooks → component/page → test.

### 1. `src/types/domain.ts`
- [ ] Xoá `export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'`.
- [ ] `WordSummary.jlptLevel` và `WordDetail.jlptLevel` → `level: string | null`.
- [ ] `LevelCount` → `{ level: string | null; name: string | null; wordCount: number }`.
- [ ] `Course.level` → `string | null`; xoá hoặc thu gọn `CourseLevel` (không liệt kê cứng các cấp).
- [ ] Sửa comment đường dẫn cho khớp (`?lang=`).

### 2. `src/api/dictionary.ts`
- [ ] `SearchWordsParams` thêm `lang: string` (bắt buộc); `fetchWords` luôn gửi `lang`.
- [ ] `fetchLevelCounts(lang: string)` gọi `/dictionary/levels?lang=${encodeURIComponent(lang)}`.
- [ ] Dùng `URLSearchParams` như hiện có, không tự nối chuỗi query.

### 3. `src/hooks/useDictionary.ts`
- [ ] `dictionaryKeys.levels(lang)` → `[...all, 'levels', lang]` (key phải có `lang` để đổi ngôn ngữ không dùng
      cache của ngôn ngữ khác). `words(params)` đã chứa `lang` qua `params`.
- [ ] `useLevelCounts(lang)`, `useWords({ lang, ... })`; `enabled: Boolean(lang)`.

### 4. Ngôn ngữ đang học
- [ ] Từ điển lấy ngôn ngữ từ `useUiStore().selectedLanguageCode`, nhưng **chỉ gọi API khi mã đó có trong
      `useLanguages()`** (danh sách từ `/languages`). Lưu ý: giá trị mặc định trong `uiStore` hiện là `'en'`,
      backend chưa có từ điển tiếng Anh → nếu gọi sẽ nhận 400.
- [ ] Ngôn ngữ chưa hỗ trợ: hiện trạng thái trống (`Empty` của antd) kiểu "Từ điển cho ngôn ngữ này sắp có",
      không gọi `/dictionary/*`.
- [ ] Không đổi mặc định của `uiStore` nếu việc đó ảnh hưởng onboarding; chỉ chặn ở trang từ điển.

### 5. `src/pages/VocabularyPage.tsx`
- [ ] Bỏ danh sách cấp viết cứng `(['N5','N4','N3','N2','N1'] as const)`; dựng bộ lọc/tab từ `useLevelCounts(lang)`
      theo đúng thứ tự trả về. Nhãn hiển thị dùng `name` (ví dụ "JLPT N5"), giá trị gửi đi dùng `level`.
      Dòng `level: null` (nếu có) không làm tab lọc.
- [ ] Mọi chỗ `jlptLevel` (cột bảng `dataIndex`/`key`, thẻ trong danh sách, hộp thoại chi tiết) → `level`.
- [ ] `LEVEL_COLORS`: không giả định chỉ có JLPT. Tô màu theo **vị trí** của cấp trong danh sách `/levels`
      (dễ → khó) thay vì theo chuỗi "N5"…; cấp lạ hoặc `null` → màu mặc định.
- [ ] Khi đổi ngôn ngữ: reset cấp đang chọn về "Tất cả", về trang 1.
- [ ] Bắt lỗi 400 `errors.lang`/`errors.level` (hiện thông báo gọn, không vỡ trang).

### 6. Mock (`src/mock/`)
- [ ] `data/dictionary.ts`: `jlptLevel` → `level`; `MOCK_LEVEL_COUNTS` thêm `name`.
- [ ] `handlers.ts`: route `/dictionary/levels` và `/dictionary/words` đọc `lang` từ query; thiếu `lang` → trả
      lỗi 400 dạng ProblemDetail có `errors.lang` (giống backend); lọc theo `w.level`.
- [ ] `data/curriculum.ts`: `Course.level` theo kiểu mới (khoá Kana `null`).

### 7. Chỗ khác có thể dính
- [ ] `src/lib/courses.ts`, `CourseSwitcher`, `OnboardingPage`, `AppLayout`: kiểm tra có đọc `Course.level` hoặc
      giả định "KANA"/"N5" không. Phần mô tả khoá học/cấp độ để hiển thị (ví dụ "JLPT N5", "HSK 2") là dữ liệu UI
      tĩnh thì giữ được, nhưng không dùng nó làm giá trị gửi lên API.
- [ ] Tìm toàn bộ: `grep -rn "jlptLevel\|JlptLevel\|'N5'" src` phải không còn kết quả ngoài dữ liệu hiển thị tĩnh.

### 8. Test
- [ ] `VocabularyPage.test.tsx`: mock trả `level`/`name`; kiểm tab cấp dựng từ API (đúng thứ tự, đúng nhãn),
      lọc gửi đúng `lang` + `level`, ngôn ngữ chưa hỗ trợ hiện trạng thái trống và **không** gọi API.
- [ ] `mock/mock.test.ts`: cập nhật theo trường mới; thêm ca thiếu `lang` → 400.
- [ ] Test mô tả hành vi người dùng thấy (`getByRole`, `getByText`), không kiểm chi tiết cài đặt.

## Không làm

- Không thêm giao diện cho tiếng Trung/Anh (backend chưa có nội dung).
- Không thêm dependency mới.
- Không đổi luồng auth, AI tutor, quên mật khẩu.

## Xong khi

- [ ] `cd frontend && npm run format:check && npm run lint && npm run build && npm run test` xanh.
- [ ] Chạy thật với backend: `/vocabulary` với `ja` hiện đủ N5 (718 từ) và N4 (667 từ), lọc cấp đúng, mở chi
      tiết từ có `level`; đổi sang ngôn ngữ chưa hỗ trợ thấy trạng thái trống, không có request 400 trong
      Network.
- [ ] Commit: `feat(frontend): follow multilingual dictionary API (lang, level)`; chỉ add file trong `frontend/`.
