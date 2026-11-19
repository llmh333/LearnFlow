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
/** A data source and its licence, shown on the public /sources page. */
export interface ContentSource {
  key: string
  name: string
  url?: string
  license: string
  licenseUrl?: string
  attribution?: string
}

export type LearningGoal = 'JLPT' | 'CONVERSATION' | 'TRAVEL'

/** Mirrors backend account.dto.ProfileResponse. */
export interface Profile {
  timezone: string
  goal: LearningGoal | null
  dailyMinutes: number
  dailyNewItems: number
  onboardedAt: string | null
}

export type ProfileUpdate = Partial<Omit<Profile, 'onboardedAt'>>

/** Mirrors backend HealthController.HealthResponse. */
export interface HealthResponse {
  status: string
  time: string
}

/** Curriculum models matching backend CourseResponse. */
export type CourseLevel =
  'KANA' | 'N5' | 'N4' | 'N3' | 'A1' | 'A2' | 'B1' | 'B2' | 'HSK1' | 'HSK2' | 'HSK3' | string
export type ContentStatus = 'DRAFT' | 'REVIEWED'

export interface LessonSummary {
  id: number
  key: string
  position: number
  title: string
  status: ContentStatus
  itemCount: number
}

export interface Unit {
  id: number
  key: string
  position: number
  title: string
  description: string
  status: ContentStatus
  lessons: LessonSummary[]
}

export interface Course {
  id: number
  key: string
  language: string
  level: CourseLevel
  title: string
  description: string
  status: ContentStatus
  units: Unit[]
}

export interface ExamplesResponse {
  examples: string[]
}
