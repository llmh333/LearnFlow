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
  Hook `guard.py` chặn việc này.
- Một migration một mục đích; không trộn đổi schema với import nội dung. Nội dung học đi qua
  `ContentImporter`, không đi qua Flyway.
- Migration xoá hoặc đổi dữ liệu người dùng phải nói rõ trong mô tả PR.

## Schema

- `spring.jpa.hibernate.ddl-auto=validate` **luôn luôn**. Schema chỉ do Flyway tạo.
- `spring.jpa.open-in-view=false`.
- Tên bảng/cột `snake_case`, số ít: `vocabulary`, `review_history`, `app_user`.
- Mọi cột thời gian `TIMESTAMPTZ`, map sang `Instant`.
- Khoá chính `BIGSERIAL` → `Long` (trừ `language` dùng `SMALLSERIAL`).
- Bảng dữ liệu người dùng có `user_id BIGINT NOT NULL REFERENCES app_user (id)` và một index khớp truy vấn
  nóng nhất, thường `(user_id, <cột lọc/sắp xếp>)`.
- Ràng buộc duy nhất theo người dùng là `UNIQUE (user_id, ...)`, không phải duy nhất toàn cục.
- Bảng nội dung dùng chung (không có `user_id`) có khoá ổn định `content_key` để import lặp lại được.

## Entity

- `@Entity` nằm trong `domain/`. Không để entity lọt ra Controller.
- Cột `NUMERIC` map sang `BigDecimal`; dữ liệu linh hoạt theo ngôn ngữ dùng JSONB và được validate ở Service.
