import type { LevelCount, WordDetail, WordSummary } from '@/types/domain'

export const MOCK_CONTENT_SOURCE = {
  key: 'jmdict',
  name: 'JMdict (EDRDG)',
  url: 'https://www.edrdg.org/jmdict/j_jmdict.html',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://www.edrdg.org/edrdg/licence.html',
  attribution: 'Electronic Dictionary Research and Development Group',
}

export const MOCK_WORDS: WordDetail[] = [
  {
    id: 1,
    written: '学生',
    reading: 'がくせい',
    meaningsVi: ['học sinh', 'sinh viên'],
    meaningsEn: ['student'],
    partOfSpeech: ['n'],
    level: 'N5',
    note: 'Thường dùng cho học sinh cấp 3 và sinh viên đại học.',
    examples: [
      {
        text: '私は大学の学生です。',
        reading: 'わたしはだいがくのがくせいです。',
        translationVi: 'Tôi là sinh viên đại học.',
        sourceAuthor: 'LearnFlow Core',
      },
      {
        text: '彼はまじめな学生です。',
        reading: 'かれはまじめながくせいです。',
        translationVi: 'Anh ấy là một học sinh chăm chỉ.',
        sourceAuthor: 'Tatoeba Project',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 2,
    written: '先生',
    reading: 'せんせい',
    meaningsVi: ['thầy giáo', 'cô giáo', 'bác sĩ'],
    meaningsEn: ['teacher', 'doctor', 'master'],
    partOfSpeech: ['n'],
    level: 'N5',
    note: 'Hậu tố tôn xưng khi xưng hô với thầy cô giáo, bác sĩ, luật sư.',
    examples: [
      {
        text: '日本語の先生に質問しました。',
        reading: 'にほんごのせんせいにしつもんしました。',
        translationVi: 'Tôi đã đặt câu hỏi cho giáo viên tiếng Nhật.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 3,
    written: '食べる',
    reading: 'たべる',
    meaningsVi: ['ăn'],
    meaningsEn: ['to eat'],
    partOfSpeech: ['v1'],
    level: 'N5',
    note: 'Động từ nhóm 2 (Ichidan verb). Dạng lịch sự: 食べます.',
    examples: [
      {
        text: '朝御飯にパンを食べます。',
        reading: 'あさごはんにパンをたべます。',
        translationVi: 'Tôi ăn bánh mì vào bữa sáng.',
        sourceAuthor: 'LearnFlow Core',
      },
      {
        text: '寿司を食べたことがありますか。',
        reading: 'すしをたべたことがありますか。',
        translationVi: 'Bạn đã từng ăn sushi chưa?',
        sourceAuthor: 'Tatoeba Project',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 4,
    written: '飲む',
    reading: 'のむ',
    meaningsVi: ['uống'],
    meaningsEn: ['to drink'],
    partOfSpeech: ['v5m'],
    level: 'N5',
    note: 'Động từ nhóm 1 (Godan verb). Dạng lịch sự: 飲みます.',
    examples: [
      {
        text: '温かいお茶を飲みましょう。',
        reading: 'あたたかいおちゃをのみましょう。',
        translationVi: 'Chúng ta hãy uống trà nóng nhé.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 5,
    written: '猫',
    reading: 'ねこ',
    meaningsVi: ['con mèo'],
    meaningsEn: ['cat'],
    partOfSpeech: ['n'],
    level: 'N5',
    note: 'Thú cưng phổ biến ở Nhật Bản.',
    examples: [
      {
        text: '庭に小さな猫がいます。',
        reading: 'にわにちいさなねこがいます。',
        translationVi: 'Có một chú mèo nhỏ ở trong sân.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 6,
    written: '犬',
    reading: 'いぬ',
    meaningsVi: ['con chó'],
    meaningsEn: ['dog'],
    partOfSpeech: ['n'],
    level: 'N5',
    note: 'Động từ đi kèm: 散歩する (dắt chó đi dạo).',
    examples: [
      {
        text: '毎朝、犬と散歩します。',
        reading: 'まいあさ、いぬとさんぽします。',
        translationVi: 'Mỗi sáng tôi đều đi dạo với chú chó.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 7,
    written: '友達',
    reading: 'ともだち',
    meaningsVi: ['bạn bè', 'người bạn'],
    meaningsEn: ['friend', 'companion'],
    partOfSpeech: ['n'],
    level: 'N5',
    note: 'Cách nói thân mật: 友 (とも) hoặc 友人 (ゆうじん - trang trọng).',
    examples: [
      {
        text: '週末に友達と映画を見に行きました。',
        reading: 'しゅうまつにともだちとえいがをみにいきました。',
        translationVi: 'Cuối tuần tôi đã đi xem phim cùng bạn bè.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 8,
    written: '勉強する',
    reading: 'べんきょうする',
    meaningsVi: ['học tập', 'nghiên cứu'],
    meaningsEn: ['to study'],
    partOfSpeech: ['vs'],
    level: 'N5',
    note: 'Động từ nhóm 3 (Suru verb).',
    examples: [
      {
        text: '毎日２時間日本語を勉強します。',
        reading: 'まいにちにじかんにほんごをべんきょうします。',
        translationVi: 'Mỗi ngày tôi học tiếng Nhật 2 tiếng.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 9,
    written: '案内する',
    reading: 'あんないする',
    meaningsVi: ['hướng dẫn', 'dẫn đường'],
    meaningsEn: ['to guide', 'to show around'],
    partOfSpeech: ['vs'],
    level: 'N4',
    note: 'Động từ nhóm 3 (Suru verb).',
    examples: [
      {
        text: '東京の街を案内してあげます。',
        reading: 'とうきょうのまちをあんないしてあげます。',
        translationVi: 'Tôi sẽ dẫn đường cho bạn đi dạo phố Tokyo.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 10,
    written: '複雑',
    reading: 'ふくざつ',
    meaningsVi: ['phức tạp', 'rắc rối'],
    meaningsEn: ['complex', 'complicated'],
    partOfSpeech: ['adj-na'],
    level: 'N4',
    note: 'Tính từ đuôi な. Trái nghĩa: 単純 (たんじゅん - đơn giản).',
    examples: [
      {
        text: 'この文法規則は少し複雑です。',
        reading: 'このぶんぽうきそくはすこしふくざつです。',
        translationVi: 'Quy tắc ngữ pháp này hơi phức tạp một chút.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
  {
    id: 11,
    written: '遠慮する',
    reading: 'えんりょする',
    meaningsVi: ['ngại ngần', 'khách khí', 'kiềm chế'],
    meaningsEn: ['to hesitate', 'to hold back', 'to refrain'],
    partOfSpeech: ['vs'],
    level: 'N3',
    note: 'Thường dùng trong câu: 遠慮しないでください (Đừng ngại nhé).',
    examples: [
      {
        text: 'どうぞ遠慮しないでたくさん召し上がってください。',
        reading: 'どうぞえんりょしないでたくさんめしあがってください。',
        translationVi: 'Xin mời cứ tự nhiên dùng nhiều vào nhé, đừng ngại ngùng.',
        sourceAuthor: 'LearnFlow Core',
      },
    ],
    source: MOCK_CONTENT_SOURCE,
  },
]

export const MOCK_LEVEL_COUNTS: LevelCount[] = [
  { level: 'N5', name: 'JLPT N5', wordCount: 718 },
  { level: 'N4', name: 'JLPT N4', wordCount: 667 },
  { level: 'N3', name: 'JLPT N3', wordCount: 0 },
  { level: 'N2', name: 'JLPT N2', wordCount: 0 },
  { level: 'N1', name: 'JLPT N1', wordCount: 0 },
]

export function toWordSummary(detail: WordDetail): WordSummary {
  return {
    id: detail.id,
    written: detail.written,
    reading: detail.reading,
    meaningsVi: detail.meaningsVi,
    partOfSpeech: detail.partOfSpeech,
    level: detail.level,
  }
}
