import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as authApi from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useAuth() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => setAuth(data.token, data.user),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => setAuth(data.token, data.user),
  })

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (data) => setAuth(data.token, data.user),
  })

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      // Sign out locally even if the server is unreachable; drop the previous user's cached data.
      clearAuth()
      queryClient.clear()
    }
  }

  return {
    isAuthenticated: status === 'authenticated',
    user,
    register: registerMutation,
    login: loginMutation,
    changePassword: changePasswordMutation,
    logout,
  }
}
