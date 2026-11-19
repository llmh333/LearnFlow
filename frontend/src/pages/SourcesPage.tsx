import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useContentSources } from '@/hooks/useCurriculum'

const linkClass = 'font-bold text-[#1CB0F6] hover:underline break-all'

/** Public page: the licences of our content sources require visible attribution. */
export function SourcesPage() {
  const { data: sources, isLoading, isError } = useContentSources()

  return (
    <div className="min-h-screen bg-[#F7F9FA] p-4 sm:p-6 lg:p-10 dark:bg-[#131F24] selection:bg-[#58CC02] selection:text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back navigation */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 transition-all hover:bg-slate-50 active:border-b-2 active:translate-y-[2px] dark:border-[#2B3940] dark:bg-[#1A262C] dark:text-slate-200 dark:hover:bg-[#202F36]"
          >
            ← Back to LearnFlow
          </Link>
        </div>

        {/* Header Banner */}
        <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-6 sm:p-8 dark:border-[#2B3940] dark:bg-[#1A262C] shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-[#FFC800] text-4xl border-2 border-b-4 border-[#E5A500] shadow-sm">
            📚
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-[#202F36] px-3 py-1 mb-2">
              <span className="text-xs">🌱</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Open Knowledge &amp; Attribution
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Data sources &amp; licences
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
              LearnFlow&apos;s English, Chinese, and Japanese learning materials, stroke animations,
              and vocabulary datasets are built on generous open-source contributions from the
              global language-learning community.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#58CC02]" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border-2 border-[#FF4B4B]/30 bg-rose-50 p-4 text-sm font-bold text-[#FF4B4B] dark:bg-rose-950/40 dark:text-rose-400">
            Could not load the source list.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {sources?.map((source) => (
            <Card
              key={source.key}
              className="flex flex-col justify-between p-5 rounded-3xl border-2 border-b-4 border-slate-200 dark:border-[#2B3940] bg-white dark:bg-[#1A262C] shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">
                    {source.key === 'jmdict' || source.key === 'kanjidic2'
                      ? '🇯🇵'
                      : source.key === 'cc-cedict'
                        ? '🇨🇳'
                        : source.key === 'wordnet'
                          ? '🇬🇧'
                          : source.key === 'tatoeba'
                            ? '💬'
                            : source.key === 'animcjk'
                              ? '✍️'
                              : '📖'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 dark:bg-[#202F36] dark:text-slate-300 border border-slate-200 dark:border-[#2B3940]">
                    {source.key}
                  </span>
                </div>

                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer" className={linkClass}>
                      {source.name}
                    </a>
                  ) : (
                    source.name
                  )}
                </h2>

                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">
                    Licence:{' '}
                  </span>
                  {source.licenseUrl ? (
                    <a
                      href={source.licenseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={linkClass}
                    >
                      {source.license}
                    </a>
                  ) : (
                    source.license
                  )}
                </div>

                {source.attribution && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    {source.attribution}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
