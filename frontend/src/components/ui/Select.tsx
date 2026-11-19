import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full rounded-2xl border-2 border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all duration-150 focus:border-[#58CC02] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#58CC02]/15 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-[#2B3940] dark:bg-[#1A262C] dark:text-slate-100 dark:focus:border-[#58CC02] dark:focus:bg-[#131F24] dark:focus:ring-[#58CC02]/20',
        className,
      )}
      {...props}
    />
  )
}
