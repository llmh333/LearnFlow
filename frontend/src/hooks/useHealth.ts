import { useQuery } from '@tanstack/react-query'
import * as healthApi from '@/api/health'

export const healthKeys = {
  health: ['health'] as const,
}

/**
 * Periodically polls the backend /api/v1/health endpoint to detect connectivity.
 */
export function useHealth(enabled = true) {
  return useQuery({
    queryKey: healthKeys.health,
    queryFn: healthApi.fetchHealth,
    enabled,
    refetchInterval: 30_000,
    retry: false,
  })
}
