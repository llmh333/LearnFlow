import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder:text-slate-400 transition-all duration-150 focus:border-[#93D620] focus:outline-none focus:ring-3 focus:ring-[#B6F23A]/25 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-[#383838] dark:bg-[#1E1E1E] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#B6F23A] dark:focus:ring-[#B6F23A]/20 dark:disabled:bg-[#181818]',
        className,
      )}
      {...props}
    />
  )
}
