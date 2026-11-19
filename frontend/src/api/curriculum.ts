import { apiFetch } from './client'
import type { ContentSource, Course } from '@/types/domain'

export function fetchContentSources(): Promise<ContentSource[]> {
  return apiFetch<ContentSource[]>('/curriculum/sources')
}

export function fetchCourses(): Promise<Course[]> {
  return apiFetch<Course[]>('/curriculum/courses')
}
