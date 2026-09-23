import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 transition-all duration-150 focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20',
        className,
      )}
      {...props}
    />
  )
}
