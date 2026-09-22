# LearnFlow — Hệ thống học ngoại ngữ cá nhân tích hợp AI

## 1. Tổng quan dự án

LearnFlow là một ứng dụng web phục vụ mục đích học ngoại ngữ cá nhân, trước mắt tập trung vào:

- Tiếng Anh
- Tiếng Trung (Quan thoại)
- Tiếng Nhật

Toàn bộ nội dung học tập phục vụ mục tiêu **thi chứng chỉ ngoại ngữ**:

- Tiếng Anh → IELTS
- Tiếng Trung → HSK
- Tiếng Nhật → JLPT (N5–N1)

Nghĩa của từ vựng (`meaning`) luôn được dịch và hiển thị bằng **tiếng Việt**, bất kể ngôn ngữ đang học.

Ứng dụng được thiết kế cho **một người dùng duy nhất**, không hướng tới mô hình SaaS hay cộng đồng.

Mục tiêu chính của hệ thống là tạo ra một môi trường học cá nhân hóa kết hợp giữa:

- Quản lý từ vựng
- Hệ thống ôn tập ngắt quãng (Spaced Repetition System — SRS)
- Gia sư AI
- Theo dõi lỗi thường gặp
- Phân tích tiến độ học
- Tạo kế hoạch học hằng ngày bằng AI

Ứng dụng cần giúp người học trả lời được ba câu hỏi cốt lõi:

1. Hôm nay tôi nên học gì?
2. Tôi đang quên hoặc yếu phần nào?
3. Tiếp theo tôi nên tập trung vào nội dung gì?

Hệ thống cần dần hiểu được:

- Điểm mạnh
- Điểm yếu
- Mức độ ghi nhớ từ vựng
- Các lỗi thường gặp
- Lịch sử học tập

AI không phải là toàn bộ ứng dụng.

AI chỉ nên là một thành phần thông minh hoạt động trên dữ liệu học tập có cấu trúc.

Các dữ liệu cốt lõi như:

- từ vựng
- lịch sử ôn tập
- tiến độ
- lỗi
- lịch học

phải được lưu trong cơ sở dữ liệu của ứng dụng.

---

## 2. Nguyên tắc thiết kế

### 2.1. Ưu tiên nhu cầu cá nhân

Đây là một ứng dụng học tập cá nhân.

Không triển khai những chức năng không cần thiết như:

- Hệ thống nhiều người dùng
- Mạng xã hội
- Bảng xếp hạng
- Thanh toán
- Quản lý gói dịch vụ
- Marketplace khóa học
- Vai trò giáo viên/học viên
- Admin dashboard
- Cộng đồng
- Achievement phức tạp
- Gamification quá mức

Mục tiêu là giữ hệ thống đơn giản và tập trung vào hiệu quả học tập.

---

### 2.2. Học dựa trên dữ liệu

Ứng dụng cần lưu dữ liệu học tập có cấu trúc thay vì phụ thuộc hoàn toàn vào lịch sử hội thoại với AI.

Ví dụ:

- từ vựng đã học
- lịch sử review từ
- mức độ ghi nhớ
- lỗi thường gặp
- điểm yếu về ngữ pháp
- phiên học
- phản hồi từ AI
- kế hoạch học hằng ngày

AI sử dụng những dữ liệu này để cá nhân hóa việc học.

---

### 2.3. AI là trợ lý học tập

AI có thể hỗ trợ:

- Giải thích ngữ pháp
- Tạo ví dụ
- Sửa câu
- Tạo bài tập
- Mô phỏng hội thoại
- Phân tích lỗi thường gặp
- Nhận diện điểm yếu
- Tạo kế hoạch học hằng ngày

AI không nên kiểm soát các hệ thống lõi như thuật toán SRS.

---

# 3. Ngôn ngữ hỗ trợ

Ban đầu hỗ trợ:

- Tiếng Anh (mục tiêu: IELTS)
- Tiếng Trung (mục tiêu: HSK)
- Tiếng Nhật (mục tiêu: JLPT)

Kiến trúc nên đủ linh hoạt để có thể bổ sung các ngôn ngữ hoặc chứng chỉ khác trong tương lai.

Không hard-code toàn bộ hệ thống theo riêng ba ngôn ngữ này — cơ chế field riêng theo ngôn ngữ (metadata mở rộng) phải cho phép thêm ngôn ngữ thứ 4 mà không cần đổi schema.

Với mọi ngôn ngữ, trường `meaning` (nghĩa) luôn là văn bản **tiếng Việt**.

---

