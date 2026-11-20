import { apiFetch } from './client'
import type { HealthResponse } from '@/types/domain'

/**
 * Checks backend service availability via GET /api/v1/health.
 */
export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health')
}
