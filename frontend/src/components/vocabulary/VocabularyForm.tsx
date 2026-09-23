import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
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
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
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
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="e.g. resilient"
          required
        />
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
        <Input
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="e.g. She remained resilient through tough times."
        />
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
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ielts, business, travel"
          />
        </Field>
      </div>

      {languageCode === 'en' && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            English Attributes
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="IPA">
              <Input
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                placeholder="/rɪˈzɪl.jənt/"
              />
            </Field>
            <Field label="Part of speech">
              <Input
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="adjective"
              />
            </Field>
            <Field label="CEFR level (A1-C2)">
              <Input
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value)}
                placeholder="B2, C1..."
              />
            </Field>
            <Field label="Collocations (comma separated)">
              <Input
                value={collocations}
                onChange={(e) => setCollocations(e.target.value)}
                placeholder="resilient economy, stay resilient"
              />
            </Field>
          </div>
        </div>
      )}

      {languageCode === 'zh' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Chinese Attributes
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pinyin">
              <Input
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
                placeholder="pīnyīn"
              />
            </Field>
            <Field label="HSK level (1-6)">
              <Input
                value={hskLevel}
                onChange={(e) => setHskLevel(e.target.value)}
                placeholder="1 - 6"
              />
            </Field>
            <Field label="Example pinyin">
              <Input
                value={examplePinyin}
                onChange={(e) => setExamplePinyin(e.target.value)}
              />
            </Field>
            <Field label="Measure word">
              <Input
                value={measureWord}
                onChange={(e) => setMeasureWord(e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {languageCode === 'ja' && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/60 dark:bg-purple-950/40">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            Japanese Attributes
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reading (furigana)">
              <Input
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="ふりがな"
              />
            </Field>
            <Field label="Part of speech">
              <Input
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
              />
            </Field>
            <Field label="Example reading">
              <Input
                value={exampleReading}
                onChange={(e) => setExampleReading(e.target.value)}
              />
            </Field>
            <Field label="JLPT level (N5-N1)">
              <Input
                value={jlptLevel}
                onChange={(e) => setJlptLevel(e.target.value)}
                placeholder="N3, N2..."
              />
            </Field>
          </div>
        </div>
      )}

      {initial && history && history.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Review History
          </h3>
          <ul className="flex flex-col gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            {history.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
              >
                <span>{new Date(entry.reviewedAt).toLocaleDateString()}</span>
                <Badge
                  variant={
                    entry.rating === 'GOOD' || entry.rating === 'EASY'
                      ? 'success'
                      : entry.rating === 'AGAIN'
                        ? 'danger'
                        : 'warning'
                  }
                  className="text-[10px] py-0 font-bold"
                >
                  {entry.rating}
                </Badge>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {entry.previousInterval ?? 0}d → {entry.newInterval ?? 0}d
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2.5 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="font-semibold">
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
