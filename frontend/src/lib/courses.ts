import type { LearningGoal } from '@/types/domain'

export interface LevelDefinition {
  code: string
  name: string
  description: string
  pillColor: string
}

export interface CourseDefinition {
  code: string
  name: string
  nativeName: string
  flag: string
  tagline: string
  description: string
  defaultLevel: string
  levels: LevelDefinition[]
}

export const COURSES: CourseDefinition[] = [
  {
    code: 'en',
    name: 'English (Tiếng Anh)',
    nativeName: 'English',
    flag: '🇬🇧',
    tagline: 'Toàn cầu • Công việc • Du học',
    description: 'Phát triển phản xạ tự nhiên, ngữ pháp chuẩn xác và từ vựng phong phú.',
    defaultLevel: 'B1',
    levels: [
      {
        code: 'A1',
        name: 'Newbie / Mất gốc',
        description: 'Bắt đầu từ con số 0, làm quen phát âm và từ vựng thông dụng nhất.',
        pillColor:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
      },
      {
        code: 'A2',
        name: 'Elementary / Sơ cấp',
        description: 'Nắm chắc ngữ pháp nền tảng, đối thoại trong các tình huống ngắn đơn giản.',
        pillColor:
          'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700',
      },
      {
        code: 'B1',
        name: 'Intermediate / Trung cấp',
        description: 'Giao tiếp đời sống tự tin, đọc hiểu bài viết và viết email cơ bản.',
        pillColor:
          'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700',
      },
      {
        code: 'B2',
        name: 'Upper Intermediate',
        description: 'Thảo luận sâu về chủ đề chuyên môn, công việc và học thuật.',
        pillColor:
          'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700',
      },
      {
        code: 'C1',
        name: 'Advanced / Thành thạo',
        description: 'Phản xạ linh hoạt, biểu đạt tinh tế như người bản ngữ.',
        pillColor:
          'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700',
      },
    ],
  },
  {
    code: 'zh',
    name: 'Chinese (Tiếng Trung)',
    nativeName: '中文 (普通话)',
    flag: '🇨🇳',
    tagline: 'Pinyin • Hán tự • HSK Chuẩn',
    description: 'Nắm vững 4 thanh điệu, quy tắc viết Hán tự và phản xạ giao tiếp đời sống.',
    defaultLevel: 'HSK 2',
    levels: [
      {
        code: 'HSK 1',
        name: 'HSK 1 - Nhập môn',
        description: 'Làm quen Pinyin, 4 thanh điệu và ~150 từ vựng căn bản nhất.',
        pillColor:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
      },
      {
        code: 'HSK 2',
        name: 'HSK 2 - Sơ cấp',
        description: 'Giao tiếp mua sắm, hỏi đường, gọi món ăn, tích lũy ~300 từ vựng.',
        pillColor:
          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
      },
      {
        code: 'HSK 3',
        name: 'HSK 3 - Trung cấp 1',
        description: 'Đàm thoại sinh hoạt và công việc thông thường, ~600 từ vựng.',
        pillColor:
          'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700',
      },
      {
        code: 'HSK 4',
        name: 'HSK 4 - Trung cấp 2',
        description: 'Đọc hiểu báo chí ngắn, thuyết trình tự tin, ~1200 từ vựng.',
        pillColor:
          'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700',
      },
      {
        code: 'HSK 5+',
        name: 'HSK 5+ - Cao cấp',
        description: 'Xem phim không phụ đề, đàm phán thương mại chuyên nghiệp.',
        pillColor:
          'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700',
      },
    ],
  },
  {
    code: 'ja',
    name: 'Japanese (Tiếng Nhật)',
    nativeName: '日本語',
    flag: '🇯🇵',
    tagline: 'Kana • Kanji • JLPT',
    description: 'Học chắc Hiragana, Katakana, Hán tự Kanji và phản xạ ngữ pháp chuẩn Nhật.',
    defaultLevel: 'N5',
    levels: [
      {
        code: 'N5',
        name: 'JLPT N5 - Nhập môn',
        description: 'Hai bảng chữ cái Kana, ~100 Kanji cơ bản và chào hỏi thường nhật.',
        pillColor:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
      },
      {
        code: 'N4',
        name: 'JLPT N4 - Sơ cấp',
        description: 'Ngữ pháp thể cơ bản, nghe hiểu đối thoại quen thuộc, ~300 Kanji.',
        pillColor:
          'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700',
      },
      {
        code: 'N3',
        name: 'JLPT N3 - Trung cấp',
        description: 'Đọc hiểu bài viết sinh hoạt, tự nhiên trong công việc, ~650 Kanji.',
        pillColor:
          'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700',
      },
      {
        code: 'N2',
        name: 'JLPT N2 - Trung cao cấp',
        description: 'Đọc tin tức thời sự, làm việc và sinh sống tự lập tại Nhật.',
        pillColor:
          'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700',
      },
      {
        code: 'N1',
        name: 'JLPT N1 - Cao cấp',
        description: 'Nắm vững các cấu trúc ngữ pháp trừu tượng, tương đương người bản xứ.',
        pillColor:
          'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700',
      },
    ],
  },
]

export const COURSES_BY_CODE: Record<string, CourseDefinition> = COURSES.reduce(
  (acc, c) => ({ ...acc, [c.code]: c }),
  {},
)

export interface GoalOption {
  goal: LearningGoal
  title: string
  subtitle: string
  iconEmoji: string
  description: string
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    goal: 'CONVERSATION',
    title: 'Giao tiếp hàng ngày',
    subtitle: 'Nói tự tin • Tự nhiên • Không sợ sai',
    iconEmoji: '💬',
    description: 'Rèn luyện phản xạ hội thoại, phát âm chuẩn và các mẫu câu thông dụng nhất.',
  },
  {
    goal: 'TRAVEL',
    title: 'Du lịch & Trải nghiệm',
    subtitle: 'Khám phá văn hóa • Đi lại tự tin',
    iconEmoji: '✈️',
    description: 'Hỏi đường, gọi món ăn, đi tàu xe, check-in khách sạn và mua sắm dễ dàng.',
  },
  {
    goal: 'JLPT',
    title: 'Thi chứng chỉ & Sự nghiệp',
    subtitle: 'IELTS / HSK / JLPT • Đi làm & Du học',
    iconEmoji: '🎓',
    description:
      'Chinh phục các cấp bậc chứng chỉ quốc tế và mở rộng cơ hội phát triển nghề nghiệp.',
  },
]

export interface DailyTargetOption {
  minutes: number
  label: string
  tagline: string
  recommended?: boolean
}

export const DAILY_TARGET_OPTIONS: DailyTargetOption[] = [
  { minutes: 5, label: '5 phút / ngày', tagline: 'Nhẹ nhàng • Dễ duy trì' },
  { minutes: 10, label: '10 phút / ngày', tagline: 'Đều đặn • Rất hiệu quả', recommended: true },
  { minutes: 15, label: '15 phút / ngày', tagline: 'Tăng tốc • Tiến bộ nhanh' },
  { minutes: 20, label: '20 phút / ngày', tagline: 'Bứt phá • Chuyên sâu' },
]
