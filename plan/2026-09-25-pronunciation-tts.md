# Phát âm từ vựng (Text-to-Speech) kiểu Google Dịch

## Đánh giá khả thi

**Khả thi, và không cần thư viện ngoài nào cả.** Mọi trình duyệt hiện đại (Chrome, Edge, Firefox,
Safari, Samsung Internet — cả desktop lẫn mobile) đều có sẵn **Web Speech API**
(`window.speechSynthesis` + `SpeechSynthesisUtterance`) — một Web API chuẩn, miễn phí tuyệt đối,
không cần API key, không cần backend, không thêm dependency. Cách dùng: tạo
`new SpeechSynthesisUtterance(word)`, set `utterance.lang` theo mã BCP-47 (`en-US`, `zh-CN`, `ja-JP`),
rồi gọi `speechSynthesis.speak(utterance)`.

**Đánh đổi cần biết**: giọng đọc lấy từ giọng đọc đã cài trên hệ điều hành/trình duyệt của người
dùng, không phải giọng AI chất lượng cao đồng nhất như Google Dịch (vốn chạy trên server của Google).
Trên Windows/macOS/Android với Chrome/Edge thường có sẵn giọng `zh-CN`/`ja-JP` khá tốt; trên Linux hoặc
trình duyệt/hệ điều hành thiếu gói ngôn ngữ thì giọng có thể không có hoặc nghe robot hơn. Đây là đánh
đổi hợp lý cho v1: **miễn phí, tức thời, không rủi ro kiến trúc**.

Nếu sau này thấy chất lượng chưa đủ tốt, hướng nâng cấp là gọi **Google Cloud Text-to-Speech** (hoặc
Azure/Amazon Polly) — giọng AI chất lượng cao, nhưng: (1) không dùng free mãi mãi — Google Cloud TTS có
free tier theo số ký tự/tháng rồi tính phí, (2) bắt buộc phải qua backend để giấu API key (gọi thẳng từ
frontend sẽ lộ key), (3) cần thêm 1 provider mới + quyết định lưu vào decision log theo
`AGENTS.md` §1.5. Vì vậy đề xuất **chỉ làm Web Speech API ở v1 này**, để riêng phương án backend TTS
cho một phase sau nếu thực sự cần.

## Khảo sát đã xác nhận

- `frontend/src/components/ui/Icon.tsx`: tất cả icon là SVG inline theo 1 pattern cố định (path lấy từ
  bộ Lucide), chưa có icon loa (`volume`) — cần thêm 1 icon mới theo đúng pattern này.
- `frontend/src/components/ui/Dialog.tsx`: prop `title?: string`, chỉ render `{title && <h2>{title}</h2>}`
  — đổi type thành `title?: ReactNode` là thay đổi an toàn, tương thích ngược 100% với mọi chỗ đang
  truyền `string` (vd `VocabularyPage.tsx`), cho phép `VocabularyDetailDialog` truyền vào 1 `<span>` gồm
  chữ + nút loa.
- `frontend/src/pages/ReviewPage.tsx` dòng 358-360: `<h2>{current.word}</h2>` đứng riêng, không nằm
  trong `Dialog` — dễ thêm nút loa ngay cạnh.
