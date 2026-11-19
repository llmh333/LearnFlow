import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'purple'
    | 'coral'
    | 'outline'
    | 'sky'
    | 'yellow'
}

const BADGE_VARIANTS: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'bg-slate-100 text-slate-700 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  primary:
    'bg-[#d7ffb8] text-[#347800] border-2 border-[#a8f274] dark:bg-[#58cc02]/20 dark:text-[#79e32a] dark:border-[#58cc02]/50 font-bold',
  secondary:
    'bg-slate-200 text-slate-800 border-2 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 font-bold',
  tertiary:
    'bg-[#ddf4ff] text-[#0d78a8] border-2 border-[#a3e2ff] dark:bg-[#1cb0f6]/20 dark:text-[#1cb0f6] dark:border-[#1cb0f6]/40 font-bold',
  success:
    'bg-[#d7ffb8] text-[#347800] border-2 border-[#a8f274] dark:bg-[#58cc02]/20 dark:text-[#79e32a] dark:border-[#58cc02]/50 font-bold',
  warning:
    'bg-[#fff5cc] text-[#a16800] border-2 border-[#ffe885] dark:bg-[#ffc800]/20 dark:text-[#ffc800] dark:border-[#ffc800]/40 font-bold',
  danger:
    'bg-[#ffdfe0] text-[#c91818] border-2 border-[#ffb3b5] dark:bg-[#ff4b4b]/20 dark:text-[#ff4b4b] dark:border-[#ff4b4b]/40 font-bold',
  purple:
    'bg-[#f5e6ff] text-[#8629cc] border-2 border-[#e5bfff] dark:bg-[#ce82ff]/20 dark:text-[#ce82ff] dark:border-[#ce82ff]/40 font-bold',
  coral:
    'bg-[#ffdfe0] text-[#c91818] border-2 border-[#ffb3b5] dark:bg-[#ff4b4b]/20 dark:text-[#ff4b4b] dark:border-[#ff4b4b]/40 font-bold',
  sky: 'bg-[#ddf4ff] text-[#0d78a8] border-2 border-[#a3e2ff] dark:bg-[#1cb0f6]/20 dark:text-[#1cb0f6] dark:border-[#1cb0f6]/40 font-bold',
  yellow:
    'bg-[#fff5cc] text-[#a16800] border-2 border-[#ffe885] dark:bg-[#ffc800]/20 dark:text-[#ffc800] dark:border-[#ffc800]/40 font-bold',
  outline:
    'bg-transparent text-slate-700 border-2 border-slate-300 dark:text-slate-300 dark:border-slate-700 font-bold',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold tracking-tight select-none transition-colors',
        BADGE_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
