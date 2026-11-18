import { apiFetch } from './client'
import type { Profile, ProfileUpdate } from '@/types/domain'

export function fetchProfile(): Promise<Profile> {
  return apiFetch<Profile>('/account/profile')
}

export function updateProfile(update: ProfileUpdate): Promise<Profile> {
  return apiFetch<Profile>('/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(update),
  })
}
