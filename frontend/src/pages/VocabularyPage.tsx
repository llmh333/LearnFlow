import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconBook,
  IconChevronRight,
} from '@/components/ui/Icon'
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
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Vocabulary
            </h1>
            {data && (
              <Badge variant="primary">
                {data.totalElements} {data.totalElements === 1 ? 'word' : 'words'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Build and manage your personalized active vocabulary database.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 shadow-sm self-start sm:self-auto">
          <IconPlus size={16} />
          <span>Add word</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="w-full sm:w-44">
          <LanguageSwitcher value={languageCode} onChange={handleLanguageChange} includeAll />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Input
            className="w-full pl-9"
            placeholder="Search word or meaning..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
        <div className="w-full sm:w-40">
          <Input
            placeholder="Tag filter"
            value={tagFilter}
            onChange={(e) => updateParam('tag', e.target.value)}
          />
        </div>
      </Card>

      {/* Vocabulary List Table */}
      <Card className="p-0 overflow-hidden border-slate-200/90 shadow-xs">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-neutral-500">Loading words...</p>
          </div>
        ) : vocabularies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-3">
              <IconBook size={28} />
            </div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No vocabulary yet.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Add your first word or select another language filter to see your list.
            </p>
            <Button size="sm" onClick={openCreateDialog} className="mt-4 gap-1.5">
              <IconPlus size={14} /> Add first word
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="border-0">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Word</TableHead>
                  <TableHead className="w-1/3">Meaning</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vocabularies.map((vocabulary) => (
                  <TableRow key={vocabulary.id}>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                      {vocabulary.word}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {vocabulary.meaning}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {vocabulary.language.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {vocabulary.tags.map((tag) => (
                          <Badge key={tag} variant="default" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(vocabulary)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Edit"
                        >
                          <IconEdit size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vocabulary.id)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                          title="Delete"
                        >
                          <IconTrash size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-xs font-semibold text-neutral-500 dark:border-slate-800">
            <span>
              Page {data.page + 1} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={data.page === 0}
                onClick={() => goToPage(data.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={data.page + 1 >= data.totalPages}
                onClick={() => goToPage(data.page + 1)}
                className="gap-1"
              >
                <span>Next</span>
                <IconChevronRight size={14} />
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
