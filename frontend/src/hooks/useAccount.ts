import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as accountApi from '@/api/account'

export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
}

export function useProfile(enabled = true) {
  return useQuery({ queryKey: accountKeys.profile(), queryFn: accountApi.fetchProfile, enabled })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountApi.updateProfile,
    onSuccess: (profile) => queryClient.setQueryData(accountKeys.profile(), profile),
  })
}
