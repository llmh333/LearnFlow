import { create } from 'zustand'

interface UiState {
  selectedLanguageCode: string
  setSelectedLanguageCode: (code: string) => void
}

/** UI-only state (not server state): the language currently selected across domain pages. */
export const useUiStore = create<UiState>((set) => ({
  selectedLanguageCode: 'en',
  setSelectedLanguageCode: (code) => set({ selectedLanguageCode: code }),
}))
