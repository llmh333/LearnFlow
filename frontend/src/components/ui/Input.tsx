import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border-2 border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all duration-150 focus:border-[#58CC02] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#58CC02]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-[#2B3940] dark:bg-[#1A262C] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#58CC02] dark:focus:bg-[#131F24] dark:focus:ring-[#58CC02]/20 dark:disabled:bg-[#131F24]',
        className,
      )}
      {...props}
    />
  )
}
