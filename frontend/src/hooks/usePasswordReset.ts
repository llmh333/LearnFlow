import { useMutation } from '@tanstack/react-query'
import * as authApi from '@/api/auth'

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: (email: string) => authApi.requestPasswordReset(email) })
}

export function useVerifyPasswordReset() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authApi.verifyPasswordReset(email, code),
  })
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (payload: authApi.ConfirmPasswordResetPayload) =>
      authApi.confirmPasswordReset(payload),
  })
}
