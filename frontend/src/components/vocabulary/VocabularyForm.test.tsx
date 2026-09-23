import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VocabularyForm } from './VocabularyForm'

vi.mock('@/api/languages', () => ({
  fetchLanguages: vi.fn().mockResolvedValue([
    { id: 1, code: 'en', name: 'English' },
    { id: 2, code: 'zh', name: 'Chinese' },
    { id: 3, code: 'ja', name: 'Japanese' },
  ]),
}))

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <VocabularyForm onSubmit={onSubmit} onCancel={onCancel} />
    </QueryClientProvider>,
  )
  return { onSubmit, onCancel }
}

async function waitForLanguageSelect() {
  // Wait for the language options to actually load (async react-query fetch), not just the <select>
  // itself — firing a change event before the <option>s exist silently no-ops in jsdom/HTML.
  await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3))
  return screen.getByRole('combobox') as HTMLSelectElement
}

describe('VocabularyForm', () => {
  it('shows English-specific fields by default', async () => {
    renderForm()
    await waitForLanguageSelect()

    expect(screen.getByText('IPA')).toBeInTheDocument()
    expect(screen.getByText('CEFR level (A1-C2)')).toBeInTheDocument()
    expect(screen.queryByText('Pinyin')).not.toBeInTheDocument()
    expect(screen.queryByText('JLPT level (N5-N1)')).not.toBeInTheDocument()
  })

  it('switches to Chinese-specific fields when Chinese is selected', async () => {
    renderForm()
    const select = await waitForLanguageSelect()

    fireEvent.change(select, { target: { value: 'zh' } })

    expect(screen.getByText('Pinyin')).toBeInTheDocument()
    expect(screen.getByText('HSK level (1-6)')).toBeInTheDocument()
    expect(screen.queryByText('IPA')).not.toBeInTheDocument()
  })

  it('switches to Japanese-specific fields when Japanese is selected', async () => {
    renderForm()
    const select = await waitForLanguageSelect()

    fireEvent.change(select, { target: { value: 'ja' } })

    expect(screen.getByText('Reading (furigana)')).toBeInTheDocument()
    expect(screen.getByText('JLPT level (N5-N1)')).toBeInTheDocument()
    expect(screen.queryByText('Pinyin')).not.toBeInTheDocument()
  })

  it('submits the built payload including Vietnamese meaning', async () => {
    const { onSubmit } = renderForm()
    await waitForLanguageSelect()

    fireEvent.change(screen.getByPlaceholderText('Nghĩa tiếng Việt'), {
      target: { value: 'đạt được' },
    })
    const wordInputs = screen.getAllByRole('textbox')
    fireEvent.change(wordInputs[0], { target: { value: 'achieve' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        languageCode: 'en',
        word: 'achieve',
        meaning: 'đạt được',
      }),
    )
  })
})
