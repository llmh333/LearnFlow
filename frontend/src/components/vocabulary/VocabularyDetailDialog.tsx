import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { WordStrokeOrder } from '@/components/review/WordStrokeOrder'
import { formatPhonetic, getPhoneticTranscription } from '@/lib/phonetics'
import { isStrokeOrderSupported } from '@/lib/strokeOrder'
import type { Vocabulary } from '@/types/domain'

interface VocabularyDetailDialogProps {
  vocabulary: Vocabulary | null
  onClose: () => void
}

/** Read-only lookup view for a word, opened by clicking its row on the Vocabulary page. Mirrors
 * the "revealed" layout on ReviewPage for visual consistency, minus the reveal/rating controls —
 * this is for looking a word up, not for an SRS review. */
export function VocabularyDetailDialog({ vocabulary, onClose }: VocabularyDetailDialogProps) {
  const rawPhonetic = vocabulary
    ? getPhoneticTranscription(vocabulary.language.code, vocabulary.attributes)
    : null
  const phonetic = rawPhonetic && vocabulary
    ? formatPhonetic(vocabulary.language.code, rawPhonetic)
    : null

  return (
    <Dialog open={vocabulary !== null} onClose={onClose} title={vocabulary?.word}>
      {vocabulary && (
        <div className="flex flex-col items-center gap-4 w-full text-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Badge variant="outline" className="text-[11px]">
              {vocabulary.language.name}
            </Badge>
            {vocabulary.tags.map((tag) => (
              <Badge key={tag} variant="default" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>

          {phonetic && (
            <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
              {phonetic}
            </p>
          )}

          <p className="text-xl sm:text-2xl font-bold text-[#365314] dark:text-[#B6F23A]">
            {vocabulary.meaning}
          </p>

          {vocabulary.example && (
            <div className="w-full max-w-md rounded-xl bg-[#F8F9FA] p-3.5 border border-slate-200 dark:bg-[#262626] dark:border-[#383838]">
              <p className="text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed">
                "{vocabulary.example}"
              </p>
            </div>
          )}

          {isStrokeOrderSupported(vocabulary.language.code) && (
            <WordStrokeOrder word={vocabulary.word} languageCode={vocabulary.language.code} />
          )}
        </div>
      )}
    </Dialog>
  )
}
