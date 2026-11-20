import type { AuthResponse, User } from '@/types/domain'

export const MOCK_USER: User = {
  id: 1,
  email: 'learner@learnflow.app',
  displayName: 'Minh Hiếu (Demo)',
}

export const MOCK_AUTH_RESPONSE: AuthResponse = {
  token: 'mock-jwt-token-learnflow-demo',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  user: MOCK_USER,
}
