# Refactor LearnFlow thành app học tiếng Nhật có lộ trình (sơ cấp → trung cấp)

> Trạng thái: **đề xuất, chờ duyệt**. Chưa có code nào được viết theo plan này.
> Bối cảnh: đây là bản refactor hoàn toàn mới. Tài liệu của LearnFlow cũ (app tự học cho 1 người,
> người dùng tự nhập từ) đã bị xoá. Từ nay file này là nguồn yêu cầu và decision log duy nhất.

---

## 1. Mục tiêu

Người học tiếng Nhật từ con số 0 tới khoảng N3 mở app và:

1. Biết ngay **hôm nay học gì** — một nút "Học tiếp", không phải tự chọn.
2. Học **đủ 4 kỹ năng** trong mỗi bài, không chỉ thuộc nghĩa từ.
3. **Thấy mình tiến bộ** — tiến độ tới N5/N4/N3, chuỗi ngày học, "bây giờ bạn có thể…".
4. Không bị dồn ôn tập, không sợ sai khi luyện nói.

## 2. Quyết định đã chốt (decision log)

| # | Vấn đề | Quyết định | Ghi chú |
|---|---|---|---|
| D1 | Đối tượng | Nhóm nhỏ → sau này công khai, có thanh toán để mở giới hạn AI | Bản cũ chỉ phục vụ 1 người dùng và không có gamification. Gamification chỉ ở mức nhẹ: streak, mục tiêu ngày. Không leaderboard. Đăng ký mở, **không dùng mã mời** (bỏ ngày 2026-11-19; tắt đăng ký bằng `app.auth.registration-enabled`). |
| D2 | Nền tảng | Web, **mobile-first** (responsive). PWA cài được trên Android ở phase sau | Không có macOS nên không build iOS native. |
| D3 | Ngôn ngữ ưu tiên | **Tiếng Nhật trước**, lộ trình Kana → N5 → N4 → N3 | Anh/Trung bị ẩn khỏi UI (cờ `language.enabled`) cho tới khi có nội dung, dữ liệu cũ giữ nguyên. |
| D4 | Nguồn nội dung | Dữ liệu mở có giấy phép rõ ràng + AI sinh phần thiếu + **người duyệt** trước khi vào app | Xem §3. Nội dung là dữ liệu cố định trong DB, **không** sinh realtime lúc người dùng học. |
| D5 | Kỹ năng nói | Shadowing + Web Speech API (miễn phí) | Không dùng dịch vụ chấm phát âm trả phí ở phase này. |
| D6 | Hạ tầng | Giữ 1 VPS hiện tại, tối ưu chi phí | Scale khi có người dùng trả phí. |
| D7 | Múi giờ | Mỗi người dùng có `timezone`; "hôm nay", streak, giới hạn từ mới tính theo giờ địa phương | Sửa vấn đề hiện tại: mọi ranh giới ngày đang tính theo UTC (lệch 7h với VN). |
| D8 | Giới hạn AI | Đếm lượt gọi AI theo user/ngày ngay từ bây giờ (`ai_usage`), quota cấu hình được | Chuẩn bị cho thanh toán sau này, đồng thời chặn chi phí AI bị đội lên. |
| D9 | Formatter + tiêu chuẩn cho Claude Code | Backend: Spotless (google-java-format AOSP, `ratchetFrom origin/dev`). Frontend: Prettier (devDependency). Bộ `.claude/` gồm hook chặn cứng, skill `implement-feature`/`pre-pr`, subagent `code-reviewer`/`content-reviewer` | Spotless là maven plugin, không vào runtime. Ratchet tránh một diff format toàn repo. Quy tắc chi tiết: `AGENTS.md` §1.8, `CLAUDE.md`. |
| D10 | ~~Bảng nội dung một bảng `content_item` + JSONB~~ | **Thay bằng D13** | Đã bỏ ngày 2026-11-18. |
| D11 | Vị trí file nội dung | `backend/src/main/resources/content/` thay vì `content/` ở gốc | Docker build context của backend là `backend/`; để ở đây nội dung tự vào jar, không phải sửa Dockerfile/deploy. |
| D12 | Reset database (2026-11-18) | Xoá V1–V15 và mọi module dùng schema cũ (`vocabulary`, `srs`, `study`, `dailyplan`, `dashboard`, `exercise`, `mistake`, `progress`), viết lại từ `V1`, **mỗi bảng một migration** (`V{n}__create_<table>_table.sql`). Ngoại lệ một lần của luật "không sửa migration đã apply" | Schema cũ gắn SRS vào bảng từ tự nhập, lặp `user_id` không ràng buộc, seed dữ liệu trong Flyway. **Prod phải xoá schema cũ trước khi deploy, mất toàn bộ dữ liệu cũ.** Thiết kế: `plan/2026-11-18-database-redesign.md`. `Sm2Algorithm` cũ lấy lại từ git history khi làm R2–R3. |
| D13 | Bảng nội dung | Bảng riêng từng loại: `kana`, `jp_word`, `jp_kanji`, `grammar_point`, `example_sentence`, nghĩa dùng `TEXT[]`; liên kết đa hình theo kiểu exclusive arc (một cột FK cho mỗi loại + `CHECK num_nonnulls(...) = 1`) | Ràng buộc nằm ở DB. Chưa tạo `word_kanji`. |
| D14 | SRS | Thẻ `srs_card` trỏ thẳng tới nội dung global (exclusive arc), không chép sang bảng của user; "Từ của tôi" là bảng `user_word` riêng, cũng có thẻ | Thay §5.2 cũ (`vocabulary.catalog_word_id`). Bảng học/ôn tập tạo ở migration của R2–R4. |
| D15 | ~~Đa ngôn ngữ: chỉ `course` có `language_id`, bảng `jp_*`~~ | **Thay bằng D18** | Bỏ ngày 2026-11-20. |
| D16 | Phiên đăng nhập | Access token JWT 15 phút trong body + refresh token xoay vòng 30 ngày trong cookie HttpOnly (bảng `refresh_token`, lưu SHA-256, thu hồi cả chuỗi khi token bị dùng lại); đăng ký có xác nhận mật khẩu; có đổi mật khẩu | Thay JWT 12 giờ không thu hồi được. Đổi mật khẩu đăng xuất mọi thiết bị (access token cũ còn tối đa 15 phút). |
| D17 | UI kit | Ant Design 6 (`antd`, `@ant-design/icons`) + Tailwind 4. Style antd nằm trong `@layer antd` (`@ant-design/cssinjs` `StyleProvider layer`), xếp dưới Tailwind utilities; layout hàng/cột dùng `Flex` của antd | antd cho form, modal, table có sẵn khả năng truy cập; layer để class Tailwind luôn đè được mặc định của antd. Bundle JS tăng (> 500 kB), cần tách chunk sau. |
| D18 | Nội dung đa ngôn ngữ (2026-11-20) | **Lõi chung + phần mở rộng theo ngôn ngữ.** Bảng chung có `language_id`: `word`, `han_character` (kanji/hán tự) + `han_character_reading` (on/kun/pinyin), `grammar_point`, `example_sentence`. Cấp độ là dữ liệu: `proficiency_level` (JLPT/HSK/CEFR) thay enum `JlptLevel`/`CourseLevel`. Chỉ thứ thật sự riêng một ngôn ngữ mới đặt tên riêng (`kana`). Luật kiểm tra theo ngôn ngữ nằm trong `LanguageRules` (hiện chỉ `ja`). Ngôn ngữ của mục nội dung lấy từ tiền tố key (`ja.`). | Thay D15. Làm bằng migration V25+ (V1–V24 đã merge, không sửa). API: `lang` bắt buộc, trường `level` thay `jlptLevel`. Plan: `plan/2026-11-20-multilingual-content.md`. |

