# Dashboard "Your Languages" — làm rõ Due/New/Time/Retention

## Bối cảnh

Người dùng nhìn vào 1 block ngôn ngữ trên Dashboard (vd English: "100 due, 93 new, ~143 min,
retention rate 100%") và không hiểu các con số này nghĩa là gì — đặc biệt khó hiểu nhất là
**retention rate 100% dù vừa sang ngày mới, chưa ôn từ nào**.

**Nguyên nhân retention 100% dù chưa làm gì hôm nay**: đã xác nhận qua code — retention rate
(`ReviewService.retentionStats`, dùng chung bởi Dashboard và Progress) là **thống kê 30 ngày gần
nhất** (không phải "hôm nay"), tính bằng `số lượt ôn không phải "Again" / tổng số lượt ôn trong 30
ngày`. Nếu tổng số lượt ôn trong 30 ngày rất ít (vd 1-2 lượt từ hôm trước, thử stroke-order hay demo),
và tất cả đều không phải "Again", tỉ lệ sẽ ra đúng 100% — con số **thống kê đúng nhưng gây hiểu lầm**
vì (1) UI hiện tại không nói rõ đây là số liệu "30 ngày qua", khiến người dùng tưởng nó phản ánh "hôm
nay", và (2) không hiển thị **cỡ mẫu** (bao nhiêu lượt ôn), nên 100% từ 2 lượt ôn trông giống hệt 100%
từ 200 lượt ôn — trong khi ý nghĩa thống kê hoàn toàn khác nhau.

`Due`/`New`/`Time` không sai, chỉ đang thiếu ngữ cảnh: nhãn quá cộc (không rõ "due" là gì so với
"new"), không có tooltip giải thích.

## Khảo sát đã xác nhận

- **Backend** `LanguageTodaySummary` (`backend/.../dashboard/dto/LanguageTodaySummary.java`):
  `record(LanguageResponse language, long dueCount, long newCount, long knownWords, double
  retentionPercent, int estimatedMinutes)` — **không có field cỡ mẫu**, dù
  `ReviewService.retentionStats(...)` trả về `RetentionStats(successCount, totalCount)` đầy đủ ngay
  trong `DashboardService.summarize` (`backend/.../dashboard/DashboardService.java`) — chỉ có
  `retention.rate() * 100` được giữ lại, `totalCount` bị bỏ đi.
- `DashboardServiceTest.java` assert qua accessor method (`englishSummary.dueCount()`...), không
  dựng record theo vị trí tham số → thêm 1 field mới vào `LanguageTodaySummary` an toàn, không vỡ
  test cũ.
- **Frontend** `frontend/src/pages/DashboardPage.tsx` (dòng ~134-168): block 3 cột "Due/New/Time"
  trong 1 `<div className="grid grid-cols-3...">`, rồi thanh "Retention rate" riêng — không có
  tooltip/caption nào cho cả 4 số. `frontend/src/types/domain.ts`'s `LanguageTodaySummary` mirror
  đúng 6 field backend hiện có, thiếu cỡ mẫu tương ứng.
- Không có `DashboardPage.test.tsx` nào tồn tại — không có test FE nào cần cập nhật cho trang này.
- Pattern tooltip đã dùng sẵn trong repo: thuộc tính HTML `title="..."` (vd nút Edit/Delete ở
  `VocabularyPage.tsx`) — đủ dùng, không cần thêm component/thư viện tooltip mới.

## Thiết kế

### 1. Backend — lộ cỡ mẫu ra ngoài

- `LanguageTodaySummary`: thêm field `long retentionSampleSize` (ngay sau `retentionPercent`).
- `DashboardService.summarize`: truyền `retention.totalCount()` vào field mới (dữ liệu đã có sẵn
  trong tay, không cần query gì thêm).
- `DashboardServiceTest`: thêm assertion cho `retentionSampleSize()` ở test case đã có.

### 2. Frontend — làm rõ nghĩa từng số

**`types/domain.ts`**: thêm `retentionSampleSize: number` vào `LanguageTodaySummary`.

**`DashboardPage.tsx`**, khối 3 cột Due/New/Time (dòng ~134-153): đổi nhãn + thêm `title` tooltip
cho từng ô (không đổi layout/kích thước):
- "Due" → **"Due now"**, `title="Words ready to review right now"`
- "New" → **"New words"**, `title="Words you haven't studied yet"`
- "Time" → giữ nguyên nhãn, thêm `title="Estimated minutes to review due words and learn new ones"`

**Khối Retention rate** (dòng ~155-168) — thay đổi chính, xử lý đúng gốc vấn đề:
- Đổi nhãn thành **"Retention (last 30 days)"** — nói rõ ngay trong nhãn đây không phải số liệu
  "hôm nay", thay vì giấu trong tooltip.
- Thêm `title` tooltip: `"% of your reviews in the last 30 days you remembered (rated Hard/Good/Easy,
  not Again)"`.
- Thêm dòng caption nhỏ dưới thanh progress: nếu `retentionSampleSize >= 5` →
  `"Based on {n} reviews"`; nếu `< 5` → **đổi hẳn màu chữ/thanh sang xám trung tính** (không dùng màu
  xanh lá tự tin nữa) + text **"Not enough reviews yet ({n})"** thay vì hiển thị % như 1 con số chắc
  chắn — đây là điểm sửa trực tiếp cho đúng tình huống của người dùng (100% từ rất ít lượt ôn).
- Ngưỡng `5` hardcode làm hằng số cục bộ trong component (không cần config, đây là ngưỡng UI thuần
  tuý).

Không đổi bố cục/kích thước card tổng thể, không đụng tới khối "Progress Overview" ở cuối trang (dùng
lại đúng field `retentionPercent` hiện có, không phải nguồn gây nhầm lẫn user đang hỏi tới) — giữ thay
đổi tập trung đúng vào khối "Your Languages" đang gây khó hiểu.

## File cần sửa

- **Sửa** `backend/src/main/java/com/learnflow/backend/dashboard/dto/LanguageTodaySummary.java`
- **Sửa** `backend/src/main/java/com/learnflow/backend/dashboard/DashboardService.java`
- **Sửa** `backend/src/test/java/com/learnflow/backend/dashboard/DashboardServiceTest.java`
- **Sửa** `frontend/src/types/domain.ts`
- **Sửa** `frontend/src/pages/DashboardPage.tsx`

## Kiểm tra

- `cd backend && ./mvnw verify` — pass hết + assertion mới.
- `cd frontend && npm run lint && npm run build && npm run test` — pass hết (không có test FE nào
  cho Dashboard nên chỉ cần build sạch).
- Test tay: vào Dashboard với 1 tài khoản mới/ít lịch sử ôn tập → thấy khối Retention hiện
  "Not enough reviews yet (N)" màu xám thay vì "100%" xanh; hover vào Due/New/Time/Retention → thấy
  tooltip giải thích.
