import { cn } from '@/lib/cn'

interface MultipleChoiceCardProps {
  question: string
  options: string[]
  disabled: boolean
  selectedIndex: number | null
  correctIndex: number | null
  onSelect: (index: number) => void
}

export function MultipleChoiceCard({
  question,
  options,
  disabled,
  selectedIndex,
  correctIndex,
  onSelect,
}: MultipleChoiceCardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{question}</p>
      <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index
          const isRevealedCorrect = correctIndex === index
          const isRevealedWrong = correctIndex !== null && isSelected && index !== correctIndex
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(index)}
              className={cn(
                'rounded-xl border p-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
                isRevealedCorrect &&
                  'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300',
                isRevealedWrong &&
                  'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
                !isRevealedCorrect &&
                  !isRevealedWrong &&
                  isSelected &&
                  'border-[#365314] bg-[#EDFBD8] text-[#365314] dark:border-[#B6F23A] dark:bg-[#B6F23A]/15 dark:text-[#B6F23A]',
                !isRevealedCorrect &&
                  !isRevealedWrong &&
                  !isSelected &&
                  'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