## 3.1. Tiếng Anh (mục tiêu: IELTS)

Một từ vựng tiếng Anh có thể gồm:

- Từ
- Nghĩa (tiếng Việt)
- IPA
- Từ loại
- Ví dụ
- Collocation
- Tag
- Trình độ (CEFR, quy đổi tương ứng band IELTS)
- Mức độ ghi nhớ

Ví dụ:

```text
Word: achieve

IPA:
/əˈtʃiːv/

Meaning:
đạt được

Part of speech:
verb

Example:
I want to achieve my goals.

Collocations:
- achieve a goal
- achieve success

Tags:
work, common

Level:
B1 (IELTS ~5.5–6.0)
```

---

## 3.2. Tiếng Trung (mục tiêu: HSK)

Một từ vựng tiếng Trung có thể gồm:

- Hán tự
- Pinyin
- Nghĩa (tiếng Việt)
- Câu ví dụ
- Pinyin của câu ví dụ
- Lượng từ nếu có
- HSK level
- Tag
- Mức độ ghi nhớ

Ví dụ:

```text
Word:
学习

Pinyin:
xuéxí

Meaning:
học / học tập

Example:
我每天学习中文。

Pinyin:
Wǒ měitiān xuéxí Zhōngwén.

Tags:
daily, education

HSK:
HSK 1
```

---

## 3.3. Tiếng Nhật (mục tiêu: JLPT)

Một từ vựng tiếng Nhật có thể gồm:

- Từ (Kanji/Kana)
- Cách đọc (Furigana/Romaji)
- Nghĩa (tiếng Việt)
- Câu ví dụ
- Cách đọc của câu ví dụ
- Loại từ (danh từ/động từ/tính từ...)
- JLPT level (N5–N1)
- Tag
- Mức độ ghi nhớ

Ví dụ:

```text
Word:
勉強

Reading:
べんきょう (benkyou)

Meaning:
học / học tập

Example:
毎日日本語を勉強します。

Reading:
まいにちにほんごをべんきょうします。

Tags:
daily, education

JLPT:
N5
```

---

# 4. Các chức năng chính

## 4.1. Dashboard

Dashboard là màn hình chính.

Mục tiêu là trả lời ngay câu hỏi:

> Hôm nay tôi cần học gì?

Dashboard nên hiển thị:

### Việc cần học hôm nay

- Số từ đến hạn ôn
- Số từ mới dự kiến học
- Kế hoạch học trong ngày
- Thời lượng học ước tính
- Các nhiệm vụ học hiện tại

Ví dụ:

```text
Hôm nay

English
12 từ đến hạn
5 từ mới
1 bài ngữ pháp

Chinese
18 từ đến hạn
5 từ mới
1 bài hội thoại

Thời gian dự kiến:
42 phút
```

### Tiến độ nhanh

Ví dụ:

```text
English
Từ đã biết: 1.240
Retention: 87%
Từ đến hạn: 12

Chinese
Từ đã biết: 420
Retention: 79%
Từ đến hạn: 18

Japanese
Từ đã biết: 180
Retention: 82%
Từ đến hạn: 9
```

Dashboard nên đơn giản.

Không nên có quá nhiều chart hoặc thông tin trang trí.

---

## 4.2. Vocabulary

Vocabulary là kho dữ liệu từ vựng trung tâm.

Người dùng cần có thể:

- Thêm từ mới
- Sửa từ
- Xóa từ
- Tìm kiếm
- Lọc
- Gắn tag
- Xem trạng thái học

Các field chung có thể gồm:

```text
id
language
word
meaning        # luôn là tiếng Việt, bất kể ngôn ngữ đang học
example
tags
difficulty
memory_strength
created_at
updated_at
```

Các field riêng cho tiếng Anh (mục tiêu IELTS):

```text
ipa
part_of_speech
cefr_level
collocations
```

Các field riêng cho tiếng Trung (mục tiêu HSK):

```text
pinyin
hsk_level
example_pinyin
measure_word
```

Các field riêng cho tiếng Nhật (mục tiêu JLPT):

```text
reading           # furigana/kana
example_reading
part_of_speech
jlpt_level
```

Nên cân nhắc thiết kế metadata mở rộng thay vì tách hoàn toàn từng hệ thống từ vựng riêng biệt theo ngôn ngữ.

---

## 4.3. Review / Spaced Repetition System

Ứng dụng phải có SRS engine.

Mục tiêu của hệ thống là quyết định:

> Khi nào từ này nên xuất hiện lại?

Mỗi từ có thông tin review như:

