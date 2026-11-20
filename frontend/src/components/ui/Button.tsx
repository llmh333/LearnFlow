import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'outline'
    | 'inverted'
    | 'lime'
    | 'coral'
    | 'sky'
    | 'yellow'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[#58cc02] border-2 border-b-4 border-[#46a302] text-white hover:bg-[#61e002] active:border-b-2 active:translate-y-[2px] font-extrabold shadow-xs',
  sky: 'bg-[#1cb0f6] border-2 border-b-4 border-[#1899d6] text-white hover:bg-[#34bdff] active:border-b-2 active:translate-y-[2px] font-extrabold shadow-xs',
  yellow:
    'bg-[#ffc800] border-2 border-b-4 border-[#e5a500] text-amber-950 hover:bg-[#ffd226] active:border-b-2 active:translate-y-[2px] font-extrabold shadow-xs',
  secondary:
    'bg-white border-2 border-b-4 border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px] dark:bg-slate-800 dark:border-slate-700 dark:border-b-slate-600 dark:text-slate-100 font-bold shadow-xs',
  inverted:
    'bg-slate-900 border-2 border-b-4 border-black text-white hover:bg-slate-800 active:border-b-2 active:translate-y-[2px] dark:bg-white dark:border-slate-300 dark:text-slate-900 font-extrabold shadow-xs',
  outline:
    'bg-transparent border-2 border-b-4 border-slate-300 border-b-slate-400 text-slate-700 hover:bg-slate-100 active:border-b-2 active:translate-y-[2px] dark:border-slate-700 dark:border-b-slate-600 dark:text-slate-200 font-bold',
  lime: 'bg-[#58cc02] border-2 border-b-4 border-[#46a302] text-white hover:bg-[#61e002] active:border-b-2 active:translate-y-[2px] font-extrabold shadow-xs',
  coral:
    'bg-[#ff4b4b] border-2 border-b-4 border-[#ea2b2b] text-white hover:bg-[#ff5f5f] active:border-b-2 active:translate-y-[2px] font-extrabold shadow-xs',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 font-bold border-2 border-transparent',
  danger:
    'bg-[#ff4b4b] border-2 border-b-4 border-[#ea2b2b] text-white hover:bg-[#ff5f5f] active:border-b-2 active:translate-y-[2px] font-extrabold shadow-xs',
  success:
    'bg-[#58cc02] border-2 border-b-4 border-[#46a302] text-white hover:bg-[#61e002] active:border-b-2 active:translate-y-[2px] font-extrabold shadow-xs',
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm rounded-2xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2.5',
  icon: 'h-10 w-10 p-0 rounded-2xl items-center justify-center',
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-75 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50 disabled:border-b-2 disabled:translate-y-0',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  )
}
