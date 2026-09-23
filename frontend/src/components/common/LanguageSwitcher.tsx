import { Select } from '@/components/ui/Select'
import { useLanguages } from '@/hooks/useLanguages'

interface LanguageSwitcherProps {
  value: string
  onChange: (code: string) => void
  includeAll?: boolean
}

export function LanguageSwitcher({ value, onChange, includeAll }: LanguageSwitcherProps) {
  const { data: languages } = useLanguages()

  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)}>
      {includeAll && <option value="">All languages</option>}
      {(languages ?? []).map((language) => (
        <option key={language.code} value={language.code}>
          {language.name}
        </option>
      ))}
    </Select>
  )
}
