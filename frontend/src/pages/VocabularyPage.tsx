import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Pagination,
  Radio,
  Segmented,
  Spin,
  Table,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  AppstoreOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { Flowy } from '@/assets'
import { ApiError } from '@/api/client'
import { PronounceButton } from '@/components/ui/PronounceButton'
import { WordStrokeOrder } from '@/components/review/WordStrokeOrder'
import { useLevelCounts, useWordDetail, useWords } from '@/hooks/useDictionary'
import { useLanguages } from '@/hooks/useLanguages'
import { useUiStore } from '@/stores/uiStore'
import type { LevelCount, WordSummary } from '@/types/domain'
import { cn } from '@/lib/cn'

const LEVEL_PALETTE = ['green', 'cyan', 'gold', 'orange', 'red', 'purple', 'magenta']

function getLevelColor(level: string | null, levels?: LevelCount[]): string {
  if (!level || !levels) return 'default'
  const validLevels = levels.filter((l) => Boolean(l.level))
  const index = validLevels.findIndex((l) => l.level === level)
  if (index === -1) return 'default'
  return LEVEL_PALETTE[index % LEVEL_PALETTE.length]
}

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  n: 'Danh từ',
  v1: 'Động từ nhóm 2',
  v5: 'Động từ nhóm 1',
  v5m: 'Động từ nhóm 1 (mu)',
  v5k: 'Động từ nhóm 1 (ku)',
  v5s: 'Động từ nhóm 1 (su)',
  v5t: 'Động từ nhóm 1 (tsu)',
  v5n: 'Động từ nhóm 1 (nu)',
  v5b: 'Động từ nhóm 1 (bu)',
  v5r: 'Động từ nhóm 1 (ru)',
  vs: 'Động từ Suru',
  vk: 'Động từ Kuru',
  'adj-i': 'Tính từ đuôi い',
  'adj-na': 'Tính từ đuôi な',
  adv: 'Phó từ',
  prt: 'Trợ từ',
  exp: 'Cụm từ / Thành ngữ',
  expression: 'Mẫu câu / Lời chào',
}

function getPosLabel(pos: string): string {
  return PART_OF_SPEECH_LABELS[pos.toLowerCase()] || pos
}