- `frontend/src/components/vocabulary/VocabularyDetailDialog.tsx` (vừa làm xong ở PR #40): hiện dùng
  `<Dialog title={vocabulary?.word}>` — sẽ đổi thành truyền 1 `ReactNode` gồm chữ + nút loa.
- `index.css` đã có sẵn `.animate-pulse-subtle` — tái dùng để nút loa "nhấp nháy" nhẹ trong lúc đang đọc,
  không cần thêm animation mới.
- Không có `lib/speech.ts` hay hook liên quan TTS nào trong repo — làm mới hoàn toàn, theo đúng phong
  cách hàm thuần của `lib/phonetics.ts`/`lib/strokeOrder.ts` (dễ test, không phụ thuộc React).

## Thiết kế

### 1. `frontend/src/lib/speech.ts` (mới, hàm thuần)

```ts
const LANGUAGE_TO_BCP47: Record<string, string> = { en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(
  text: string,
  languageCode: string,
  handlers?: { onStart?: () => void; onEnd?: () => void },
): void {
  if (!isSpeechSupported()) return
  window.speechSynthesis.cancel() // huỷ câu đang đọc dở, tránh xếp hàng chồng chéo
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANGUAGE_TO_BCP47[languageCode] ?? languageCode
  if (handlers?.onStart) utterance.onstart = handlers.onStart
  if (handlers?.onEnd) utterance.onend = handlers.onEnd
  window.speechSynthesis.speak(utterance)
}
```

### 2. Icon mới: `IconVolume2` trong `Icon.tsx`

Theo đúng pattern các icon hiện có (path Lucide "volume-2").

### 3. Component mới: `frontend/src/components/ui/PronounceButton.tsx`

```tsx
interface PronounceButtonProps {
  word: string
  languageCode: string
  size?: number
  className?: string
}
```

- Ẩn hẳn (`return null`) nếu `!isSpeechSupported()` — không hiện nút vô dụng trên trình duyệt không hỗ
  trợ (rất hiếm, nhưng an toàn).
- State `speaking` (bật ở `onStart`, tắt ở `onEnd`) để đổi icon sang trạng thái pulsing
  (`animate-pulse-subtle`) trong lúc đọc — phản hồi trực quan rằng nút đã được bấm.
- `onClick` gọi `speak(word, languageCode, { onStart, onEnd })`, có `stopPropagation()` vì component
  này sẽ được đặt trong `VocabularyPage`'s table row (nếu dùng ở đó sau này) và trong `Dialog` title.
- Nút dạng icon tròn nhỏ, style nhất quán với các icon-button khác (`Button variant="ghost" size="sm"`
  đã dùng trong `VocabularyPage`/`ReviewPage`).

### 4. Gắn vào 2 chỗ hiển thị từ vựng hiện có

- **`ReviewPage.tsx`** (dòng ~358-360): thêm `<PronounceButton word={current.word}
  languageCode={current.language.code} />` ngay cạnh `<h2>{current.word}</h2>`, bọc chung trong 1
  `flex items-center gap-2`.
- **`VocabularyDetailDialog.tsx`**: đổi `title={vocabulary?.word}` thành
  `title={vocabulary && (<span className="flex items-center gap-2">{vocabulary.word}
  <PronounceButton word={vocabulary.word} languageCode={vocabulary.language.code} /></span>)}`.
- **`Dialog.tsx`**: đổi type `title?: string` → `title?: ReactNode` (1 dòng, không đổi logic render).

Không đụng gì tới `VocabularyPage.tsx`'s table hay bất kỳ API/backend nào — thuần frontend, tái dùng
đúng 2 điểm hiển thị "từ + nghĩa" đã có sẵn.

## File cần tạo/sửa

- **Tạo** `frontend/src/lib/speech.ts`
- **Sửa** `frontend/src/components/ui/Icon.tsx` — thêm `IconVolume2`
- **Tạo** `frontend/src/components/ui/PronounceButton.tsx`
- **Sửa** `frontend/src/components/ui/Dialog.tsx` — nới type `title` thành `ReactNode`
- **Sửa** `frontend/src/pages/ReviewPage.tsx` — thêm `PronounceButton` cạnh từ
- **Sửa** `frontend/src/components/vocabulary/VocabularyDetailDialog.tsx` — thêm `PronounceButton` vào
  `title` của `Dialog`
- **Test mới**:
  - `frontend/src/lib/speech.test.ts` — mock `window.speechSynthesis`/`SpeechSynthesisUtterance` toàn
    cục (theo cách `StrokeOrderDiagram.test.tsx` đang mock `fetch`), kiểm tra: gọi đúng `lang` theo từng
    ngôn ngữ, gọi `cancel()` trước khi `speak()`, không throw khi `isSpeechSupported()` là `false`.
  - `frontend/src/components/ui/PronounceButton.test.tsx` — click gọi `speechSynthesis.speak` với đúng
    `word`, ẩn hẳn khi mock "không hỗ trợ" (xoá `speechSynthesis` khỏi `window` trong test đó).
- **Lưu bản kế hoạch này vào `plan/2026-09-25-pronunciation-tts.md`** trong repo (theo thói quen làm
  việc đã thống nhất — lưu song song với plan file tạm của Claude Code), commit cùng code khi mở PR.

## Không nằm trong phạm vi

- Không tích hợp Google Cloud TTS/Azure/Polly hay bất kỳ TTS trả phí nào ở giai đoạn này.
- Không thêm nút phát âm vào bảng `VocabularyPage` (table row) — chỉ 2 chỗ xem chi tiết từ (Review +
  dialog tra cứu Vocabulary), đúng nơi người dùng đang nhìn thấy 1 từ cụ thể.
- Không đổi backend/DB.

## Kiểm tra

- `cd frontend && npm run lint && npm run build && npm run test` — pass toàn bộ + test mới.
- Test tay: mở Review, bấm nút loa cạnh từ → nghe được phát âm (giọng theo ngôn ngữ từ). Mở dialog tra
  cứu ở trang Vocabulary, bấm nút loa cạnh tiêu đề → nghe được phát âm. Thử với cả `en`, `zh`, `ja`.
