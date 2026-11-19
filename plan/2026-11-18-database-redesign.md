# Thiết kế lại database

> Trạng thái: **đã chốt** (D12–D15 trong decision log). Nhóm A (chỉ `app_user`), B, D đã có trong
> `V1`–`V16` (mỗi bảng một file `V{n}__create_<table>_table.sql`); các bảng còn lại tạo bằng migration riêng ở phase ghi trong cột **Phase**.
> Quyết định đã chốt (2026-11-18):
> - Xoá V1–V15, viết lại schema từ V1 (prod phải xoá schema cũ trước khi deploy).
> - Chỉ tạo bảng mà code đang dùng; mỗi bảng một migration. Nghĩa từ dùng `TEXT[]`. Chưa tạo `word_kanji`. Gỡ hẳn module cũ.
> - Nội dung học: **bảng riêng cho từng loại**, cột có kiểu và có CHECK (bỏ D10 `content_item` + JSONB).
> - SRS: **thẻ trỏ thẳng tới nội dung global**, không chép sang bảng của user. Vẫn giữ "Từ của tôi" (`user_word`).
> - Đa ngôn ngữ: **chỉ `course` có `language_id`**. Bảng nội dung đặt tên theo tiếng Nhật (`jp_*`).

## Nguyên tắc chung

1. **Ràng buộc ở DB, không chỉ ở Java.** Enum dùng `CHECK (... IN (...))`, số có miền giá trị thì có CHECK,
   và mọi cột bắt buộc đều `NOT NULL`.
2. **Liên kết đa hình theo kiểu "exclusive arc".** Mỗi loại đích có một cột FK riêng, kèm
   `CHECK (num_nonnulls(...) = 1)`. Không dùng cặp `(item_type, item_id)` vì kiểu đó không có khoá ngoại.
3. **Không lặp dữ liệu suy ra được.** Không lưu bộ đếm (`review_count`, `words_reviewed`…), mà tính từ bảng
   log. Chỗ nào cần lặp `user_id` để có index nhanh thì dùng **FK kép** `(id, user_id)`, để DB đảm bảo hai
   giá trị khớp nhau.
4. **Thời gian do app ghi qua `Clock`.** Cột thời gian là `TIMESTAMPTZ NOT NULL` và không có `DEFAULT now()`.
   Ngày theo giờ địa phương của user (D7) lưu ở cột `DATE` riêng (`local_date`).
5. **Flyway chỉ quản lý schema.** Không seed user giả, không seed từ vựng. Nội dung đi qua `ContentImporter`.
6. Bảng nội dung global có `content_key UNIQUE`, `status` (`DRAFT`/`REVIEWED`) và `source_id`.
7. Thứ tự (`position`) có `UNIQUE (cha, position) DEFERRABLE INITIALLY DEFERRED`, để import đổi thứ tự trong
   một transaction mà không va ràng buộc.

## Danh sách bảng

Cột **Phase** cho biết phase nào cần bảng đó. Mỗi bảng một migration, tạo ở
đúng phase cần nó.

### A. Tài khoản

| Bảng | Mục đích | Cột chính | Ràng buộc đáng chú ý | Phase |
|---|---|---|---|---|
| `app_user` | Đăng nhập | `id`, `email`, `password_hash`, `display_name`, `created_at` (+ `role` sau này) | `UNIQUE (email)` + `CHECK (email = lower(email))`, app chuẩn hoá email về chữ thường | V1 |
| `user_profile` | Hồ sơ học (1–1 với user) | `user_id` PK/FK, `timezone`, `goal`, `daily_minutes`, `daily_new_items`, `onboarded_at`, `updated_at` | `goal IN ('JLPT','CONVERSATION','TRAVEL')`; `daily_minutes IN (5,10,15,20)`; `daily_new_items BETWEEN 0 AND 50` | V17 (R0) |
| `ai_usage` | Đếm lượt gọi AI theo ngày (D8) | `user_id`, `local_date`, `feature`, `call_count` | PK `(user_id, local_date, feature)`; `call_count >= 0` | V18 (R0) |
| `refresh_token` | Refresh token xoay vòng (D16) | `id`, `user_id`, `token_hash`, `family_id`, `created_at`, `expires_at`, `revoked_at` | `UNIQUE (token_hash)`, `length(token_hash) = 64`; `expires_at > created_at`; xoá theo user | V19 (R0) |

### B. Nội dung global (không có `user_id`)

