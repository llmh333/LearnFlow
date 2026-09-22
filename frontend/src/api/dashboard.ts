import { apiFetch } from './client'
import type { DashboardToday } from '@/types/domain'

export function fetchDashboardToday(): Promise<DashboardToday> {
  return apiFetch<DashboardToday>('/dashboard/today')
}
