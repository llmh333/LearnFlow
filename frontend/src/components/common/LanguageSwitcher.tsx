import { Select } from 'antd'
import { useLanguages } from '@/hooks/useLanguages'

interface LanguageSwitcherProps {
  value: string
  onChange: (code: string) => void
  includeAll?: boolean
}

export function LanguageSwitcher({ value, onChange, includeAll }: LanguageSwitcherProps) {
  const { data: languages } = useLanguages()
  const options = [
    ...(includeAll ? [{ value: '', label: 'All languages' }] : []),
    ...(languages ?? []).map((language) => ({ value: language.code, label: language.name })),
  ]

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      size="large"
      aria-label="Language"
      popupMatchSelectWidth={false}
      className="w-full"
    />
  )
}
