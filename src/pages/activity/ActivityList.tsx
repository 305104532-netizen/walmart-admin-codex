import { Alert, Table, Tag, Button, Space, Input, Select, DatePicker, Progress } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { getActivityStatus, readSavedActivities } from '../../models/activity'
import type { StoredActivity } from '../../models/activity'
import { DEMO_ACTIVITIES } from '../../models/activityDemo'

interface Act {
  id: string
  title: string
  mode: string
  kind: string
  city: string
  time: string
  signup: number
  capacity: number | null
  status: SK
  configured: boolean
}

const STATUS = {
  draft: { t: '草稿', c: 'default' },
  upcoming: { t: '未开始', c: 'blue' },
  ongoing: { t: '进行中', c: 'green' },
  ended: { t: '已结束', c: 'default' },
}
type SK = keyof typeof STATUS
const MODES: Record<string, { label: string; color: string }> = {
  online: { label: '线上', color: 'blue' },
  offline: { label: '线下', color: 'orange' },
  hybrid: { label: '线上 + 线下', color: 'purple' },
}
const KIND_LABELS: Record<string, string> = { summit: '线下峰会', live: '线上直播', workshop: '工作坊' }

function toRow(record: StoredActivity, configured: boolean): Act {
  const values = record.values
  return {
    id: record.id,
    title: typeof values.title === 'string' && values.title.trim() ? values.title : '未命名活动',
    mode: typeof values.mode === 'string' ? values.mode : '',
    kind: typeof values.kind === 'string' ? (KIND_LABELS[values.kind] ?? values.kind) : '',
    city: typeof values.city === 'string' ? values.city : '',
    time: typeof values.start === 'string' && dayjs(values.start).isValid() ? values.start : '',
    signup: record.signup,
    capacity: values.capacityLimited !== false && typeof values.capacity === 'number' && values.capacity > 0 ? values.capacity : null,
    status: getActivityStatus(record),
    configured,
  }
}

export default function ActivityList() {
  const navigate = useNavigate()
  const [kw, setKw] = useState('')
  const [mode, setMode] = useState<string>()
  const [kind, setKind] = useState<string>()
  const [city, setCity] = useState<string>()
  const [status, setStatus] = useState<SK>()
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [records, setRecords] = useState<StoredActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState('')
  const loadActivities = useCallback(() => readSavedActivities()
    .then((saved) => {
      setRecords(saved)
      setStorageError('')
    })
    .catch((error: unknown) => {
      setStorageError(error instanceof Error ? error.message : '读取已保存活动失败，请重试。')
    })
    .finally(() => setLoading(false)), [])

  useEffect(() => {
    void loadActivities()
    const onFocus = () => { setLoading(true); void loadActivities() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadActivities])

  const refreshActivities = () => {
    setLoading(true)
    void loadActivities()
  }

  const rows = useMemo(() => [
    ...records.map((record) => toRow(record, true)),
    ...DEMO_ACTIVITIES.map((record) => toRow(record, false)),
  ], [records])
  const cities = [...new Set(rows.map((row) => row.city).filter(Boolean))]
  const kinds = [...new Set(rows.map((row) => row.kind).filter(Boolean))]

  const columns = [
    { title: '活动名称', dataIndex: 'title', ellipsis: true, width: 230, render: (title: string, row: Act) => <Link to={`/activity/detail/${encodeURIComponent(row.id)}`}>{title}</Link> },
    { title: '形式', dataIndex: 'mode', width: 120, render: (value: string) => MODES[value] ? <Tag color={MODES[value].color}>{MODES[value].label}</Tag> : '—' },
    { title: '类型', dataIndex: 'kind', width: 100, render: (value: string) => value || '—' },
    { title: '城市', dataIndex: 'city', width: 90, render: (value: string) => value || '—' },
    { title: '开始时间', dataIndex: 'time', width: 160, render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '待设置' },
    { title: '报名/容量', width: 130, render: (_: unknown, row: Act) => <div>
      <span>{row.signup} / {row.capacity ?? '不限'}</span>
      {row.capacity !== null && <Progress percent={Math.min(100, Math.round((row.signup / row.capacity) * 100))} size="small" showInfo={false} style={{ display: 'block', width: 80, margin: 0 }} />}
    </div> },
    { title: '状态', dataIndex: 'status', width: 90, render: (value: SK) => <Tag color={STATUS[value].c}>{STATUS[value].t}</Tag> },
    { title: '数据来源', dataIndex: 'configured', width: 110, render: (configured: boolean) => <Tag color={configured ? 'cyan' : 'default'}>{configured ? '已配置活动' : '演示数据'}</Tag> },
    { title: '操作', width: 320, render: (_: unknown, row: Act) => <Space wrap>
      <Link to={`/activity/detail/${encodeURIComponent(row.id)}`}>查看详情</Link>
      {row.configured ? <a onClick={() => navigate(`/activity/create?id=${encodeURIComponent(row.id)}`)}>编辑配置</a> : <>
        <a onClick={() => navigate('/activity/signup/' + row.id)}>报名管理</a>
        <a onClick={() => navigate('/activity/checkin/' + row.id)}>签到</a>
        <a onClick={() => navigate('/activity/leads')}>转化</a>
      </>}
    </Space> },
  ]

  const filtered = rows.filter((row) => {
    if (kw.trim() && !row.title.toLocaleLowerCase().includes(kw.trim().toLocaleLowerCase())) return false
    if (mode && row.mode !== mode) return false
    if (kind && row.kind !== kind) return false
    if (city && row.city !== city) return false
    if (status && row.status !== status) return false
    if (dates?.[0] || dates?.[1]) {
      if (!row.time) return false
      const startTime = dayjs(row.time).valueOf()
      if (dates[0] && startTime < dates[0].startOf('day').valueOf()) return false
      if (dates[1] && startTime > dates[1].endOf('day').valueOf()) return false
    }
    return true
  })

  return (
    <div>
      {storageError && <Alert type="error" showIcon title="无法读取已保存活动" description={storageError} action={<Button onClick={refreshActivities}>重试</Button>} style={{ marginBottom: 16 }} />}
      <Space style={{ marginBottom: 16 }} wrap>
        <Select aria-label="活动形式" placeholder="形式" style={{ width: 140 }} allowClear value={mode} onChange={setMode} options={Object.entries(MODES).map(([value, item]) => ({ value, label: item.label }))} />
        <Select aria-label="活动类型" placeholder="类型" style={{ width: 120 }} allowClear value={kind} onChange={setKind} options={kinds.map((value) => ({ value, label: value }))} />
        <Select aria-label="活动城市" placeholder="城市" style={{ width: 120 }} allowClear value={city} onChange={setCity} options={cities.map((value) => ({ value, label: value }))} />
        <Select aria-label="活动状态" placeholder="状态" style={{ width: 120 }} allowClear value={status} onChange={setStatus} options={Object.entries(STATUS).map(([value, item]) => ({ value, label: item.t }))} />
        <DatePicker.RangePicker value={dates} onChange={setDates} placeholder={['开始时间起', '开始时间止']} />
        <Input aria-label="搜索活动名" placeholder="搜索活动名" prefix={<SearchOutlined />} style={{ width: 200 }} value={kw} onChange={(event) => setKw(event.target.value)} allowClear />
        <Button icon={<ReloadOutlined />} onClick={refreshActivities} loading={loading}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/activity/create')}>创建活动</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} pagination={{ pageSize: 15, showTotal: (total) => `共 ${total} 个活动` }} scroll={{ x: 1450 }} />
    </div>
  )
}
