import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useLanguages } from '@/hooks/useLanguages'
import { useReviewHistory } from '@/hooks/useReviews'
import type { VocabularyPayload } from '@/api/vocabulary'
import type { Vocabulary } from '@/types/domain'

interface VocabularyFormProps {
  initial?: Vocabulary
  onSubmit: (payload: VocabularyPayload) => void
  onCancel: () => void
  isSubmitting?: boolean
  error?: string
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function attributeString(attributes: Record<string, unknown> | undefined, key: string): string {
  const value = attributes?.[key]
  if (Array.isArray(value)) return value.join(', ')
  return value === undefined || value === null ? '' : String(value)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      {children}
    </div>
  )
}

export function VocabularyForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: VocabularyFormProps) {
  const { data: languages } = useLanguages()
  const { data: history } = useReviewHistory(initial?.id)
  const attrs = initial?.attributes

  const [languageCode, setLanguageCode] = useState(initial?.language.code ?? 'en')
  const [word, setWord] = useState(initial?.word ?? '')
  const [meaning, setMeaning] = useState(initial?.meaning ?? '')
  const [example, setExample] = useState(initial?.example ?? '')
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 0)
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')

  // English attributes
  const [ipa, setIpa] = useState(attributeString(attrs, 'ipa'))
  const [partOfSpeech, setPartOfSpeech] = useState(attributeString(attrs, 'partOfSpeech'))
  const [cefrLevel, setCefrLevel] = useState(attributeString(attrs, 'cefrLevel'))
  const [collocations, setCollocations] = useState(attributeString(attrs, 'collocations'))

  // Chinese attributes
  const [pinyin, setPinyin] = useState(attributeString(attrs, 'pinyin'))
  const [hskLevel, setHskLevel] = useState(attributeString(attrs, 'hskLevel'))
  const [examplePinyin, setExamplePinyin] = useState(attributeString(attrs, 'examplePinyin'))
  const [measureWord, setMeasureWord] = useState(attributeString(attrs, 'measureWord'))

  // Japanese attributes
  const [reading, setReading] = useState(attributeString(attrs, 'reading'))
  const [exampleReading, setExampleReading] = useState(attributeString(attrs, 'exampleReading'))
  const [jlptLevel, setJlptLevel] = useState(attributeString(attrs, 'jlptLevel'))

  function buildAttributes(): Record<string, unknown> {
    const value: Record<string, unknown> = {}
    if (languageCode === 'en') {
      if (ipa) value.ipa = ipa
      if (partOfSpeech) value.partOfSpeech = partOfSpeech
      if (cefrLevel) value.cefrLevel = cefrLevel
      const collocationList = parseList(collocations)
      if (collocationList.length > 0) value.collocations = collocationList
    } else if (languageCode === 'zh') {
      if (pinyin) value.pinyin = pinyin
      if (hskLevel) value.hskLevel = Number(hskLevel)
      if (examplePinyin) value.examplePinyin = examplePinyin
      if (measureWord) value.measureWord = measureWord
    } else if (languageCode === 'ja') {
      if (reading) value.reading = reading
      if (exampleReading) value.exampleReading = exampleReading
      if (partOfSpeech) value.partOfSpeech = partOfSpeech
      if (jlptLevel) value.jlptLevel = jlptLevel
    }
    return value
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      languageCode,
      word,
      meaning,
      example: example || null,
      difficulty,
      tags: parseList(tags),
      attributes: buildAttributes(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Language">
        <Select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)}>
          {(languages ?? []).map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Word">
        <Input value={word} onChange={(e) => setWord(e.target.value)} required />
      </Field>

      <Field label="Meaning (tiếng Việt)">
        <Input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Nghĩa tiếng Việt"
          required
        />
      </Field>

      <Field label="Example">
        <Input value={example} onChange={(e) => setExample(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Difficulty (0-5)">
          <Input
            type="number"
            min={0}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          />
        </Field>
        <Field label="Tags (comma separated)">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
      </div>

      {languageCode === 'en' && (
        <div className="grid grid-cols-2 gap-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <Field label="IPA">
            <Input value={ipa} onChange={(e) => setIpa(e.target.value)} />
          </Field>
          <Field label="Part of speech">
            <Input value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)} />
          </Field>
          <Field label="CEFR level (A1-C2)">
            <Input value={cefrLevel} onChange={(e) => setCefrLevel(e.target.value)} />
          </Field>
          <Field label="Collocations (comma separated)">
            <Input value={collocations} onChange={(e) => setCollocations(e.target.value)} />
          </Field>
        </div>
      )}

      {languageCode === 'zh' && (
        <div className="grid grid-cols-2 gap-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <Field label="Pinyin">
            <Input value={pinyin} onChange={(e) => setPinyin(e.target.value)} />
          </Field>
          <Field label="HSK level (1-6)">
            <Input value={hskLevel} onChange={(e) => setHskLevel(e.target.value)} />
          </Field>
          <Field label="Example pinyin">
            <Input value={examplePinyin} onChange={(e) => setExamplePinyin(e.target.value)} />
          </Field>
          <Field label="Measure word">
            <Input value={measureWord} onChange={(e) => setMeasureWord(e.target.value)} />
          </Field>
        </div>
      )}

      {languageCode === 'ja' && (
        <div className="grid grid-cols-2 gap-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <Field label="Reading (furigana)">
            <Input value={reading} onChange={(e) => setReading(e.target.value)} />
          </Field>
          <Field label="Part of speech">
            <Input value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)} />
          </Field>
          <Field label="Example reading">
            <Input value={exampleReading} onChange={(e) => setExampleReading(e.target.value)} />
          </Field>
          <Field label="JLPT level (N5-N1)">
            <Input value={jlptLevel} onChange={(e) => setJlptLevel(e.target.value)} />
          </Field>
        </div>
      )}

      {initial && history && history.length > 0 && (
        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Review history
          </h3>
          <ul className="flex flex-col gap-1 text-xs text-neutral-500">
            {history.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex justify-between">
                <span>{new Date(entry.reviewedAt).toLocaleString()}</span>
                <span>{entry.rating}</span>
                <span>
                  {entry.previousInterval ?? 0}d → {entry.newInterval ?? 0}d
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
