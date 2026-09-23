import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'inverted' | 'lime'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[#B6F23A] text-[#1A1A1A] hover:bg-[#a6e828] active:bg-[#95d71c] shadow-xs font-bold',
  secondary:
    'bg-[#F0F2F5] text-[#1A1A1A] hover:bg-[#E4E7EB] active:bg-[#D8DCE1] border border-transparent dark:bg-[#262626] dark:text-white dark:hover:bg-[#333333] dark:active:bg-[#3d3d3d] font-medium',
  inverted:
    'bg-[#1A1A1A] text-white hover:bg-[#282828] active:bg-[#333333] shadow-xs dark:bg-white dark:text-[#1A1A1A] dark:hover:bg-slate-100 font-semibold',
  outline:
    'bg-transparent text-[#1A1A1A] border border-slate-300 hover:bg-slate-100 active:bg-slate-200 dark:border-[#404040] dark:text-white dark:hover:bg-[#262626] dark:active:bg-[#303030]',
  lime:
    'bg-[#B6F23A] text-[#1A1A1A] hover:bg-[#a6e22c] active:bg-[#94cd22] shadow-xs font-bold',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#262626] dark:hover:text-white',
  danger:
    'bg-[#B91C1C] text-white hover:bg-[#991B1B] active:bg-[#7F1D1D] shadow-xs font-semibold',
  success:
    'bg-[#365314] text-white hover:bg-[#2b4210] dark:bg-[#93D620] dark:text-[#1A1A1A] dark:hover:bg-[#82c219] font-semibold',
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
  icon: 'h-9 w-9 p-0 rounded-full items-center justify-center',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  )
}
