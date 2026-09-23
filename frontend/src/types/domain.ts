export interface User {
  id: number
  email: string
  displayName: string
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

/** Mirrors Spring's RFC 7807 ProblemDetail, see plan/phases/00-overview.md §1.2. */
export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string>
}

export interface Language {
  id: number
  code: string
  name: string
}

/** Whitelisted attribute keys per language (D9), enforced backend-side by VocabularyAttributesValidator. */
export interface EnglishAttributes {
  ipa?: string
  partOfSpeech?: string
  cefrLevel?: string
  collocations?: string[]
}

export interface ChineseAttributes {
  pinyin?: string
  hskLevel?: number
  examplePinyin?: string
  measureWord?: string
}

export interface JapaneseAttributes {
  reading?: string
  exampleReading?: string
  partOfSpeech?: string
  jlptLevel?: string
}

export interface Vocabulary {
  id: number
  language: Language
  word: string
  /** Always Vietnamese, regardless of the language being studied (decision D10). */
  meaning: string
  example: string | null
  difficulty: number
  tags: string[]
  attributes: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type SrsRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

export interface DueVocabulary {
  vocabularyId: number
  language: Language
  word: string
  meaning: string
  example: string | null
  attributes: Record<string, unknown>
  nextReview: string
  reviewCount: number
  memoryStrength: number
}

export interface ReviewSubmitResult {
  vocabularyId: number
  lastReview: string | null
  nextReview: string
  intervalDays: number
  easeFactor: number
  reviewCount: number
  successCount: number
  failureCount: number
  memoryStrength: number
}

export interface ReviewHistoryEntry {
  id: number
  reviewedAt: string
  rating: SrsRating
  previousInterval: number | null
  newInterval: number | null
  responseTimeMs: number | null
}

export interface StudySession {
  id: number
  language: Language | null
  startedAt: string
  endedAt: string | null
  wordsReviewed: number
  wordsLearned: number
  mistakesCount: number
}

export interface LanguageTodaySummary {
  language: Language
  dueCount: number
  newCount: number
  knownWords: number
  retentionPercent: number
  estimatedMinutes: number
}

export interface DashboardToday {
  languages: LanguageTodaySummary[]
  totalEstimatedMinutes: number
  streakDays: number
}

export interface ProgressSummary {
  total: number
  newCount: number
  learningCount: number
  masteredCount: number
  dueCount: number
}

export interface Retention {
  successCount: number
  totalCount: number
  ratePercent: number
}

export interface WeakArea {
  vocabularyId: number
  word: string
  meaning: string
  easeFactor: number
  reviewCount: number
  failureCount: number
}

export interface DailyPlanItem {
  id: number
  languageCode: string | null
  minutes: number
  kind: 'REVIEW_DUE' | 'LEARN_NEW' | 'GRAMMAR_EXERCISE' | 'CONVERSATION'
  description: string
  completed: boolean
}

export interface DailyPlan {
  id: number
  planDate: string
  availableMinutes: number
  intro: string | null
  items: DailyPlanItem[]
}
