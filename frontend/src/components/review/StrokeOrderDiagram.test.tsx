import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StrokeOrderDiagram } from './StrokeOrderDiagram'

describe('StrokeOrderDiagram', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('renders the locally-vendored SVG when it exists', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<svg id="stub" />'),
    })

    render(<StrokeOrderDiagram character="工" languageCode="zh" />)

    await waitFor(() => expect(document.getElementById('stub')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/stroke-order/24037.svg')
  })

  it('falls back to the remote CDN when the character is not vendored locally', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false }) // local miss
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('<svg id="remote-stub" />') })

    render(<StrokeOrderDiagram character="工" languageCode="zh" />)

    await waitFor(() => expect(document.getElementById('remote-stub')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master/svgsZhHans/24037.svg',
    )
  })

  it('shows the raw character as a fallback when no stroke data is found anywhere', async () => {
    fetchMock.mockResolvedValue({ ok: false })

    render(<StrokeOrderDiagram character="工" languageCode="zh" />)

    expect(await screen.findByText('工')).toBeInTheDocument()
  })
})
