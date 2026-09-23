import { apiFetch, ApiError } from './client'
import type { DailyPlan, DailyPlanItem } from '@/types/domain'

export function generateDailyPlan(availableMinutes: number): Promise<DailyPlan> {
  return apiFetch<DailyPlan>('/daily-plan/generate', {
    method: 'POST',
    body: JSON.stringify({ availableMinutes }),
  })
}

export async function fetchTodayPlan(): Promise<DailyPlan | null> {
  try {
    return await apiFetch<DailyPlan>('/daily-plan/today')
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export function updatePlanItem(itemId: number, completed: boolean): Promise<DailyPlanItem> {
  return apiFetch<DailyPlanItem>(`/daily-plan/item/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  })
}
