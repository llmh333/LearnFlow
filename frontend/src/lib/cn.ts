/** Joins truthy class name fragments. Intentionally dependency-free — see AGENTS.md §1.5. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