export function VocabularyPage() {
  const navigate = useNavigate()
  const selectedLanguageCode = useUiStore((s) => s.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((s) => s.setSelectedLanguageCode)

  const { data: languages, isLoading: isLanguagesLoading } = useLanguages()
  const currentLanguage = (languages ?? []).find((l) => l.code === selectedLanguageCode)
  const isSupported = Boolean(currentLanguage)

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInputDraft, setSearchInputDraft] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Reset filters when language changes
  const prevLangRef = useRef(selectedLanguageCode)
  useEffect(() => {
    if (prevLangRef.current !== selectedLanguageCode) {
      prevLangRef.current = selectedLanguageCode
      setSelectedLevel('ALL')
      setPage(0)
      setSearchQuery('')
      setSearchInputDraft('')
    }
  }, [selectedLanguageCode])

  // Selected word detail modal state
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null)

  // API queries - only fetch if language is supported by backend
  const effectiveLang = isSupported ? selectedLanguageCode : ''
  const { data: levelCounts } = useLevelCounts(effectiveLang)
  const {
    data: wordsData,
    isLoading: isWordsLoading,
    isError: isWordsError,
    error: wordsError,
  } = useWords({
    lang: effectiveLang,
    q: searchQuery,
    level: selectedLevel === 'ALL' ? undefined : selectedLevel,
    page,
    size: pageSize,
  })

  const { data: wordDetail, isLoading: isDetailLoading } = useWordDetail(selectedWordId)

  const totalWordsCount = (levelCounts ?? []).reduce((sum, item) => sum + item.wordCount, 0)

  function handleSearch(value: string) {
    const trimmed = value.trim()
    setSearchQuery(trimmed)
    setSearchInputDraft(trimmed)
    setPage(0)
  }

  function handleResetFilters() {
    setSearchQuery('')
    setSearchInputDraft('')
    setSelectedLevel('ALL')
    setPage(0)
  }

  function handleLevelChange(level: string) {
    setSelectedLevel(level)
    setPage(0)
  }

  // Ant Design Table Columns definition
  const tableColumns: ColumnsType<WordSummary> = [
    {
      title: 'Từ vựng (Chữ viết / Cách đọc)',
      key: 'written_reading',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <PronounceButton word={record.reading} languageCode={selectedLanguageCode} size={16} />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-slate-900 dark:text-white">
                {record.written || record.reading}
              </span>
              {record.written && (
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  [{record.reading}]
                </span>
              )}
            </div>
            {record.partOfSpeech.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {record.partOfSpeech.map((pos) => (
                  <span
                    key={pos}
                    className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded"
                  >
                    {getPosLabel(pos)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Ý nghĩa tiếng Việt',
      dataIndex: 'meaningsVi',
      key: 'meaningsVi',
      render: (meanings: string[]) => (
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {meanings.join(', ')}
        </div>
      ),
    },
    {
      title: 'Cấp độ',
      dataIndex: 'level',
      key: 'level',
      width: 110,
      render: (level: string | null) =>
        level ? (
          <Tag
            color={getLevelColor(level, levelCounts)}
            className="!rounded-md !font-black !px-2.5"
          >
            {level}
          </Tag>
        ) : (
          <Tag className="!rounded-md">Chưa phân cấp</Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => setSelectedWordId(record.id)}
          className="!font-bold !text-[#1CB0F6] hover:!underline p-0"
        >
          Chi tiết →
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[1536px] mx-auto animate-fade-in">
      {/* Header Banner */}
      <Card
        className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] shadow-sm"
        styles={{ body: { padding: '1.5rem 1.75rem' } }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#131F24] border-2 border-b-4 border-slate-200 dark:border-[#2B3940] shadow-sm">
              <Flowy size={46} className="animate-bounce-playful" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 mb-1.5">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                  {currentLanguage
                    ? `Từ vựng & Từ điển ${currentLanguage.name}`
                    : 'Từ vựng & Từ điển'}
                </span>
                {totalWordsCount > 0 && (
                  <Tag
                    color="success"
                    className="!rounded-full !text-[10px] !font-black !m-0 !px-1.5"
                  >
                    {totalWordsCount.toLocaleString()} Từ
                  </Tag>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Thư viện Từ vựng {currentLanguage ? currentLanguage.name : ''}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Tra cứu từ vựng kèm cách đọc, phát âm giọng chuẩn, nét viết chữ Hán và câu ví dụ
                thực tế.
              </p>
            </div>
          </div>

          {isSupported && (
            <div className="flex items-center gap-2">
              <Segmented
                shape="round"
                size="middle"
                value={viewMode}
                onChange={(val) => setViewMode(val as 'grid' | 'table')}
                options={[
                  {
                    value: 'grid',
                    icon: <AppstoreOutlined />,
                    label: 'Dạng thẻ',
                  },
                  {
                    value: 'table',
                    icon: <UnorderedListOutlined />,
                    label: 'Bảng tra',
                  },
                ]}
                className="!rounded-full p-1 bg-slate-100 dark:bg-slate-800 font-bold border border-slate-200/80 dark:border-slate-700/80 [&_.ant-segmented-group]:!rounded-full [&_.ant-segmented-item]:!rounded-full [&_.ant-segmented-thumb]:!rounded-full [&_.ant-segmented-item-selected]:!rounded-full [&_.ant-segmented-thumb]:!shadow-xs shadow-2xs select-none"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Loading state for languages */}
      {isLanguagesLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spin size="large" />
          <p className="text-xs font-bold text-slate-400">Đang tải thông tin ngôn ngữ...</p>
        </div>
      )}

      {/* Unsupported Language Empty State - Do not call dictionary API */}
      {!isLanguagesLoading && !isSupported && (
        <Card
          className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] py-14 text-center shadow-sm"
          styles={{ body: { padding: '2.5rem' } }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-2 max-w-md mx-auto py-2">
                <h3 className="text-lg font-black text-slate-800 dark:text-white">
                  Từ điển cho ngôn ngữ này sắp có
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hiện tại hệ thống đang hỗ trợ từ điển cho Tiếng Nhật. Bạn có thể chuyển sang Tiếng
                  Nhật để tra cứu hơn 1,300+ từ vựng chuẩn JLPT.
                </p>
              </div>
            }
          >
            {languages?.some((l) => l.code === 'ja') && (
              <Button
                type="primary"
                size="large"
                onClick={() => setSelectedLanguageCode('ja')}
                className="!rounded-2xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-4 !border-[#46a302] !text-white font-black cursor-pointer transition-all mt-2"
              >
                Chuyển sang Tiếng Nhật 🇯🇵
              </Button>
            )}
          </Empty>
        </Card>
      )}

      {/* Main Content when language is supported */}
      {!isLanguagesLoading && isSupported && (
        <>
          {/* Search and Filters Toolbar */}
          <Card
            className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] shadow-sm"
            styles={{ body: { padding: '1.25rem 1.5rem' } }}
          >
            <div className="flex flex-col gap-4">
              {/* Tier 1: Search Bar (Full-width, spacious, beautiful 3D button) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    size="large"
                    placeholder="Nhập chữ Hán, Hiragana, Katakana, tiếng Việt hoặc tiếng Anh (ví dụ: 学生, gakusei, học sinh)..."
                    allowClear
                    prefix={<SearchOutlined className="text-slate-400 text-lg mr-2" />}
                    value={searchInputDraft}
                    onChange={(e) => {
                      setSearchInputDraft(e.target.value)
                      if (!e.target.value) {
                        setSearchQuery('')
                        setPage(0)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(searchInputDraft)
                      }
                    }}
                    className="w-full !h-12 !rounded-2xl !border-2 !border-slate-200 hover:!border-[#58CC02] focus:!border-[#58CC02] dark:!border-[#2B3940] dark:!bg-[#131F24] font-medium text-sm !px-4 shadow-2xs transition-all"
                  />
                </div>
                <Button
                  type="primary"
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={() => handleSearch(searchInputDraft)}
                  className="!h-12 !px-7 !rounded-2xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-4 !border-[#46a302] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black !text-sm uppercase tracking-wider shadow-xs shrink-0 cursor-pointer transition-all"
                >
                  Tìm kiếm
                </Button>
              </div>

              {/* Divider */}
              <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800/80" />

              {/* Tier 2: Level Filters & Status Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
                    <FilterOutlined className="text-amber-500 text-sm" />
                    <span>Cấp độ:</span>
                  </span>

                  <Radio.Group
                    value={selectedLevel}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    buttonStyle="solid"
                    className="flex flex-wrap gap-2 items-center"
                  >
                    {/* Tất cả */}
                    <Radio.Button
                      value="ALL"
                      className={cn(
                        '!rounded-2xl !h-10 !px-4 !border-2 !border-b-4 font-black text-xs transition-all flex items-center gap-2 before:!hidden cursor-pointer select-none',
                        selectedLevel === 'ALL'
                          ? '!bg-[#58cc02] !border-[#46a302] !text-white shadow-xs'
                          : '!border-slate-200 !bg-slate-50 hover:!bg-slate-100 !text-slate-700 dark:!border-[#2B3940] dark:!bg-[#131F24] dark:!text-slate-300',
                      )}
                    >
                      <span>Tất cả</span>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide',
                          selectedLevel === 'ALL'
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
                        )}
                      >
                        {totalWordsCount > 0 ? totalWordsCount.toLocaleString() : '0'}
                      </span>
                    </Radio.Button>

                    {/* Levels from API in order (excluding null) */}
                    {(levelCounts ?? [])
                      .filter((l): l is LevelCount & { level: string } => Boolean(l.level))
                      .map((item) => {
                        const isSelected = selectedLevel === item.level
                        return (
                          <Radio.Button
                            key={item.level}
                            value={item.level}
                            className={cn(
                              '!rounded-2xl !h-10 !px-4 !border-2 !border-b-4 font-black text-xs transition-all flex items-center gap-2 before:!hidden cursor-pointer select-none',
                              isSelected
                                ? '!bg-[#58cc02] !border-[#46a302] !text-white shadow-xs'
                                : '!border-slate-200 !bg-slate-50 hover:!bg-slate-100 !text-slate-700 dark:!border-[#2B3940] dark:!bg-[#131F24] dark:!text-slate-300',
                            )}
                          >
                            <span className="tracking-wide">{item.name || item.level}</span>
                            <span
                              className={cn(
                                'text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full font-black',
                                isSelected
                                  ? 'bg-white/25 text-white'
                                  : item.wordCount > 0
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 dark:text-slate-500',
                              )}
                            >
                              {item.wordCount.toLocaleString()}
                            </span>
                          </Radio.Button>
                        )
                      })}
                  </Radio.Group>
                </div>

                {/* Quick Filter Reset */}
                {(searchQuery || selectedLevel !== 'ALL') && (
                  <Button
                    type="text"
                    size="small"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 !rounded-xl !h-8 px-2.5 transition-colors cursor-pointer"
                  >
                    ✕ Xóa bộ lọc
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Main Words Content Section */}
          {isWordsLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Spin size="large" />
              <p className="text-xs font-bold text-slate-400">Đang tải danh sách từ vựng...</p>
            </div>
          )}

          {isWordsError && (
            <Alert
              type="error"
              showIcon
              message={
                wordsError instanceof ApiError && wordsError.errors
                  ? wordsError.errors.lang ||
                    wordsError.errors.level ||
                    wordsError.errors.q ||
                    wordsError.message
                  : 'Không thể tải danh sách từ vựng. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.'
              }
              className="!rounded-2xl !border-2 !border-[#FF4B4B]/30 !bg-rose-50"
            />
          )}

          {!isWordsLoading && !isWordsError && wordsData?.content.length === 0 && (
            <Card
              className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] py-12 text-center"
              styles={{ body: { padding: '2rem' } }}
            >
              <Empty
                description={
                  <div className="space-y-1">
                    <p className="text-base font-black text-slate-800 dark:text-white">
                      Không tìm thấy từ vựng phù hợp
                    </p>
                    <p className="text-xs text-slate-400">
                      Thử tìm kiếm với từ khóa khác hoặc chuyển sang cấp độ khác.
                    </p>
                  </div>
                }
              >
                <Button
                  type="primary"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedLevel('ALL')
                  }}
                  className="!rounded-2xl !bg-[#58cc02] font-black"
                >
                  Xem tất cả từ vựng
                </Button>
              </Empty>
            </Card>
          )}

          {!isWordsLoading && !isWordsError && wordsData && wordsData.content.length > 0 && (
            <>
              {/* Card Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {wordsData.content.map((word) => (
                    <Card
                      key={word.id}
                      hoverable
                      onClick={() => setSelectedWordId(word.id)}
                      className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 hover:!border-[#58CC02] !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] dark:hover:!border-[#58CC02] transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                      styles={{ body: { padding: '1.25rem' } }}
                    >
                      <div>
                        {/* Top row: Level tag & audio button */}
                        <div className="flex items-center justify-between mb-2">
                          {word.level ? (
                            <Tag
                              color={getLevelColor(word.level, levelCounts)}
                              className="!rounded-md !font-black !px-2.5 !m-0 !text-xs"
                            >
                              {word.level}
                            </Tag>
                          ) : (
                            <Tag className="!rounded-md !m-0 !text-xs">Chưa phân cấp</Tag>
                          )}

                          <PronounceButton
                            word={word.reading}
                            languageCode={selectedLanguageCode}
                            size={15}
                          />
                        </div>

                        {/* Word display */}
                        <div className="my-2">
                          {word.written ? (
                            <div>
                              <p className="text-xs font-bold text-[#58CC02] dark:text-[#79e32a] tracking-wide">
                                {word.reading}
                              </p>
                              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 group-hover:text-[#58CC02] transition-colors">
                                {word.written}
                              </h3>
                            </div>
                          ) : (
                            <div>
                              <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-[#58CC02] transition-colors">
                                {word.reading}
                              </h3>
                            </div>
                          )}
                        </div>

                        {/* Meanings */}
                        <div className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {word.meaningsVi.join(', ')}
                        </div>
                      </div>

                      {/* Bottom Footer: Part of speech */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {word.partOfSpeech.slice(0, 2).map((pos) => (
                            <span
                              key={pos}
                              className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                            >
                              {getPosLabel(pos)}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-[#1CB0F6] group-hover:translate-x-1 transition-transform">
                          Xem chi tiết →
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <Card
                  className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] overflow-hidden shadow-xs"
                  styles={{ body: { padding: 0 } }}
                >
                  <Table
                    dataSource={wordsData.content}
                    columns={tableColumns}
                    rowKey="id"
                    pagination={false}
                    onRow={(record) => ({
                      onClick: () => setSelectedWordId(record.id),
                      className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-[#131F24]',
                    })}
                    className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-slate-50 dark:[&_.ant-table-thead_th]:!bg-[#131F24] [&_.ant-table-thead_th]:!font-black [&_.ant-table-thead_th]:!text-xs [&_.ant-table-thead_th]:!uppercase"
                  />
                </Card>
              )}

              {/* Pagination Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Hiển thị từ{' '}
                  <span className="text-slate-800 dark:text-white font-black">
                    {wordsData.page * wordsData.size + 1}
                  </span>{' '}
                  đến{' '}
                  <span className="text-slate-800 dark:text-white font-black">
                    {Math.min((wordsData.page + 1) * wordsData.size, wordsData.totalElements)}
                  </span>{' '}
                  trong tổng số{' '}
                  <span className="text-[#58CC02] font-black">
                    {wordsData.totalElements.toLocaleString()}
                  </span>{' '}
                  từ
                </span>

                <Pagination
                  current={page + 1}
                  pageSize={pageSize}
                  total={wordsData.totalElements}
                  onChange={(newPage, newPageSize) => {
                    setPage(newPage - 1)
                    setPageSize(newPageSize)
                  }}
                  showSizeChanger
                  pageSizeOptions={['12', '20', '32', '48']}
                  className="font-bold"
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Word Detail Modal / Popup */}
      <Modal
        open={selectedWordId !== null}
        onCancel={() => setSelectedWordId(null)}
        footer={null}
        width={680}
        centered
        className="[&_.ant-modal-content]:!rounded-3xl [&_.ant-modal-content]:!border-2 [&_.ant-modal-content]:!border-b-4 [&_.ant-modal-content]:!border-slate-200 dark:[&_.ant-modal-content]:!border-[#2B3940] dark:[&_.ant-modal-content]:!bg-[#1A262C] [&_.ant-modal-content]:!p-6"
      >
        {isDetailLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spin size="large" />
            <p className="text-xs font-bold text-slate-400">Đang tải thông tin từ vựng...</p>
          </div>
        )}

        {!isDetailLoading && wordDetail && (
          <div className="space-y-6 animate-fade-in">
            {/* Header: Written, Reading, Pronunciation & Level */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {wordDetail.level && (
                    <Tag
                      color={getLevelColor(wordDetail.level, levelCounts)}
                      className="!rounded-md !font-black !px-2.5 !m-0"
                    >
                      {wordDetail.level}
                    </Tag>
                  )}
                  {wordDetail.partOfSpeech.map((pos) => (
                    <span
                      key={pos}
                      className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                    >
                      {getPosLabel(pos)}
                    </span>
                  ))}
                </div>

                <div className="flex items-baseline gap-3 pt-1">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                    {wordDetail.written || wordDetail.reading}
                  </h2>
                  <PronounceButton
                    word={wordDetail.reading}
                    languageCode={selectedLanguageCode}
                    size={20}
                  />
                </div>

                {wordDetail.written && (
                  <p className="text-sm font-bold text-[#58CC02] dark:text-[#79e32a]">
                    Phiên âm: {wordDetail.reading}
                  </p>
                )}
              </div>

              <div className="hidden sm:block">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-2xl font-black">
                  📖
                </div>
              </div>
            </div>

            {/* Meanings section */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Ý nghĩa tiếng Việt
              </h4>
              <div className="flex flex-wrap gap-2">
                {wordDetail.meaningsVi.map((meaning, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-xl bg-emerald-50 text-[#2B7A0B] dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 text-sm font-extrabold shadow-xs"
                  >
                    {meaning}
                  </span>
                ))}
              </div>

              {wordDetail.meaningsEn && wordDetail.meaningsEn.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                    English meanings
                  </h4>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {wordDetail.meaningsEn.join(' • ')}
                  </p>
                </div>
              )}
            </div>

            {/* Note & memory tips if available */}
            {wordDetail.note && (
              <div className="rounded-2xl border-2 border-amber-200 bg-[#FFF5CC]/70 p-3.5 dark:border-amber-800/60 dark:bg-amber-950/30">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-xs font-black mb-1">
                  <InfoCircleOutlined />
                  <span>Ghi chú &amp; Mẹo ngữ cảnh</span>
                </div>
                <p className="text-xs font-medium text-amber-950 dark:text-amber-200 leading-relaxed">
                  {wordDetail.note}
                </p>
              </div>
            )}

            {/* Stroke order diagram if word has Kanji */}
            {wordDetail.written && selectedLanguageCode === 'ja' && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Thứ tự nét viết chữ Hán (Stroke Order)
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131F24] border-2 border-slate-100 dark:border-slate-800 flex justify-center">
                  <WordStrokeOrder word={wordDetail.written} languageCode="ja" />
                </div>
              </div>
            )}

            {/* Example Sentences */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Câu ví dụ thực tế ({wordDetail.examples.length})
                </h4>
              </div>

              {wordDetail.examples.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  Chưa có câu ví dụ biên tập sẵn cho từ này. Bạn có thể nhờ AI Tutor tạo ví dụ ngay
                  bên dưới!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {wordDetail.examples.map((ex, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border-2 border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#131F24] space-y-1 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {ex.text}
                          </p>
                          {ex.reading && (
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                              {ex.reading}
                            </p>
                          )}
                        </div>
                        <PronounceButton
                          word={ex.text}
                          languageCode={selectedLanguageCode}
                          size={14}
                        />
                      </div>
                      <p className="text-xs font-bold text-[#58CC02] dark:text-[#79e32a] pt-1">
                        <span className="mr-1">👉</span>
                        {ex.translationVi}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Tutor Actions */}
            <div className="rounded-2xl border-2 border-b-4 border-purple-200 bg-purple-50 p-4 dark:border-purple-900/60 dark:bg-purple-950/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-base shadow-xs">
                  <RobotOutlined />
                </div>
                <div>
                  <p className="text-xs font-black text-purple-950 dark:text-purple-200">
                    Luyện tập từ vựng này với AI
                  </p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    Tạo thêm ví dụ hoặc trò chuyện thực hành với từ &quot;
                    {wordDetail.written || wordDetail.reading}&quot;
                  </p>
                </div>
              </div>

              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  setSelectedWordId(null)
                  navigate('/ai-tutor')
                }}
                className="!rounded-xl !bg-purple-600 hover:!bg-purple-700 !border-b-4 !border-purple-800 !text-white !font-black !text-xs shrink-0"
              >
                Mở AI Tutor 🚀
              </Button>
            </div>

            {/* Source Attribution */}
            {wordDetail.source && (
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>
                  Nguồn dữ liệu:{' '}
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {wordDetail.source.name}
                  </span>{' '}
                  ({wordDetail.source.license})
                </span>
                {wordDetail.source.url && (
                  <a
                    href={wordDetail.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1CB0F6] hover:underline"
                  >
                    Xem giấy phép
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
