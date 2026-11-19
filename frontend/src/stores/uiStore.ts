import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'learnflow_theme'
const LEVELS_KEY = 'learnflow_user_levels'
const ONBOARDED_KEY = 'learnflow_onboarded'

export const DEFAULT_USER_LEVELS: Record<string, string> = {
  en: 'B1',
  zh: 'HSK 2',
  ja: 'N5',
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  } catch {
    // ignore storage or matchMedia errors
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignore
  }
}

function getInitialLevels(): Record<string, string> {
  if (typeof window === 'undefined') return DEFAULT_USER_LEVELS
  try {
    const raw = localStorage.getItem(LEVELS_KEY)
    if (raw) {
      return { ...DEFAULT_USER_LEVELS, ...JSON.parse(raw) }
    }
  } catch {
    // ignore parse error
  }
  return DEFAULT_USER_LEVELS
}

function getInitialOnboarded(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = localStorage.getItem(ONBOARDED_KEY)
    if (raw !== null) {
      return raw === 'true'
    }
  } catch {
    // ignore
  }
  return false
}

interface UiState {
  selectedLanguageCode: string
  setSelectedLanguageCode: (code: string) => void
  userLevels: Record<string, string>
  setUserLevel: (langCode: string, level: string) => void
  isOnboarded: boolean
  setOnboarded: (onboarded: boolean) => void
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const initialTheme = getInitialTheme()
if (typeof document !== 'undefined') {
  applyTheme(initialTheme)
}

/** UI-only state (not server state): selected language, course levels, onboarding flag, and theme. */
export const useUiStore = create<UiState>((set) => ({
  selectedLanguageCode: 'en',
  setSelectedLanguageCode: (code) => set({ selectedLanguageCode: code }),
  userLevels: getInitialLevels(),
  setUserLevel: (langCode, level) =>
    set((state) => {
      const nextLevels = { ...state.userLevels, [langCode]: level }
      try {
        localStorage.setItem(LEVELS_KEY, JSON.stringify(nextLevels))
      } catch {
        // ignore
      }
      return { userLevels: nextLevels }
    }),
  isOnboarded: getInitialOnboarded(),
  setOnboarded: (onboarded) => {
    try {
      localStorage.setItem(ONBOARDED_KEY, onboarded ? 'true' : 'false')
    } catch {
      // ignore
    }
    set({ isOnboarded: onboarded })
  },
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
}))
