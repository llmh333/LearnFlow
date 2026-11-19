import { apiFetch } from './client'
import type { AuthResponse, User } from '@/types/domain'

export interface RegisterPayload {
  email: string
  password: string
  confirmPassword?: string
  displayName: string
  /** IANA zone from the browser; the backend computes "today" with it (D7). */
  timezone: string
}

export interface LoginPayload {
  email: string
  password: string
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchMe(): Promise<User> {
  return apiFetch<User>('/auth/me')
}

/** Revokes the refresh cookie on the server and clears it in the browser. */
export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' })
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

/** Signs out every other device; the response is a fresh session for this one. */
export function changePassword(payload: ChangePasswordPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
