import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SourcesPage } from './SourcesPage'

vi.mock('@/api/curriculum', () => ({
  fetchContentSources: () =>
    Promise.resolve([
      {
        key: 'jmdict',
        name: 'JMdict',
        url: 'https://www.edrdg.org/jmdict/j_jmdict.html',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://www.edrdg.org/edrdg/licence.html',
        attribution: 'Property of the EDRDG.',
      },
      { key: 'learnflow', name: 'LearnFlow (hand-written)', license: 'Apache-2.0' },
    ]),
}))

describe('SourcesPage', () => {
  it('lists every source with its licence and attribution', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SourcesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('link', { name: 'JMdict' })).toHaveAttribute(
      'href',
      'https://www.edrdg.org/jmdict/j_jmdict.html',
    )
    expect(screen.getByRole('link', { name: 'CC BY-SA 4.0' })).toBeInTheDocument()
    expect(screen.getByText('Property of the EDRDG.')).toBeInTheDocument()
    expect(screen.getByText('LearnFlow (hand-written)')).toBeInTheDocument()
    expect(screen.getByText(/Apache-2.0/)).toBeInTheDocument()
  })
})
