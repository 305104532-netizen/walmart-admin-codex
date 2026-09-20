import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Empty, Input, Progress, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getSummitRuntimeStatus, readSummits } from '../../models/summit'
import type { StoredSummit } from '../../models/summit'
import { DEMO_SUMMITS } from '../../models/summitDemo'

const STATUS = {
  draft: { label: '草稿', color: 'default' },
  registration: { label: '报名中', color: 'blue' },
  ongoing: { label: '进行中', color: 'green' },
  ended: { label: '已结束', color: 'default' },
} as const
type SummitStatus = keyof typeof STATUS

export default function SummitList() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<StoredSummit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<SummitStatus>()

  const fetchRecords = useCallback(() => readSummits()
    .then((items) => { setRecords(items); setError('') })
    .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : '峰会读取失败，请重试。')), [])
  const load = useCallback(() => {
    setLoading(true)
    void fetchRecords().finally(() => setLoading(false))
  }, [fetchRecords])

  useEffect(() => {
    void fetchRecords().finally(() => setLoading(false))
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchRecords, load])

  const allRecords = useMemo(() => [...records, ...DEMO_SUMMITS], [records])
  const rows = useMemo(() => allRecords.filter((record) => {
    const text = keyword.trim().toLowerCase()
    if (text && ![record.values.title, record.values.shortTitle, record.values.city, record.values.venue].some((value) => value?.toLowerCase().includes(text))) return false
    if (status && getSummitRuntimeStatus(record) !== status) return false
    return true
  }), [allRecords, keyword, status])

  const columns: TableColumnsType<StoredSummit> = [
    { title: '峰会名称', width: 260, render: (_: unknown, record) => <Space orientation="vertical" size={2}>
      <Button type="link" style={{ padding: 0, height: 'auto', whiteSpace: 'normal', textAlign: 'left' }} onClick={() => navigate(`/activity/summit/detail/${encodeURIComponent(record.id)}`)}>{record.values.title || '未命名峰会'}</Button>
      <Typography.Text type="secondary">{record.values.slogan || record.id}</Typography.Text>
    </Space> },
    { title: '时间', width: 190, render: (_: unknown, record) => record.values.start ? <Space orientation="vertical" size={0}>
      <span>{dayjs(record.values.start).format('YYYY-MM-DD HH:mm')}</span>
      <Typography.Text type="secondary">至 {record.values.end ? dayjs(record.values.end).format('MM-DD HH:mm') : '待设置'}</Typography.Text>
    </Space> : '待设置' },
    { title: '城市 / 会场', width: 190, render: (_: unknown, record) => <Space orientation="vertical" size={0}><span>{record.values.city || '待设置'}</span><Typography.Text type="secondary">{record.values.venue || '待设置会场'}</Typography.Text></Space> },
    { title: '报名 / 名额', width: 150, render: (_: unknown, record) => <div><span>{record.signup} / {record.values.capacity ?? '不限'}</span>{record.values.capacity && <Progress percent={Math.min(100, Math.round(record.signup / record.values.capacity * 100))} showInfo={false} size="small" style={{ width: 90 }} />}</div> },
    { title: '签到', width: 90, render: (_: unknown, record) => record.values.needCheckin ? record.checkin : '未开启' },
    { title: '议程 / 嘉宾', width: 120, render: (_: unknown, record) => `${record.values.agenda.length} / ${record.values.guests.length}` },
    { title: '状态', width: 100, render: (_: unknown, record) => { const item = STATUS[getSummitRuntimeStatus(record)]; return <Tag color={item.color}>{item.label}</Tag> } },
    { title: '操作', width: 300, fixed: 'right', render: (_: unknown, record) => <Space size={0}>
      <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/activity/summit/detail/${encodeURIComponent(record.id)}`)}>查看详情</Button>
      {!record.id.startsWith('summit-demo-') && <Button type="link" onClick={() => navigate(`/activity/summit/create?id=${encodeURIComponent(record.id)}`)}>编辑</Button>}
      <Button type="link" onClick={() => navigate(`/activity/signup/${encodeURIComponent(record.id)}`)}>报名名单</Button>
      {record.values.needCheckin && <Button type="link" onClick={() => navigate(`/activity/checkin/${encodeURIComponent(record.id)}`)}>签到</Button>}
    </Space> },
  ]

  return <Space orientation="vertical" size={20} style={{ width: '100%' }}>
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div><Typography.Title level={4} style={{ margin: 0 }}>沃尔玛峰会管理</Typography.Title><Typography.Text type="secondary">独立配置峰会详情、议程、嘉宾、报名和现场签到</Typography.Text></div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/activity/summit/create')}>创建沃尔玛峰会</Button>
    </Space>
    <Alert type="info" showIcon title="峰会数据按单场查看" description="列表仅用于查找和管理峰会；报名、签到、到场率、入驻线索及渠道表现等统计数据请进入对应峰会详情查看。" />
    {error && <Alert type="error" showIcon title="无法读取峰会列表" description={error} action={<Button onClick={load}>重试</Button>} />}
    <Card size="small">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input aria-label="搜索峰会" prefix={<SearchOutlined />} placeholder="搜索峰会名称、城市或会场" value={keyword} onChange={(event) => setKeyword(event.target.value)} allowClear style={{ width: 260 }} />
        <Select aria-label="峰会状态" placeholder="全部状态" allowClear value={status} onChange={setStatus} style={{ width: 140 }} options={Object.entries(STATUS).map(([value, item]) => ({ value, label: item.label }))} />
        <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 场峰会` }} scroll={{ x: 1480 }} locale={{ emptyText: <Empty description="暂无峰会"><Button type="primary" onClick={() => navigate('/activity/summit/create')}>创建第一场峰会</Button></Empty> }} />
    </Card>
  </Space>
}
