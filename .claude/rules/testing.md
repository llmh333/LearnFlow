---
paths:
  - "backend/src/test/**"
  - "frontend/**/*.test.ts"
  - "frontend/**/*.test.tsx"
---

# Testing rules

Chi tiết cho AGENTS.md §1.6.

| Loại | Đặt tên | Công cụ |
|---|---|---|
| Unit backend (không Spring context) | `XxxTest.java` | JUnit 5 (+ Mockito khi cần) |
| Integration backend (DB thật) | `XxxIntegrationTest.java` extends `AbstractIntegrationTest` | `@SpringBootTest` + Testcontainers `@ServiceConnection` |
| Ranh giới kiến trúc | `ArchitectureTest.java` | ArchUnit |
| Frontend | `Xxx.test.tsx` cạnh file | Vitest + React Testing Library |

## Quy tắc

- `AbstractIntegrationTest` giữ **một** `PostgreSQLContainer` static dùng chung cho cả suite.
- **Không test nào được gọi API AI thật.** Luôn mock `AIProvider`.
- Test thời gian dùng `Clock.fixed(...)`; không dùng `Thread.sleep` để chờ thời gian.
- Service/engine mới có logic → có unit test. Endpoint mới → integration test phủ tối thiểu:
  chưa đăng nhập (401), dữ liệu của người khác (404), dữ liệu sai (400 có `errors`).
- Ưu tiên tuyệt đối: `Sm2AlgorithmTest` phải phủ đủ mọi rating × mọi trạng thái.
- Luật ranh giới module nào có thể kiểm bằng ArchUnit thì thêm vào `ArchitectureTest`.
- Test frontend mô tả hành vi người dùng thấy (`getByRole`, `getByText`), không kiểm chi tiết cài đặt.
- Sửa lỗi thì thêm test tái hiện lỗi trước, rồi mới sửa.
