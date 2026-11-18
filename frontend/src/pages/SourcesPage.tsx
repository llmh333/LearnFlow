import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useContentSources } from '@/hooks/useCurriculum'

const linkClass = 'font-semibold text-[#365314] dark:text-[#B6F23A] hover:underline break-all'

/** Public page: the licences of our content sources require visible attribution. */
export function SourcesPage() {
  const { data: sources, isLoading, isError } = useContentSources()

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-4 dark:bg-[#121212]">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Data sources &amp; licences
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          LearnFlow&apos;s learning content is built from the open data below.
        </p>

        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Could not load the source list.</p>}

        {sources?.map((source) => (
          <Card key={source.key} className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer" className={linkClass}>
                  {source.name}
                </a>
              ) : (
                source.name
              )}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Licence:{' '}
              {source.licenseUrl ? (
                <a href={source.licenseUrl} target="_blank" rel="noreferrer" className={linkClass}>
                  {source.license}
                </a>
              ) : (
                source.license
              )}
            </p>
            {source.attribution && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{source.attribution}</p>
            )}
          </Card>
        ))}

        <Link to="/" className={`inline-block py-2 text-sm ${linkClass}`}>
          Back to LearnFlow
        </Link>
      </div>
    </div>
  )
}
