import { useQuery } from '@tanstack/react-query'
import * as curriculumApi from '@/api/curriculum'

export const curriculumKeys = {
  all: ['curriculum'] as const,
  sources: () => [...curriculumKeys.all, 'sources'] as const,
  courses: () => [...curriculumKeys.all, 'courses'] as const,
}

export function useContentSources() {
  return useQuery({
    queryKey: curriculumKeys.sources(),
    queryFn: curriculumApi.fetchContentSources,
  })
}

export function useCourses() {
  return useQuery({
    queryKey: curriculumKeys.courses(),
    queryFn: curriculumApi.fetchCourses,
  })
}
