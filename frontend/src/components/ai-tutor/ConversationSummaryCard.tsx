import { Badge } from '@/components/ui/Badge'
import type { ConversationSummaryResult } from '@/api/ai'

interface ConversationSummaryCardProps {
  summary: ConversationSummaryResult
}

export function ConversationSummaryCard({ summary }: ConversationSummaryCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-5 sm:p-6 text-sm dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-2xl animate-bounce-playful">🌟</span>
        <h3 className="font-black text-base text-slate-800 dark:text-white">
          Session Analysis & Feedback
        </h3>
      </div>

      <div className="rounded-2xl border-2 border-amber-200 bg-[#FFF5CC] p-4 text-[#A16800] dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="text-xs sm:text-sm font-bold leading-relaxed">{summary.overview}</p>
      </div>

      {summary.mistakes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#FF4B4B] uppercase tracking-wide">
            Areas to polish
          </p>
          <ul className="flex flex-col gap-2">
            {summary.mistakes.map((m) => (
              <li
                key={m.original}
                className="flex items-center gap-2.5 rounded-2xl bg-[#FFDFE0]/60 p-3 text-xs text-slate-800 border-2 border-[#FFB3B5] dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
              >
                {m.category && <Badge variant="danger">{m.category}</Badge>}
                <span className="font-bold">{m.topic}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.suggestedVocabulary.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#58CC02] uppercase tracking-wide">
            Vocabulary Boost
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {summary.suggestedVocabulary.map((v) => (
              <div
                key={v.word}
                className="rounded-2xl border-2 border-b-4 border-slate-200 bg-slate-50 p-3 text-xs dark:border-[#2B3940] dark:bg-[#131F24]"
              >
                <span className="font-black text-slate-900 dark:text-white text-sm">{v.word}</span>
                <p className="text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {v.meaningVietnamese}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.betterExpressions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#1CB0F6] uppercase tracking-wide">
            Natural Native Expressions
          </p>
          <ul className="space-y-2 rounded-2xl bg-[#DDF4FF]/60 p-3.5 border-2 border-[#A3E2FF] text-xs text-slate-800 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200">
            {summary.betterExpressions.map((expression) => (
              <li key={expression} className="flex items-start gap-2">
                <span className="text-[#1CB0F6] font-black text-sm">✓</span>
                <span className="font-bold">{expression}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.grammarProblems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#A16800] uppercase tracking-wide">
            Grammar points to review
          </p>
          <ul className="space-y-2 rounded-2xl bg-[#FFF5CC] p-3.5 border-2 border-amber-300 text-xs text-[#A16800] dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
            {summary.grammarProblems.map((problem) => (
              <li key={problem} className="flex items-start gap-2">
                <span className="font-black text-sm">💡</span>
                <span className="font-bold">{problem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