```text
last_review
next_review
review_count
success_count
failure_count
memory_strength
difficulty
```

Khi review, người học có thể đánh giá:

```text
Again
Hard
Good
Easy
```

Ý nghĩa ví dụ:

```text
Again
→ ôn lại sớm

Hard
→ khoảng cách ngắn

Good
→ khoảng cách bình thường

Easy
→ khoảng cách dài hơn
```

Có thể cân nhắc sử dụng thuật toán nâng cao như FSRS.

Tuy nhiên:

**SRS phải độc lập với AI.**

AI không được tự quyết định lịch ôn.

Lịch sử review phải được lưu lại.

Ví dụ entity:

```text
ReviewHistory

id
vocabulary_id
reviewed_at
rating
previous_interval
new_interval
response_time
```

---

## 4.4. AI Tutor

AI Tutor là trợ lý học tập tương tác.

AI Tutor cần hỗ trợ nhiều chế độ.

### Giải thích ngữ pháp

Ví dụ tiếng Anh:

```text
Giải thích sự khác nhau giữa:

I have done
I did
```

Ví dụ tiếng Trung:

```text
Giải thích cách dùng:

了
过
着
```

AI nên giải thích theo đúng trình độ hiện tại của người học.

---

### Tạo ví dụ

Với từ:

```text
achieve
```

AI có thể tạo:

- Ví dụ đơn giản
- Ví dụ trong môi trường công việc
- Ví dụ hội thoại

Với tiếng Trung:

```text
提高
```

AI có thể tạo:

- Câu
- Pinyin
- Nghĩa

---

### Sửa câu

Người học nhập:

```text
I go to office yesterday.
```

AI trả về:

```text
Correct:
I went to the office yesterday.

Reason:
"go" phải dùng quá khứ vì có "yesterday".
```

Ví dụ tiếng Trung:

```text
我昨天去公司了工作。
```

AI cần:

- Sửa câu
- Giải thích lỗi
- Có thể gợi ý cách nói tự nhiên hơn

Những lỗi quan trọng nên được gửi sang Mistake Book.

---

### Luyện hội thoại

AI cần hỗ trợ role-play.

Ví dụ tiếng Anh:

- Họp công việc
- Phỏng vấn
- Nhà hàng
- Du lịch
- Giao tiếp hằng ngày

Ví dụ tiếng Trung:

- Nhà hàng
- Mua sắm
- Công việc
- Du lịch
- Giao tiếp hằng ngày

AI nên duy trì hội thoại tự nhiên.

Không nên ngắt từng câu để sửa lỗi ngay lập tức.

Sau một số lượt hội thoại, AI có thể tổng kết:

```text
Mistakes
New vocabulary
Better expressions
Grammar problems
```

Các lỗi đáng chú ý nên được lưu vào Mistake Book.

---

## 4.5. Mistake Book

Mistake Book là nơi tập trung các lỗi thường gặp.

Lỗi có thể đến từ:

- AI Tutor
- Bài viết
- Hội thoại
- Vocabulary review
- Grammar exercise

Ví dụ:

```text
Original:
I go to office yesterday.

Correct:
I went to the office yesterday.

Category:
Grammar

Topic:
Past Simple

Language:
English

Times repeated:
3
```

Ví dụ tiếng Trung:

```text
Original:
我昨天去公司了工作。

Correct:
我昨天去公司工作了。

Category:
Grammar

Topic:
了

Language:
Chinese
```

Các loại lỗi có thể gồm:

```text
Vocabulary
Grammar
Word order
Pronunciation
Usage
Spelling
Tone
Other
```

Hệ thống cần theo dõi lỗi lặp lại.

Ví dụ:

```text
Present Perfect
Số lần lỗi: 7

Chinese measure words
Số lần lỗi: 5

Tone 3
Số lần lỗi: 9
```

Các lỗi lặp lại nên ảnh hưởng đến Daily Plan.

---

## 4.6. Progress

Progress dùng để đánh giá việc học có thực sự cải thiện hay không.

### Vocabulary

Các chỉ số quan trọng:

```text
Tổng số từ
Từ đang học
Từ đã thành thạo
Từ mới
Từ đến hạn
```

### Retention

Ví dụ:

```text
English retention:
87%

Chinese retention:
79%
```

Retention nên được tính từ lịch sử review thực tế.

---

### Weak areas

Hệ thống cần xác định các điểm yếu từ dữ liệu.

Ví dụ:

```text
English weaknesses

Past tense
Phrasal verbs
Listening vocabulary

Chinese weaknesses

Measure words
Tone 2 vs Tone 3
把 sentence
```

