import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { CourseSwitcher } from './CourseSwitcher'
import { useUiStore } from '@/stores/uiStore'

function renderComponent() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<CourseSwitcher />} />
        <Route path="/onboarding" element={<div>Onboarding Wizard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CourseSwitcher', () => {
  beforeEach(() => {
    useUiStore.setState({
      selectedLanguageCode: 'en',
      userLevels: { en: 'B1', zh: 'HSK 2', ja: 'N5' },
    })
  })

  it('renders active course and level pill button', () => {
    renderComponent()

    expect(screen.getByRole('button', { name: /current course: english/i })).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('B1')).toBeInTheDocument()
  })

  it('opens popover and allows selecting a different course', () => {
    renderComponent()

    const trigger = screen.getByRole('button', { name: /current course: english/i })
    fireEvent.click(trigger)

    expect(screen.getByText('Course & Level Switcher')).toBeInTheDocument()
    expect(screen.getByText('Chinese (Tiếng Trung)')).toBeInTheDocument()
    expect(screen.getByText('Japanese (Tiếng Nhật)')).toBeInTheDocument()

    // Click Japanese course
    fireEvent.click(screen.getByText('Japanese (Tiếng Nhật)'))
    expect(useUiStore.getState().selectedLanguageCode).toBe('ja')
  })

  it('allows selecting a different level for current course', () => {
    renderComponent()

    const trigger = screen.getByRole('button', { name: /current course: english/i })
    fireEvent.click(trigger)

    // Levels are a radio group: switch to A2
    fireEvent.click(screen.getByRole('radio', { name: 'A2' }))

    expect(useUiStore.getState().userLevels.en).toBe('A2')
  })

  it('navigates to /onboarding when clicking full setup button', () => {
    renderComponent()

    const trigger = screen.getByRole('button', { name: /current course: english/i })
    fireEvent.click(trigger)

    const ctaButton = screen.getByRole('button', {
      name: /full level placement & goal setup/i,
    })
    fireEvent.click(ctaButton)

    expect(screen.getByText('Onboarding Wizard Page')).toBeInTheDocument()
  })
})