| Bảng | Mục đích | Cột chính | Ràng buộc đáng chú ý | Phase |
|---|---|---|---|---|
| `language` | Ngôn ngữ | `id` SMALLSERIAL, `code`, `name`, `enabled` | `UNIQUE (code)` | R0 |
| `content_source` | Nguồn và giấy phép | `id`, `content_key`, `name`, `url`, `license`, `license_url`, `attribution` | `UNIQUE (content_key)` | R1 |
| `course` | Khoá học (Kana, N5…) | `id`, `content_key`, `language_id`, `level`, `title`, `description`, `position`, `status` | `level IN ('KANA','N5','N4','N3')`; `UNIQUE (language_id, position)` | R1 |
| `unit` | Chủ đề trong khoá | `id`, `content_key`, `course_id`, `position`, `title`, `description`, `status` | `UNIQUE (course_id, position)` | R1 |
| `lesson` | Bài học ~10 phút | `id`, `content_key`, `unit_id`, `position`, `title`, `status` | `UNIQUE (unit_id, position)` | R1 |
| `kana` | Chữ Hiragana/Katakana | `id`, `content_key`, `character`, `script`, `romaji`, `kana_group`, `row_label`, `position`, `status`, `source_id` | `UNIQUE (character)`; `script IN ('HIRAGANA','KATAKANA')`; `kana_group IN ('BASIC','DAKUTEN','HANDAKUTEN','YOON')` | R1 |
| `jp_word` | Từ vựng | `id`, `content_key`, `written` (null nếu chỉ có kana), `reading`, `meanings_vi` TEXT[], `meanings_en` TEXT[], `part_of_speech` TEXT[], `jlpt_level`, `note`, `status`, `source_id`, `source_ref` | `cardinality(meanings_vi) > 0`; `jlpt_level IN ('N5','N4','N3','N2','N1')` | R1 |
| `jp_kanji` | Kanji | `id`, `content_key`, `character`, `meanings_vi` TEXT[], `meanings_en` TEXT[], `onyomi` TEXT[], `kunyomi` TEXT[], `stroke_count`, `jlpt_level`, `status`, `source_id` | `UNIQUE (character)`; `char_length(character) = 1`; `stroke_count > 0` | R1 |
| `grammar_point` | Điểm ngữ pháp | `id`, `content_key`, `pattern`, `meaning_vi`, `explanation_vi`, `jlpt_level`, `status`, `source_id` | | R1 |
| `example_sentence` | Câu ví dụ | `id`, `content_key`, `text`, `reading`, `translation_vi`, `translation_en`, `status`, `source_id`, `source_ref`, `source_author` | `source_author` dùng để ghi công Tatoeba (CC BY) | R1 |
| `word_example` | Câu ví dụ của từ | `word_id`, `sentence_id`, `position` | PK `(word_id, position)` | R1 |
| `grammar_example` | 3–5 ví dụ của ngữ pháp (§4.7) | `grammar_point_id`, `sentence_id`, `position` | PK `(grammar_point_id, position)` | R1 |
| `lesson_item` | Nội dung của một bài | `lesson_id`, `position`, `kana_id`, `word_id`, `kanji_id`, `grammar_point_id`, `sentence_id` | PK `(lesson_id, position)`; `num_nonnulls(kana_id, word_id, kanji_id, grammar_point_id, sentence_id) = 1` | R1 |
| `passage` | Hội thoại / bài đọc | thiết kế ở R5 | | R5 |

### C. Học và ôn tập (theo user)

