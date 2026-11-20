import { Link } from 'react-router-dom'
import { Alert, Button, Card, Flex, Spin, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ArrowLeftOutlined, BookOutlined } from '@ant-design/icons'
import { useContentSources } from '@/hooks/useCurriculum'
import type { ContentSource } from '@/types/domain'

const linkClass = 'font-bold text-[#1CB0F6] hover:underline'

/** Public page: the licences of our content sources require visible attribution. */
export function SourcesPage() {
  const { data: sources, isLoading, isError } = useContentSources()

  const columns: ColumnsType<ContentSource> = [
    {
      title: 'Source Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div className="font-bold text-slate-800 dark:text-slate-100">
          {record.url ? (
            <a href={record.url} target="_blank" rel="noreferrer" className={linkClass}>
              {name}
            </a>
          ) : (
            name
          )}
        </div>
      ),
    },
    {
      title: 'Dataset Key',
      dataIndex: 'key',
      key: 'key',
      width: 140,
      render: (key: string) => (
        <Tag
          color="cyan"
          className="!rounded-md !font-extrabold !uppercase !px-2 !py-0.5 !text-[11px]"
        >
          {key}
        </Tag>
      ),
    },
    {
      title: 'Licence',
      dataIndex: 'license',
      key: 'license',
      width: 160,
      render: (license: string, record) => (
        <div>
          {record.licenseUrl ? (
            <a href={record.licenseUrl} target="_blank" rel="noreferrer" className={linkClass}>
              {license}
            </a>
          ) : (
            <Tag color="blue" className="!rounded-md !font-bold">
              {license}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Attribution & Terms',
      dataIndex: 'attribution',
      key: 'attribution',
      render: (attribution?: string) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {attribution || '—'}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F9FA] p-4 sm:p-6 lg:p-10 dark:bg-[#131F24] selection:bg-[#58CC02] selection:text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back navigation */}
        <div>
          <Link to="/">
            <Button
              icon={<ArrowLeftOutlined />}
              className="!rounded-2xl !border-2 !border-b-4 !border-slate-200 !bg-white px-4 !h-10 text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:!bg-slate-50 dark:!border-[#2B3940] dark:!bg-[#1A262C] dark:!text-slate-200"
            >
              Back to LearnFlow
            </Button>
          </Link>
        </div>

        {/* Header Banner */}
        <Card
          className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1A262C] shadow-sm"
          styles={{ body: { padding: '1.75rem' } }}
        >
          <Flex vertical align="center" gap={24} className="sm:flex-row text-center sm:text-left">
            <Flex
              align="center"
              justify="center"
              className="h-20 w-20 shrink-0 rounded-3xl bg-[#FFC800] text-4xl border-2 border-b-4 border-[#E5A500] shadow-sm"
            >
              <BookOutlined className="text-amber-900" />
            </Flex>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-[#202F36] px-3 py-1 mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Open Knowledge &amp; Attribution
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Data sources &amp; licences
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                LearnFlow&apos;s English, Chinese, and Japanese learning materials, stroke
                animations, and vocabulary datasets are built on generous open-source contributions
                from the global language-learning community.
              </p>
            </div>
          </Flex>
        </Card>

        {isLoading && (
          <Flex align="center" justify="center" className="py-12">
            <Spin size="large" />
          </Flex>
        )}

        {isError && (
          <Alert
            type="error"
            showIcon
            title="Could not load the source list."
            className="!rounded-2xl !border-2 !border-[#FF4B4B]/30 !bg-rose-50"
          />
        )}

        {/* Ant Design Table */}
        {sources && (
          <Card
            className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1A262C] overflow-hidden shadow-sm"
            styles={{ body: { padding: 0 } }}
          >
            <Table
              dataSource={sources}
              columns={columns}
              rowKey="key"
              pagination={false}
              className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-slate-50 dark:[&_.ant-table-thead_th]:!bg-[#131F24] [&_.ant-table-thead_th]:!font-black [&_.ant-table-thead_th]:!text-xs [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-wider"
            />
          </Card>
        )}
      </div>
    </div>
  )
}
