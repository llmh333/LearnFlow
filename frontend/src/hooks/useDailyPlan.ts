import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as dailyPlanApi from '@/api/dailyPlan'

export const dailyPlanKeys = {
  today: ['daily-plan', 'today'] as const,
}

export function useTodayPlan() {
  return useQuery({ queryKey: dailyPlanKeys.today, queryFn: dailyPlanApi.fetchTodayPlan })
}

export function useGenerateDailyPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dailyPlanApi.generateDailyPlan,
    onSuccess: (plan) => queryClient.setQueryData(dailyPlanKeys.today, plan),
  })
}

export function useUpdatePlanItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, completed }: { itemId: number; completed: boolean }) =>
      dailyPlanApi.updatePlanItem(itemId, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dailyPlanKeys.today }),
  })
}