| Bảng | Mục đích | Cột chính | Ràng buộc đáng chú ý | Phase |
|---|---|---|---|---|
| `user_word` | "Từ của tôi", tự nhập | `id`, `user_id`, `written`, `reading`, `meaning_vi`, `note`, `created_at`, `updated_at` | `UNIQUE (id, user_id)` (để FK kép) | R3 |
| `srs_card` | Một thẻ ôn của user | `id`, `user_id`, `kana_id`, `word_id`, `kanji_id`, `grammar_point_id`, `user_word_id`, `state`, `due_at`, `interval_days`, `ease_factor`, `created_at` | `num_nonnulls(...) = 1`; unique một phần theo từng loại, ví dụ `UNIQUE (user_id, word_id) WHERE word_id IS NOT NULL`; `state IN ('NEW','LEARNING','REVIEW','RELEARNING')`; `ease_factor >= 1.3`; `UNIQUE (id, user_id)`; FK kép `(user_word_id, user_id) → user_word`; index `(user_id, due_at)` | R2–R3 |
| `review_log` | Mỗi lần ôn một thẻ | `id`, `card_id`, `user_id`, `reviewed_at`, `local_date`, `question_type`, `rating`, `prev_interval_days`, `new_interval_days`, `response_ms` | FK kép `(card_id, user_id) → srs_card`; `rating IN ('AGAIN','HARD','GOOD','EASY')`; `question_type IN (...)` (§4.5); index `(user_id, local_date)` | R2–R3 |
| `lesson_progress` | Tiến độ từng bài | `user_id`, `lesson_id`, `status`, `started_at`, `completed_at`, `score` | PK `(user_id, lesson_id)`; `status IN ('STARTED','COMPLETED','TESTED_OUT')`; `completed_at` bắt buộc khi status khác `STARTED`; `score BETWEEN 0 AND 100` | R3 |
| `activity_log` | Mọi hoạt động học, dùng cho streak và biểu đồ kỹ năng | `id`, `user_id`, `occurred_at`, `local_date`, `skill`, `activity_type`, `lesson_id`, `duration_seconds`, `correct` | `skill IN ('LISTENING','SPEAKING','READING','WRITING','VOCABULARY','GRAMMAR')`; index `(user_id, local_date)` | R3–R4 |
| `streak_freeze` | Ngày nghỉ bù đã dùng (§4.9) | `user_id`, `local_date` | PK `(user_id, local_date)`. Quy tắc "1 lần/tuần" kiểm ở Service | R4 |
| `daily_session` | Phiên "Hôm nay" (§4.4) | `id`, `user_id`, `local_date`, `created_at` | `UNIQUE (user_id, local_date)` | R4 |
| `daily_session_step` | Các bước trong phiên, cho phép dừng rồi học tiếp | `session_id`, `position`, `kind`, `lesson_id`, `card_count`, `completed_at` | PK `(session_id, position)`; `kind IN ('REVIEW','LESSON','WEAK_SKILL')` | R4 |
| `mistake` | Sổ lỗi tự động (§4.8) | `id`, `user_id`, `origin`, `word_id`, `kanji_id`, `grammar_point_id`, `prompt`, `user_answer`, `correct_answer`, `explanation`, `occurrences`, `last_seen_at`, `resolved_at`, `created_at` | `origin IN ('EXERCISE','REVIEW','AI_CONVERSATION')`; `num_nonnulls(word_id, kanji_id, grammar_point_id) <= 1`; `occurrences >= 1` | R6 |

### D. Gia sư AI

| Bảng | Mục đích | Cột chính | Ràng buộc đáng chú ý | Phase |
|---|---|---|---|---|
| `ai_conversation` | Một cuộc hội thoại | `id`, `user_id`, `language_id`, `mode`, `scenario`, `started_at`, `ended_at`, `summary` (+ `lesson_id` ở R6) | `mode IN ('CONVERSATION')`; `ended_at >= started_at`. Có `language_id` vì không suy ra được từ nội dung (ngoại lệ D15) | V1 |
| `ai_message` | Tin nhắn | `id`, `conversation_id`, `role`, `content`, `created_at` | `role IN ('USER','ASSISTANT')`; index `(conversation_id, created_at)` | V1 |

## Bảng cũ bị bỏ

| Bảng cũ | Thay bằng |
|---|---|
| `vocabulary`, `vocabulary_tag`, `vocabulary_tag_link` | `jp_word` (global) + `user_word` (tự nhập). Bỏ tag |
| `review_schedule`, `review_history` | `srs_card`, `review_log` |
| `study_session` | `activity_log` |
| `daily_plan`, `daily_plan_item` | `daily_session`, `daily_session_step` |
| `exercise` | Bài tập sinh từ nội dung lúc học; kết quả ghi vào `activity_log` + `mistake`. Không lưu sẵn bài tập AI |
| `mistake_category` | `mistake.origin` + FK tới nội dung |
| `content_item` (R1, D10) | Các bảng riêng `kana`, `jp_word`, `jp_kanji`, `grammar_point`, `example_sentence` |
| Seed V9, V10, V12 (300 từ tiếng Anh, user `seed@learnflow.system`) | Không thay. Nội dung chỉ đi qua `ContentImporter` |

## Ảnh hưởng và việc phải làm khi deploy

- Đã gỡ: các module backend `vocabulary`, `srs`, `study`, `dailyplan`, `dashboard`, `exercise`, `mistake`,
  `progress` và các trang frontend Dashboard, Vocabulary, Review, Exercises, Mistake Book, Progress.
  Còn lại: đăng nhập, gia sư AI (chưa có ngữ cảnh người học, sổ lỗi chưa có), trang `/sources`.
- AI: bỏ `generateDailyPlan` và `generateExercises`. Sửa câu không còn nút "lưu vào sổ lỗi"; tổng kết hội thoại
  trả `mistakes` (không còn `pushedMistakes`), không còn nút "thêm vào bộ từ". Cả hai quay lại ở R3/R6.
- Bỏ endpoint `PATCH /api/auth/me/settings` (giới hạn từ mới/ngày): quay lại ở R0 qua `user_profile`.
- **Prod, trước khi deploy bản này:** backup rồi xoá schema cũ, vì Flyway sẽ báo lỗi khi thấy lịch sử V1–V15
  không còn file tương ứng:
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  ```
