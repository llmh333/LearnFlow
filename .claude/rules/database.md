---
paths:
  - "backend/src/main/resources/db/**"
  - "backend/src/main/java/**/domain/**"
  - "backend/src/main/java/**/*Repository.java"
  - "backend/src/main/resources/application*.yml"
---

# Database rules (PostgreSQL / Flyway / JPA)

Chi tiết cho AGENTS.md §1.3.

## Migration

- Đường dẫn: `backend/src/main/resources/db/migration/V{n}__{snake_case_desc}.sql`.
- Số `n` = số lớn nhất hiện có + 1, tăng dần, không nhảy cóc.
- **Không bao giờ sửa file migration đã apply** (đã merge vào `dev`). Sai thì thêm migration mới.
  Hook `guard.py` chặn việc này. Ngoại lệ duy nhất đã dùng: reset schema ngày 2026-11-18 (D12).
- **Mỗi bảng một migration**: tạo bảng → `V{n}__create_<table>_table.sql` (kèm index, dữ liệu tham chiếu của
  chính bảng đó). Đổi bảng có sẵn → `V{n}__<verb>_<what>_<table>.sql`, chỉ đụng đúng bảng đó. Không gộp nhiều
  bảng vào một file.
- Thiết kế schema hiện hành: `plan/2026-11-18-database-redesign.md`.
- Một migration một mục đích; không trộn đổi schema với import nội dung. Nội dung học đi qua
  `ContentImporter`, không đi qua Flyway.
- Migration xoá hoặc đổi dữ liệu người dùng phải nói rõ trong mô tả PR.

## Schema

- `spring.jpa.hibernate.ddl-auto=validate` **luôn luôn**. Schema chỉ do Flyway tạo.
- `spring.jpa.open-in-view=false`.
- Tên bảng/cột `snake_case`, số ít: `word`, `review_log`, `app_user`. Bảng nội dung dùng chung mọi ngôn ngữ, có
  `language_id` (D18); chỉ thứ riêng một ngôn ngữ mới mang tên riêng (`kana`). Cấp độ trỏ `proficiency_level`.
- Mọi cột thời gian `TIMESTAMPTZ NOT NULL`, map sang `Instant`, **không** `DEFAULT now()`: app ghi qua `Clock`.
  Ngày theo giờ địa phương của user (D7) lưu ở cột `DATE` riêng (`local_date`).
- Enum lưu dạng chuỗi chữ hoa và luôn có `CHECK (... IN (...))`. Cột bắt buộc luôn `NOT NULL`.
- Liên kết tới nhiều loại nội dung: một cột FK cho mỗi loại + `CHECK (num_nonnulls(...) = 1)`, không dùng
  cặp `(item_type, item_id)`.
- Không lưu bộ đếm suy ra được từ bảng log. Lặp `user_id` để có index thì dùng FK kép `(id, user_id)`.
- Flyway không seed dữ liệu người dùng hay nội dung học (chỉ dữ liệu tham chiếu như `language`).
- Khoá chính `BIGSERIAL` → `Long` (trừ `language` dùng `SMALLSERIAL`).
- Bảng dữ liệu người dùng có `user_id BIGINT NOT NULL REFERENCES app_user (id)` và một index khớp truy vấn
  nóng nhất, thường `(user_id, <cột lọc/sắp xếp>)`.
- Ràng buộc duy nhất theo người dùng là `UNIQUE (user_id, ...)`, không phải duy nhất toàn cục.
- Bảng nội dung dùng chung (không có `user_id`) có khoá ổn định `content_key` để import lặp lại được.

## Entity

- `@Entity` nằm trong `domain/`. Không để entity lọt ra Controller.
- Cột `NUMERIC` map sang `BigDecimal`; dữ liệu linh hoạt theo ngôn ngữ dùng JSONB và được validate ở Service.
