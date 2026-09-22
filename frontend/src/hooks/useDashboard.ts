import { useQuery } from '@tanstack/react-query'
import * as dashboardApi from '@/api/dashboard'

export const dashboardKeys = {
  today: ['dashboard', 'today'] as const,
}

export function useDashboardToday() {
  return useQuery({ queryKey: dashboardKeys.today, queryFn: dashboardApi.fetchDashboardToday })
}
