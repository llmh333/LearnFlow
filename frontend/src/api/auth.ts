import { apiFetch } from './client'
import type { AuthResponse, User } from '@/types/domain'

export interface RegisterPayload {
  email: string
  password: string
  displayName: string
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
