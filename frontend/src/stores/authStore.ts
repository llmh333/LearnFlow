import { create } from 'zustand'
import type { User } from '@/types/domain'

/**
 * - `unknown`: page just loaded; the refresh cookie (if any) has not been tried yet.
 * - `authenticated`: an access token is in memory.
 * - `anonymous`: no session (refresh failed, logged out).
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous'

interface AuthState {
  /** Access token, memory only (never localStorage), so injected scripts cannot lift it from storage. */
  token: string | null
  user: User | null
  status: AuthStatus
  setAuth: (token: string, user: User) => void
  updateUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  status: 'unknown',
  setAuth: (token, user) => set({ token, user, status: 'authenticated' }),
  updateUser: (user) => set({ user }),
  clearAuth: () => set({ token: null, user: null, status: 'anonymous' }),
}))

// Older builds persisted the token here; remove it so it does not linger in storage.
try {
  localStorage.removeItem('learnflow-auth')
} catch {
  // storage unavailable (private mode, tests) — nothing to clean
}
