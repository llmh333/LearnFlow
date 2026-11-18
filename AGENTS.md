# AGENTS.md — LearnFlow conventions contract

> Quy ước chung cho mọi agent/phiên làm việc trong repo. File này chỉ giữ **luật cốt lõi và quy trình**;
> chi tiết từng mảng nằm trong `.claude/rules/` và được nạp khi làm việc với đúng loại file.
> Yêu cầu sản phẩm và decision log: `plan/2026-11-17-japanese-learning-path-refactor.md`.

| Mảng | Chi tiết ở | Áp dụng cho |
|---|---|---|
| Backend: module, API, thời gian, AI | `.claude/rules/backend.md` | `backend/src/main/java/**` |
| Database: migration, schema, entity | `.claude/rules/database.md` | `db/**`, `domain/**`, `*Repository.java` |
| Frontend | `.claude/rules/frontend.md` | `frontend/**` |
| Test | `.claude/rules/testing.md` | `backend/src/test/**`, `*.test.tsx` |
| Nội dung tiếng Nhật | `.claude/rules/content.md` | `backend/src/main/resources/content/**`, `scripts/content/**` |

## 1. Bản giao kèo quy ước (Conventions Contract)

### 1.1. Cấu trúc module backend

Mỗi domain là một package phẳng dưới `com.learnflow.backend` (Controller, Service, Repository, `domain/`, `dto/`).

**Ba luật ranh giới — không được vi phạm:**
1. Controller **không bao giờ** inject Repository. Luôn đi qua Service.
2. Service của module A **không** inject Repository của module B. Chỉ gọi Service public của B.
3. Module `ai` **không** được depend vào bất kỳ repository nào của `srs`. AI không ghi lịch ôn. Chặn cứng bằng ArchUnit.

### 1.2. Quy ước API

Base path `/api`, Bearer JWT; request/response là java `record` (không trả entity); lỗi theo RFC 7807
`ProblemDetail`; phân trang bằng `PageResponse<T>`. Chi tiết: `.claude/rules/backend.md`.

### 1.3. Quy ước database

Flyway là nguồn duy nhất của schema, `ddl-auto=validate`. **Không bao giờ sửa migration đã apply**, sai thì
thêm migration mới. Cột thời gian `TIMESTAMPTZ`. Chi tiết: `.claude/rules/database.md`.

### 1.4. Thời gian & tính xác định

**Luôn inject `java.time.Clock`**, không gọi `Instant.now()` trực tiếp. Test dùng `Clock.fixed(...)`.
Chi tiết: `.claude/rules/backend.md`.

### 1.5. Quy ước frontend

react-query giữ server state; query key tập trung `<domain>Keys`; zustand chỉ cho auth + UI state;
mobile-first. Không thêm dependency ngoài danh sách đã chốt nếu không có lý do ghi vào decision log.
Chi tiết: `.claude/rules/frontend.md`.

### 1.6. Quy ước test

Unit `XxxTest`, integration `XxxIntegrationTest extends AbstractIntegrationTest`, kiến trúc
`ArchitectureTest`, frontend `Xxx.test.tsx`. **Không test nào được gọi API AI thật** — luôn mock `AIProvider`.
Chi tiết: `.claude/rules/testing.md`.

### 1.7. Quy ước git & vòng lặp làm việc

- **`main` và `dev` không bao giờ nhận commit/push trực tiếp.** Mọi thay đổi — kể cả 1 task nhỏ trong 1 phase —
  đi qua branch riêng rồi mở Pull Request merge vào `dev`. `dev` merge vào `main` khi có bản release/deploy.
- Branch đặt từ `dev`, đặt tên `phase/r<n>-<slug>` cho cả phase, hoặc `phase/r<n>-<slug>/<task-slug>` khi một
  task đủ lớn để tách branch riêng trong phase (vd `phase/r1-content-pipeline`,
  `phase/r1-content-pipeline/jmdict-import`). Việc ngoài phase (docs, tooling): `docs/<slug>`, `chore/<slug>`,
  `fix/<slug>`. Tên branch phải cho biết ngay đang làm phase nào để dễ theo dõi tiến độ trên GitHub.
- Mỗi phase có file `plan/phase-r<n>-<slug>.md` chứa checklist task.
- Mỗi branch → một Pull Request nhắm vào `dev`, tiêu đề nêu rõ phase/task, mô tả liệt kê task nào trong
  checklist của file phase đã xong. Merge PR xong mới tick `- [x]` các task tương ứng trong file phase.
- Commit: Conventional Commits, scope = tên module — `feat(vocabulary): add attribute validation per language`.
- **Thứ tự làm trong mỗi phase** (giữ nguyên ở mọi phase để nhất quán):
  1. Migration SQL → 2. Entity → 3. Repository → 4. Service + unit test → 5. Controller + integration test
  → 6. `types/domain.ts` → 7. `api/<domain>.ts` → 8. `hooks/use<Domain>.ts` → 9. Component/Page → 10. FE test
- **Cổng kiểm tra trước khi mở PR / đóng phase** (bắt buộc chạy hết, xanh hết):
  ```
  cd backend  && ./mvnw verify            # gồm spotless:check
  cd frontend && npm run format:check && npm run lint && npm run build && npm run test
  ```
- Đóng phase: PR cuối cùng của phase merge vào `dev` xong, tick hết checkbox trong file phase tương ứng,
  cập nhật decision log trong `plan/2026-11-17-japanese-learning-path-refactor.md` nếu có thay đổi.

### 1.8. Format code

- Backend: **Spotless** + google-java-format style **AOSP** (thụt lề 4 space), bỏ import thừa.
  `ratchetFrom origin/dev`: chỉ file đã đổi so với `dev` bị kiểm tra/format. `./mvnw spotless:apply` để format.
- Frontend: **Prettier** — không chấm phẩy, nháy đơn, trailing comma, `printWidth` 100
  (`frontend/.prettierrc.json`). `npm run format` để format.
- Không tự căn chỉnh code bằng tay trái với formatter; không tắt formatter cho cả file.