## 3. Nguồn nội dung tiếng Nhật

| Nguồn | Dùng cho | Giấy phép | Hệ quả |
|---|---|---|---|
| [JMdict](https://www.edrdg.org/edrdg/license.html) (EDRDG), bản JSON [jmdict-simplified](https://github.com/scriptin/jmdict-simplified) | Cách đọc, từ loại, nghĩa tiếng Anh (làm gốc để dịch sang tiếng Việt) | CC BY-SA 4.0, **cho phép thương mại** | Phải ghi nguồn. Dữ liệu từ vựng phái sinh phải giữ cùng giấy phép SA. Không dùng số liệu tần suất của Halpern (có điều khoản riêng). |
| KANJIDIC2 (EDRDG) | Kanji: âm On/Kun, nghĩa, số nét | CC BY-SA 4.0 | Như trên. |
| Danh sách JLPT của Jonathan Waller (tanos.co.uk), ví dụ bản chuyển sang JSON [JLPT_Vocabulary](https://github.com/Bluskyo/JLPT_Vocabulary) | Gắn cấp N5–N1 cho từ và kanji | Các bản sao bên thứ ba ghi CC BY; trang gốc nay [không còn hoạt động ổn định](https://git.pvv.ntnu.no/oysteikt/tanos-japanese-word-books) | **Phải xác minh giấy phép trước khi dùng.** JLPT không có danh sách chính thức từ 2010, đây chỉ là danh sách ước lượng. |
| [Tatoeba](https://tatoeba.org/en/downloads) | Câu ví dụ Nhật–Anh (phần lớn từ Tanaka Corpus) | CC BY 2.0 FR (một phần CC0). Audio có giấy phép riêng theo từng người thu | Ghi nguồn và link. Không dùng audio Tatoeba ở phase đầu. |
| AnimCJK (đã có trong repo) | Thứ tự nét Kana/Kanji | LGPL / Arphic (đã ghi nguồn ở `WordStrokeOrder.tsx`) | Giữ nguyên. |
| AI (Claude) | Nghĩa tiếng Việt, gom từ thành bài theo chủ đề, giải thích ngữ pháp bằng tiếng Việt, hội thoại và bài đọc ngắn theo cấp | — | Mọi nội dung AI sinh đều ở trạng thái `draft` cho tới khi được duyệt. |

→ App cần một trang **"Nguồn dữ liệu & giấy phép"** công khai.

### 3.1. Quy trình nội dung (content pipeline)

```
nguồn mở (JMdict, KANJIDIC2, JLPT list, Tatoeba)
        │  scripts/content/import-*.ts   (chạy tay, ngoài app)
        ▼
scripts/content/raw/…  (JSON trung gian, không commit file nguồn lớn)
        │  scripts/content/enrich-ai.ts  (AI: nghĩa tiếng Việt, ví dụ, chia bài)
        ▼
backend/src/main/resources/content/ja/n5/unit-01.yaml …   status: draft (D11)
        │  người duyệt sửa → status: reviewed   (duyệt qua diff của PR)
        ▼
ContentImporter (backend, chạy khi khởi động) upsert theo content_key
        ▼
bảng nội dung global trong Postgres
```

- **Nguồn sự thật là file YAML trong repo.** Duyệt nội dung chính là review PR, khớp với quy trình git hiện có, không cần viết trang admin.
- `ContentImporter` idempotent: upsert theo `content_key` ổn định (vd `ja.word.taberu`), chỉ import mục `reviewed` (profile `local` có cờ để import cả `draft`).
- Nội dung **không** đi qua Flyway. Flyway chỉ quản lý schema.
- Script AI chạy theo lô, ghi lại model và prompt đã dùng để làm lại được.

### 3.2. Khối lượng ước tính

| Cấp | Từ vựng | Kanji | Điểm ngữ pháp |
|---|---|---|---|
| Kana | 46 Hiragana + 46 Katakana + biến âm, âm ghép | — | — |
| N5 | ~700–800 | ~100 | ~80 |
| N4 | +~600 | +~170 | +~90 |
| N3 | +~1.800 | +~370 | +~100 |

Số liệu chỉ để ước lượng công sức, sẽ chốt lại khi đã có danh sách nguồn.

## 4. Tính năng cốt lõi

### 4.1. Khởi đầu
- **Onboarding:** mục tiêu (thi JLPT / giao tiếp / du lịch), thời gian học mỗi ngày (5/10/15/20 phút), múi giờ lấy từ trình duyệt.
- **Xếp lớp nhanh:** "Tôi chưa biết gì" (vào Kana) / "Tôi đã đọc được Kana" (bài kiểm tra ngắn) / "Tôi đã học N5" (bài kiểm tra ngắn).

### 4.2. Nền tảng Kana
- Bảng Hiragana/Katakana, mỗi chữ có âm thanh và thứ tự nét.
- Bài học theo hàng (あ, か, さ…), luyện nhận diện (nhìn → chọn âm, nghe → chọn chữ), luyện viết theo nét.
- Kana cũng đi vào SRS như từ vựng.

### 4.3. Lộ trình bài học
- Khoá học (N5, N4, N3) → Unit theo chủ đề (Chào hỏi, Gia đình, Ăn uống…) → Bài học.
- **Mỗi bài** (~10 phút): 6–10 từ mới, 1 điểm ngữ pháp, 1 hội thoại ngắn hoặc đoạn đọc, bài tập đủ 4 kỹ năng.
- Mở khoá tuần tự, cho phép bỏ qua bằng bài kiểm tra.

### 4.4. Phiên "Hôm nay"
Thay cho Daily Plan nhập số phút. Engine xác định (giữ tinh thần `PlanningEngine`) dựng một hàng đợi theo thời lượng mục tiêu: ôn đến hạn (có giới hạn) → bước tiếp theo của lộ trình → 1 bài luyện kỹ năng yếu nhất. Một nút bắt đầu, có thể dừng giữa chừng và học tiếp.

### 4.5. Ôn tập (SRS)
- Thuật toán SM-2 viết lại trên `srs_card`/`review_log` (D12, D14); bản cũ lấy từ git history.
- **Một thẻ, nhiều kiểu hỏi:** engine chọn kiểu theo độ thuộc — nghe → chọn nghĩa; nhìn kanji → chọn cách đọc; nghĩa → gõ kana. Từ mới bắt đầu bằng kiểu dễ.
- Giới hạn từ mới mỗi ngày giữ nguyên, nhưng gắn với tiến độ lộ trình thay vì kho từ tự nhập.

### 4.6. Bốn kỹ năng

| Kỹ năng | Phase đầu |
|---|---|
| Nghe | TTS `ja-JP` cho mọi từ/câu (đã có `lib/speech.ts`), chỉnh tốc độ; nghe rồi chọn; chép chính tả kana |
| Nói | Shadowing: nghe → thu âm → so sánh. Nhận dạng giọng nói qua Web Speech API (`ja-JP`), so khớp với câu mẫu, chấm mềm. Trình duyệt không hỗ trợ (Firefox) → tự đánh giá |
| Đọc | Hội thoại và đoạn đọc theo cấp, `<ruby>` furigana bật/tắt, chạm vào từ để xem nghĩa và thêm vào ôn tập |
| Viết | Ghép câu, điền trợ từ, gõ kana; luyện viết kanji theo nét; viết câu tự do để AI sửa (đã có) |

> Lưu ý: nhận dạng giọng nói trên Chrome gửi âm thanh lên máy chủ Google. Cần nêu rõ trong trang quyền riêng tư.

### 4.7. Ngữ pháp
Mỗi điểm ngữ pháp có: cấu trúc, giải thích tiếng Việt, 3–5 ví dụ có furigana, bài tập. Có nút "Hỏi AI" khi chưa hiểu, AI nhận ngữ cảnh của bài đang học.

### 4.8. Sổ lỗi tự động
Câu trả lời sai ở bài tập và lỗi AI tìm thấy khi hội thoại tự ghi vào sổ lỗi, gắn với từ/điểm ngữ pháp, rồi quay lại trong phiên ôn. Người dùng không phải tự nhập.

### 4.9. Động lực và tiến độ
- Streak có 1 ngày nghỉ bù mỗi tuần, mục tiêu phút mỗi ngày.
- Màn hình tiến độ: % hoàn thành N5/N4/N3, số từ/kanji đã thuộc, biểu đồ 4 kỹ năng, các câu "can-do" của unit đã học xong.
- Nhắc học: email trước, Web Push khi có PWA.

### 4.10. Gia sư AI
Giữ `AIProvider` và 3 provider hiện có. AI được dùng để: giải thích, tạo thêm ví dụ, nhập vai theo chủ đề unit, sửa câu viết. AI **không** quyết định lộ trình hay lịch ôn (giữ luật ArchUnit hiện có). Mọi lượt gọi bị đếm vào `ai_usage`.

## 5. Thay đổi kiến trúc backend

### 5.1. Module

| Module | Trách nhiệm |
|---|---|
| `curriculum` | Bảng nội dung global, `ContentImporter`, API đọc lộ trình (đã có từ R1) |
| `learning` | Tiến độ: `lesson_progress`, mở khoá bài, phiên "Hôm nay" |
| `srs` | `srs_card`, `review_log`, thuật toán SM-2 (viết lại, D12) |
| `practice` | Sinh và chấm bài tập 4 kỹ năng, ghi `activity_log` |
| `account` (mở rộng `auth`) | Hồ sơ: timezone, mục tiêu, phút/ngày, quota AI |

Đang có: `common`, `auth`, `language`, `curriculum`, `ai`, `health`. Các module cũ đã bị gỡ (D12).

### 5.2–5.3. Schema
Xem `plan/2026-11-18-database-redesign.md` (D12–D15).

### 5.4. Sửa kèm theo (từ phân tích backend trước đó)
- Không giữ transaction DB mở khi chờ AI: tách phần gọi AI ra khỏi `@Transactional` (pool prod chỉ có 3 kết nối).
- Bỏ map `IllegalStateException` → 403; dùng exception riêng cho "đăng ký bị tắt".
- Bắt buộc `JWT_SECRET` ở prod (không còn giá trị mặc định).
- Rate limit đăng nhập đọc IP thật sau Caddy (`X-Forwarded-For` từ proxy tin cậy).
- Thêm ArchUnit cho luật ranh giới số 2 (Service không inject Repository của module khác).

## 6. Thay đổi frontend

- **Mobile-first**, điều hướng dưới cùng 4 mục: Hôm nay · Lộ trình · Ôn tập · Tôi. "Từ của tôi", Sổ lỗi, Gia sư AI nằm trong "Tôi" hoặc mở từ bài học.
- Màn học chạy toàn màn hình, một câu hỏi mỗi lần, phản hồi đúng/sai ngay.
- Component mới: `RubyText` (furigana), `KanaGrid`, `ShadowingRecorder`, `ListeningChoice`, `TypingAnswer` (kana IME), `LessonPlayer`.
- `lib/speechRecognition.ts` theo phong cách hàm thuần như `lib/speech.ts`.

## 7. Lộ trình triển khai

Mỗi phase: chạy được, qua cổng kiểm tra `mvnw verify` + `lint/build/test`, PR vào `dev`.

| Phase | Mục tiêu | Nội dung chính | Xong khi |
|---|---|---|---|
| **R0** Dọn nền | Sửa nợ kỹ thuật trước khi mở rộng | Các mục §5.4, `user_profile` + timezone, `language.enabled`, `ai_usage` | Ranh giới ngày theo giờ VN; AI vượt quota trả 429 |
| **R1** Pipeline nội dung | Có dữ liệu Kana + N5 đã duyệt trong DB | Schema `curriculum`, `ContentImporter`, script import JMdict/KANJIDIC2/JLPT list/Tatoeba, script AI làm giàu, trang "Nguồn & giấy phép" | Unit 1–3 N5 ở trạng thái `reviewed` và import được |
| **R2** Kana | Người mới học xong Kana | Module Kana: bảng chữ, bài theo hàng, nhận diện, viết theo nét, SRS cho Kana | Người dùng thử đọc được toàn bộ Hiragana |
| **R3** Lộ trình N5 | Học được bài theo lộ trình | `lesson_progress`, `LessonPlayer`, nối từ global → SRS, ôn nhiều kiểu hỏi | Học trọn Unit 1 N5 từ đầu tới cuối |
| **R4** Hôm nay + tiến độ | Một nút học mỗi ngày | Engine phiên "Hôm nay", streak + ngày nghỉ bù, màn tiến độ mới, onboarding + xếp lớp | Người mới đăng ký → onboarding → học → thấy streak |
| **R5** Nghe/Nói/Đọc | Đủ 4 kỹ năng | Shadowing + Web Speech, chép chính tả, `passage` với furigana và tra từ | Mỗi bài N5 có bài tập cho cả 4 kỹ năng |
| **R6** Ngữ pháp + sổ lỗi tự động + AI theo ngữ cảnh | Vòng học khép kín | Trang ngữ pháp, lỗi tự ghi từ bài tập, AI nhận ngữ cảnh bài | Câu sai hôm nay xuất hiện lại trong phiên ôn sau |
| **R7** Hoàn thiện N5 → N4 | Đủ nội dung | Duyệt toàn bộ N5, bắt đầu N4, PWA cho Android, nhắc học qua email | Hoàn thành N5 |

Sau R7: N3, thanh toán mở quota AI, rồi tới tiếng Anh/Trung theo cùng khung.

## 8. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Khối lượng duyệt nội dung lớn (hàng nghìn mục) | Duyệt theo unit, ưu tiên N5; AI làm sẵn bản nháp; chỉ cần duyệt nghĩa tiếng Việt và ví dụ |
| Nghĩa tiếng Việt do AI dịch sai sắc thái | Bắt buộc duyệt người; lưu nghĩa tiếng Anh gốc để đối chiếu |
| Giấy phép danh sách JLPT chưa chắc chắn | Xác minh ở R1; nếu không rõ, tự gán cấp bằng AI + đối chiếu nhiều nguồn |
| Giọng TTS `ja-JP` khác nhau giữa các máy | Chấp nhận ở phase đầu; về sau tạo sẵn file audio (TTS trả phí, chạy một lần) |
| Web Speech recognition không có trên Firefox, chất lượng không đều | Luôn có phương án tự đánh giá |
| Refactor lớn làm hỏng tính năng đang chạy | Làm theo phase, mỗi phase một PR; giữ API cũ cho tới khi frontend chuyển xong |

## 9. Câu hỏi còn mở

1. Ai duyệt nội dung, và mỗi tuần duyệt được khoảng bao nhiêu? Con số này quyết định tốc độ của R1 và R7.
2. Dữ liệu tiếng Anh/Trung hiện có của người dùng: chỉ ẩn UI, hay chuyển hết thành "Từ của tôi"?
3. Có cần giữ đăng nhập email/mật khẩu, hay thêm đăng nhập Google khi công khai?
4. Script nội dung viết bằng TypeScript (Node đã có trong `mise`) — có đồng ý không thêm Python vào repo?
