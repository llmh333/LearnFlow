---
paths:
  - "frontend/**"
---

# Frontend rules (Vite / React / TypeScript)

Chi tiết cho AGENTS.md §1.5.

## Cấu trúc

```
frontend/src/
├── api/
│   ├── client.ts               // fetch wrapper: gắn Bearer, parse ProblemDetail, ném ApiError, 401 -> logout
│   └── <domain>.ts             // hàm thuần gọi API: fetchVocabularyList, createVocabulary...
├── hooks/use<Domain>.ts        // wrap react-query, export <domain>Keys
├── pages/<Name>Page.tsx
├── components/
│   ├── ui/                     // Button, Input, Select, Card, Dialog, Badge — dùng chung
│   └── <domain>/<Name>.tsx
├── stores/authStore.ts, uiStore.ts   // zustand (+ persist cho auth)
├── types/domain.ts             // mirror DTO backend, viết tay
├── lib/cn.ts, lib/format.ts
└── router.tsx
```

## Quy tắc

- Tên file component = tên component, PascalCase. Hook `useXxx`. Hàm API dùng động từ:
  `fetch*`, `create*`, `update*`, `delete*`.
- Query key tập trung mỗi domain:
  `export const vocabularyKeys = { all: ['vocabulary'], list: (p) => [...], detail: (id) => [...] }`.
  Không viết mảng key rời rạc trong component.
- Server state **chỉ** ở react-query. Zustand chỉ giữ auth token + UI state (ví dụ ngôn ngữ đang chọn).
- `types/domain.ts` mirror DTO backend bằng tay; đổi DTO backend thì đổi type ở cùng PR.
- UI copy: **tiếng Anh** (quyết định hiện hành; đang cân nhắc chuyển sang tiếng Việt cho người học Việt Nam —
  chưa đổi cho tới khi có quyết định trong decision log).
- Không thêm dependency ngoài danh sách đã chốt nếu không ghi lý do vào decision log.
- Thiết kế **mobile-first**: dùng được ở chiều rộng 375px, vùng chạm đủ lớn, không cuộn ngang.
- Component và hàm thuần trong `lib/` dễ test; tách logic khỏi JSX khi logic phức tạp.

## Format

Prettier (`frontend/.prettierrc.json`): không chấm phẩy, nháy đơn, trailing comma, `printWidth` 100.
Hook tự chạy Prettier sau mỗi lần sửa file trong `frontend/src`.
