import type {
  ConversationDetail,
  ConversationSummaryResult,
  Scenario,
  SentenceCorrectionResult,
} from '@/api/ai'

export const MOCK_SCENARIOS_BY_LANG: Record<string, Scenario[]> = {
  en: [
    { code: 'cafe_london', label: '☕ Ordering Coffee & Breakfast at a London Café' },
    { code: 'airport_checkin', label: '✈️ Checking in at JFK International Airport' },
    { code: 'job_interview', label: '💼 Casual Introduction for a Tech Job Interview' },
    { code: 'hotel_booking', label: '🏨 Asking for Room Recommendations at Hotel Reception' },
    { code: 'daily_talk_en', label: '💬 Friendly Weekend Chit-chat with a Native Speaker' },
  ],
  zh: [
    { code: 'dimsum_order', label: '🥟 点心早茶 (Ordering Dim Sum at a Tea House)' },
    { code: 'beijing_directions', label: '🚆 地铁换乘 (Asking Directions at Beijing Metro)' },
    { code: 'convenience_store_cn', label: '🏪 便利店买零食 (Buying Drinks & Snacks at Store)' },
    { code: 'self_intro_cn', label: '🤝 结识新朋友 (First Day Self Introduction in Class)' },
    { code: 'daily_talk_cn', label: '☕ 周末闲聊 (Casual Weekend Chat with a Chinese Friend)' },
  ],
  ja: [
    { code: 'ramen_order', label: '🍜 一蘭ラーメン (Ordering Ramen at Ichiran Tokyo)' },
    { code: 'shinjuku_station', label: '🚆 新宿駅 (Asking for Directions at Shinjuku Station)' },
    { code: 'convenience_store_jp', label: '🏪 ローソン (Purchasing Snacks at Lawson)' },
    { code: 'self_intro_jp', label: '🤝 自己紹介 (First Day Meeting in Japanese Class)' },
    {
      code: 'daily_talk_jp',
      label: '☕ 週末の会話 (Casual Weekend Chit-chat with a Japanese Friend)',
    },
  ],
}

export const MOCK_SCENARIOS: Scenario[] = MOCK_SCENARIOS_BY_LANG.en

export const MOCK_GRAMMAR_EXPLANATIONS: Record<string, string> = {
  default: `Here is a clear breakdown of the grammar pattern you asked about:

1. **Structure & Pattern:**
   - **Pattern:** [Subject] + [Auxiliary / Marker] + [Predicate Phrase]
   - Used to clarify relationships between topics, actions, and specific contexts.

2. **Key Nuance & Comparisons:**
   - Notice how emphasis shifts depending on particle or preposition choice.
   - Using natural connectors makes your speech sound much more fluent and authentic.

3. **Authentic Examples:**
   - **English:** "I have lived here *since* 2020." (Marks the specific starting point in time)
   - **Chinese:** "我是去年**来**这里的。" (Emphasizes the time of the action with 是...的)
   - **Japanese:** "富士山**は**高いです。" (Marks topic with は vs. focused subject with が)

💡 **Coach Tip:** Try repeating these example sentences aloud once or twice to build natural muscle memory!`,
}

export const MOCK_SENTENCE_CORRECTION: SentenceCorrectionResult = {
  corrected: 'Yesterday, I went out for dinner with my close friends.',
  explanation:
    'Your sentence was understandable! To sound more natural and native, we polished the verb tense ("went" instead of "go") and used "went out for dinner" which flows smoothly in everyday conversation.',
  suggestedCategory: 'Past Tense & Collocations',
  suggestedTopic: 'Everyday Dining & Social Outings',
}

export const MOCK_INITIAL_CONVERSATIONS: ConversationDetail[] = [
  {
    conversationId: 101,
    language: { id: 1, code: 'en', name: 'English' },
    scenario: '☕ Ordering Coffee & Breakfast at a London Café',
    startedAt: '2026-11-19T10:30:00Z',
    endedAt: null,
    summary: null,
    messages: [
      {
        role: 'ASSISTANT',
        content:
          'Good morning! Welcome to the café. What can I get started for you today? We have freshly brewed flat whites and warm croissants!',
        createdAt: '2026-11-19T10:30:05Z',
      },
      {
        role: 'USER',
        content: 'Hi! Could I please get an oat milk latte and an almond croissant?',
        createdAt: '2026-11-19T10:31:00Z',
      },
      {
        role: 'ASSISTANT',
        content:
          'Lovely choice! Would you like that for here or takeaway? And would you like the croissant warmed up for you?',
        createdAt: '2026-11-19T10:31:15Z',
      },
    ],
  },
]

export const MOCK_CONVERSATION_SUMMARY: ConversationSummaryResult = {
  conversationId: 101,
  overview:
    'Outstanding session! You expressed your thoughts clearly and naturally with great confidence. Keep up the regular daily practice!',
  mistakes: [
    {
      category: 'Verb Tense & Nuance',
      topic: 'Past tense vs Present tense',
      original: 'Yesterday I go to the café',
      corrected: 'Yesterday I went to the café',
      explanation: 'Use past tense "went" for completed past actions.',
    },
  ],
  suggestedVocabulary: [
    { word: 'Takeaway', meaningVietnamese: 'Đồ ăn mang đi' },
    { word: 'Flat white', meaningVietnamese: 'Cà phê sữa bọt mịn' },
    { word: 'Brewed', meaningVietnamese: 'Được pha chế' },
  ],
  betterExpressions: ['Could I please get... (Polite request)', 'I would love to try the special!'],
  grammarProblems: ['Minor tense consistency when describing past events'],
  endedAt: '2026-11-19T10:35:00Z',
}
