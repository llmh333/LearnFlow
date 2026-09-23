import { useMutation } from '@tanstack/react-query'
import * as authApi from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useAuth() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => setAuth(data.token, data.user),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => setAuth(data.token, data.user),
  })

  return {
    isAuthenticated: Boolean(token),
    user,
    register: registerMutation,
    login: loginMutation,
    logout: clearAuth,
  }
}
