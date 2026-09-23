import { create } from 'zustand'

export type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem('learnflow_theme') as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  } catch {
    // ignore storage or matchMedia errors in tests/ssr
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
    localStorage.setItem('learnflow_theme', theme)
  } catch {
    // ignore storage errors
  }
}

interface UiState {
  selectedLanguageCode: string
  setSelectedLanguageCode: (code: string) => void
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const initialTheme = getInitialTheme()
if (typeof document !== 'undefined') {
  applyTheme(initialTheme)
}

/** UI-only state (not server state): selected language and color theme (light/dark). */
export const useUiStore = create<UiState>((set) => ({
  selectedLanguageCode: 'en',
  setSelectedLanguageCode: (code) => set({ selectedLanguageCode: code }),
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
