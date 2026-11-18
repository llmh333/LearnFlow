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