AI có thể hỗ trợ diễn giải.

Tuy nhiên số liệu gốc phải lấy từ dữ liệu đã lưu.

---

### Lịch sử học

Theo dõi StudySession.

Ví dụ:

```text
StudySession

date
language
duration
words_reviewed
words_learned
mistakes
exercises_completed
```

UI Progress nên ưu tiên thông tin hữu ích thay vì quá nhiều biểu đồ.

---

## 4.7. Daily Plan

Daily Plan là một trong những chức năng quan trọng nhất.

Hệ thống cần tạo một kế hoạch học cá nhân hóa mỗi ngày.

Input có thể gồm:

```text
Từ đến hạn hôm nay
Từ yếu
Lỗi gần đây
Ngữ pháp yếu
Study session gần đây
Trình độ hiện tại
Lịch sử học
Thời gian học có sẵn
```

Người dùng có thể nhập:

```text
Hôm nay tôi có 45 phút.
```

Ứng dụng có thể tạo:

```text
Today's Plan — 45 phút

English — 22 phút

5 phút
Ôn 8 từ quá hạn

7 phút
Học 5 từ mới

5 phút
Bài tập Past tense

5 phút
AI conversation

Chinese — 23 phút

7 phút
Ôn 12 từ

6 phút
Học 5 từ mới

5 phút
Bài tập lượng từ

5 phút
Luyện hội thoại
```

AI có thể hỗ trợ xây dựng kế hoạch.

Tuy nhiên các dữ liệu có tính xác định như:

```text
words due
weak words
review priority
```

phải được tính bởi ứng dụng.

Daily Plan nên kết hợp:

```text
Learning Engine
+
AI
```

thay vì dựa hoàn toàn vào AI.

---

# 5. Vòng lặp học tập cốt lõi

Luồng chính của ứng dụng:

```text
Mở ứng dụng
        ↓
Dashboard
        ↓
Today's Plan
        ↓
Ôn từ đến hạn
        ↓
Học từ mới / ngữ pháp
        ↓
Luyện với AI Tutor
        ↓
Phát hiện lỗi
        ↓
Lưu lỗi quan trọng
        ↓
Cập nhật tiến độ
        ↓
Dùng dữ liệu mới cho kế hoạch tiếp theo
```

Về mặt khái niệm:

```text
Learn
  ↓
Practice
  ↓
Review
  ↓
Evaluate
  ↓
Adapt
  ↓
Learn
```

Vòng lặp này là giá trị cốt lõi của hệ thống.

---

# 6. Domain model gợi ý

Các entity ban đầu có thể gồm:

```text
Language

Vocabulary
VocabularyTag

ReviewSchedule
ReviewHistory

Mistake
MistakeCategory

GrammarTopic

StudySession

DailyPlan
DailyPlanItem

AIConversation
AIMessage
```

Claude Code cần đánh giá xem có thực sự cần toàn bộ các entity này ngay từ đầu hay không.

Không nên tạo độ phức tạp quá sớm.

---

# 7. Kiến trúc AI

AI nên được trừu tượng hóa thông qua một service nội bộ.

Ví dụ:

```text
AIProvider
    |
    +-- ClaudeProvider
    |
    +-- OpenAIProvider
    |
    +-- GeminiProvider
```

Ứng dụng không nên phụ thuộc trực tiếp vào một provider trong toàn bộ business logic.

Các chức năng AI có thể gồm:

```text
explainGrammar()

generateExamples()

correctSentence()

analyzeMistake()

generateExercise()

generateDailyPlan()

conversation()
```

AI prompt nên nhận đủ context cần thiết.

Ví dụ:

```text
Language: Chinese

Current level:
HSK 2

Known vocabulary:
...

Weak grammar:
measure words
了

Recent mistakes:
...

Task:
Tạo một bài tập ngữ pháp trong 10 phút.
```

Không gửi toàn bộ database cho AI.

Chỉ lấy context liên quan.

---

# 8. Hướng kỹ thuật đề xuất

Backend ưu tiên:

```text
Java
Spring Boot
```

Database:

```text
PostgreSQL
```

Frontend:

```text
React
hoặc
Next.js
```

Dự án nên chạy local trước.

Có thể dùng:

```text
Docker
Docker Compose
```

cho môi trường local.

Vì đây là ứng dụng cá nhân:

- Authentication là optional trong MVP
- Không cần multi-user
- Không cần authorization phức tạp
- Không ưu tiên scale lớn
- Không cần microservices

Ưu tiên:

- Kiến trúc dễ bảo trì
- Domain rõ ràng
- Business logic dễ test
- SRS độc lập
- AI dễ thay provider
- Có thể mở rộng thêm ngôn ngữ

Ưu tiên modular monolith.

Không dùng microservices nếu chưa có lý do kỹ thuật rõ ràng.

---

# 9. MVP

Không triển khai tất cả ngay từ đầu.

Phiên bản MVP đầu tiên chỉ cần các màn hình chính sau.

## Screen 1 — Dashboard

```text
Today's reviews
Today's plan
English progress
Chinese progress
```

## Screen 2 — Vocabulary

```text
Add vocabulary
Edit vocabulary
Search vocabulary
View vocabulary
```

## Screen 3 — Review

```text
Show due vocabulary
Reveal answer
Again / Hard / Good / Easy
Update SRS
```

## Screen 4 — AI Tutor

```text
Ask questions
Grammar explanation
Sentence correction
Simple conversation
```

## Screen 5 — Progress

```text
Vocabulary count
Retention
Review history
Weak areas
```

Mistake Book và Daily Plan nâng cao có thể được mở rộng sau khi vòng lặp học tập cốt lõi hoạt động ổn định.

---

# 10. Thứ tự ưu tiên triển khai

Ưu tiên theo thứ tự:

```text
1. Project architecture
2. Language model
3. Vocabulary management
4. SRS / Review engine
5. Review history
6. Basic Dashboard
7. Study sessions
8. AI integration
9. Mistake Book
10. Progress analysis
11. AI-generated Daily Plan
12. Conversation improvements
```

Các phần quan trọng nhất:

```text
Vocabulary
+
Review / SRS
+
Learning history
```

Các phần này phải hoạt động tốt trước khi phụ thuộc nhiều vào AI.

---

# 11. Ngoài phạm vi dự án hiện tại

Không triển khai các chức năng sau nếu chưa được yêu cầu rõ ràng:

```text
Multi-user system
Social network
Friends
Leaderboard
Public profiles
Payment
Subscription
Course marketplace
Teacher accounts
Admin CMS
Achievements
Complex gamification
Video hosting
Live classes
Chat giữa người dùng
Mobile application
```

Không over-engineer.

Đây là một công cụ học cá nhân.

---

# 12. Các đặc điểm kiến trúc mong muốn

Implementation nên hướng tới:

- Kiến trúc đơn giản
- Domain boundary rõ ràng
- Code dễ bảo trì
- Business logic dễ test
- AI provider abstraction
- Hỗ trợ mở rộng ngôn ngữ
- SRS deterministic
- Lịch sử học được lưu bền vững
- Hạ tầng tối thiểu
- Không thêm dependency hoặc service nếu chưa có lý do thực tế

---

# 13. Yêu cầu dành cho Claude Code

Trước khi viết code:

1. Đọc toàn bộ tài liệu này.
2. Phân tích yêu cầu sản phẩm.
3. Xác định core domain model.
4. Xác định quan hệ giữa các entity.
5. Đề xuất kiến trúc backend.
6. Đề xuất kiến trúc frontend.
7. Thiết kế database schema.
8. Thiết kế API endpoints.
9. Đề xuất chiến lược SRS.
10. Xác định cách AI kết hợp với dữ liệu học deterministic.
11. Tách rõ MVP và các chức năng mở rộng.
12. Xác định technical risk.
13. Xác định các requirement còn chưa rõ.
14. Tạo implementation roadmap thành các milestone nhỏ.

Không bắt đầu code toàn bộ ứng dụng ngay.

Trước tiên phải tạo một kế hoạch kỹ thuật chi tiết.

Kế hoạch cần bao gồm:

```text
Architecture
Domain model
Database schema
API design
Frontend pages / components
AI integration strategy
SRS implementation
Testing strategy
Project folder structure
Development milestones
```

Với mỗi milestone, cần mô tả:

```text
Goal
Features
Backend work
Frontend work
Database changes
Tests
Definition of Done
```

Ưu tiên phát triển theo từng bước nhỏ.

Sau mỗi milestone, ứng dụng nên ở trạng thái chạy được.

---

# 14. Mục tiêu cuối cùng

Mục tiêu của dự án không phải là xây dựng một nền tảng học ngoại ngữ có nhiều chức năng nhất.

Mục tiêu là:

> Xây dựng một hệ thống học tập cá nhân đơn giản nhưng thông minh, có khả năng liên tục hiểu tôi đã biết gì, đang quên gì, đang yếu phần nào và nên học gì tiếp theo.
