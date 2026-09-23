import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { VocabularyForm } from '@/components/vocabulary/VocabularyForm'
import {
  useCreateVocabulary,
  useDeleteVocabulary,
  useUpdateVocabulary,
  useVocabularyList,
} from '@/hooks/useVocabulary'
import { useUiStore } from '@/stores/uiStore'
import { ApiError } from '@/api/client'
import type { VocabularyPayload } from '@/api/vocabulary'
import type { Vocabulary } from '@/types/domain'

const PAGE_SIZE = 20

export function VocabularyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)

  const languageCode = searchParams.get('language') ?? selectedLanguageCode
  const tagFilter = searchParams.get('tag') ?? ''
  const page = Number(searchParams.get('page') ?? '0')

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) next.set('search', debouncedSearch)
    else next.delete('search')
    next.set('page', '0')
    setSearchParams(next, { replace: true })
    // Only re-run when the debounced value changes — searchParams itself is intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const { data, isLoading } = useVocabularyList({
    language: languageCode || undefined,
    search: debouncedSearch || undefined,
    tag: tagFilter || undefined,
    page,
    size: PAGE_SIZE,
  })

  const createMutation = useCreateVocabulary()
  const updateMutation = useUpdateVocabulary()
  const deleteMutation = useDeleteVocabulary()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vocabulary | null>(null)
  const [formError, setFormError] = useState<string | undefined>()

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '0')
    setSearchParams(next, { replace: true })
  }

  function handleLanguageChange(code: string) {
    setSelectedLanguageCode(code)
    updateParam('language', code)
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next, { replace: true })
  }

  function openCreateDialog() {
    setEditing(null)
    setFormError(undefined)
    setDialogOpen(true)
  }

  function openEditDialog(vocabulary: Vocabulary) {
    setEditing(vocabulary)
    setFormError(undefined)
    setDialogOpen(true)
  }

  function handleSubmit(payload: VocabularyPayload) {
    const request = editing
      ? updateMutation.mutateAsync({ id: editing.id, payload })
      : createMutation.mutateAsync(payload)

    request
      .then(() => setDialogOpen(false))
      .catch((err: unknown) => {
        setFormError(err instanceof ApiError ? err.message : 'Something went wrong')
      })
  }

  function handleDelete(id: number) {
    if (window.confirm('Delete this word?')) {
      deleteMutation.mutate(id)
    }
  }

  const vocabularies = data?.content ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Vocabulary</h1>
        <Button onClick={openCreateDialog}>Add word</Button>
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="w-40">
          <LanguageSwitcher value={languageCode} onChange={handleLanguageChange} includeAll />
        </div>
        <Input
          className="max-w-xs"
          placeholder="Search word or meaning..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Input
          className="max-w-40"
          placeholder="Tag"
          value={tagFilter}
          onChange={(e) => updateParam('tag', e.target.value)}
        />
      </Card>

      <Card>
        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : vocabularies.length === 0 ? (
          <p className="text-sm text-neutral-500">No vocabulary yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead>Meaning</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vocabularies.map((vocabulary) => (
                <TableRow key={vocabulary.id}>
                  <TableCell className="font-medium">{vocabulary.word}</TableCell>
                  <TableCell>{vocabulary.meaning}</TableCell>
                  <TableCell>{vocabulary.language.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {vocabulary.tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => openEditDialog(vocabulary)}>
                        Edit
                      </Button>
                      <Button variant="ghost" onClick={() => handleDelete(vocabulary.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
            <span>
              Page {data.page + 1} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={data.page === 0}
                onClick={() => goToPage(data.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={data.page + 1 >= data.totalPages}
                onClick={() => goToPage(data.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Edit word' : 'Add word'}
      >
        <VocabularyForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          error={formError}
        />
      </Dialog>
    </div>
  )
}
