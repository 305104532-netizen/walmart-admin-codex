import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Drawer, Empty, Image, Input, Progress, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { CalendarOutlined, EnvironmentOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getSummitRuntimeStatus, readSummits } from '../../models/summit'
import type { StoredSummit } from '../../models/summit'
import { getActivityText, sanitizeActivityHtml } from './ActivityRichText'

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
  const [preview, setPreview] = useState<StoredSummit>()

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

  const rows = useMemo(() => records.filter((record) => {
    const text = keyword.trim().toLowerCase()
    if (text && ![record.values.title, record.values.shortTitle, record.values.city, record.values.venue].some((value) => value?.toLowerCase().includes(text))) return false
    if (status && getSummitRuntimeStatus(record) !== status) return false
    return true
  }), [keyword, records, status])
  const published = records.filter((record) => record.status === 'published')
  const totalSignup = records.reduce((sum, record) => sum + record.signup, 0)
  const totalCheckin = records.reduce((sum, record) => sum + record.checkin, 0)

  const columns: TableColumnsType<StoredSummit> = [
    { title: '峰会名称', width: 260, render: (_: unknown, record) => <Space orientation="vertical" size={2}>
      <Button type="link" style={{ padding: 0, height: 'auto', whiteSpace: 'normal', textAlign: 'left' }} onClick={() => navigate(`/activity/summit/create?id=${encodeURIComponent(record.id)}`)}>{record.values.title || '未命名峰会'}</Button>
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
    { title: '操作', width: 250, fixed: 'right', render: (_: unknown, record) => <Space size={0}>
      <Button type="link" icon={<EyeOutlined />} onClick={() => setPreview(record)}>预览</Button>
      <Button type="link" onClick={() => navigate(`/activity/summit/create?id=${encodeURIComponent(record.id)}`)}>编辑</Button>
      <Button type="link" onClick={() => navigate(`/activity/signup/${encodeURIComponent(record.id)}`)}>报名名单</Button>
      {record.values.needCheckin && <Button type="link" onClick={() => navigate(`/activity/checkin/${encodeURIComponent(record.id)}`)}>签到</Button>}
    </Space> },
  ]

  return <Space orientation="vertical" size={20} style={{ width: '100%' }}>
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div><Typography.Title level={4} style={{ margin: 0 }}>沃尔玛峰会管理</Typography.Title><Typography.Text type="secondary">独立配置峰会详情、议程、嘉宾、报名和现场签到</Typography.Text></div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/activity/summit/create')}>创建沃尔玛峰会</Button>
    </Space>
    <Alert type="info" showIcon title="峰会专属后台" description="发布后的峰会可在小程序活动日历和列表中展示，详情页包含峰会介绍、时间线议程和嘉宾卡片。当前为本地功能预览，数据保存在此浏览器。" />
    <Row gutter={[16, 16]}>
      <Col xs={12} lg={6}><Card><Statistic title="峰会总数" value={records.length} prefix={<CalendarOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="已发布" value={published.length} styles={{ content: { color: '#10B981' } }} /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="累计报名" value={totalSignup} prefix={<TeamOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="累计签到" value={totalCheckin} styles={{ content: { color: '#1A56DB' } }} /></Card></Col>
    </Row>
    {error && <Alert type="error" showIcon title="无法读取峰会列表" description={error} action={<Button onClick={load}>重试</Button>} />}
    <Card size="small">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input aria-label="搜索峰会" prefix={<SearchOutlined />} placeholder="搜索峰会名称、城市或会场" value={keyword} onChange={(event) => setKeyword(event.target.value)} allowClear style={{ width: 260 }} />
        <Select aria-label="峰会状态" placeholder="全部状态" allowClear value={status} onChange={setStatus} style={{ width: 140 }} options={Object.entries(STATUS).map(([value, item]) => ({ value, label: item.label }))} />
        <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 场峰会` }} scroll={{ x: 1480 }} locale={{ emptyText: <Empty description="暂无峰会"><Button type="primary" onClick={() => navigate('/activity/summit/create')}>创建第一场峰会</Button></Empty> }} />
    </Card>
    <Drawer title="小程序峰会详情预览" size="min(620px, 92vw)" open={!!preview} onClose={() => setPreview(undefined)}>
      {preview && <Space orientation="vertical" size={18} style={{ width: '100%' }}>
        {preview.values.cover ? <Image src={preview.values.cover} alt="峰会封面" width="100%" style={{ maxHeight: 280, objectFit: 'cover', borderRadius: 8 }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未上传峰会封面" />}
        <div><Space wrap><Tag color="orange">线下峰会</Tag><Tag color={STATUS[getSummitRuntimeStatus(preview)].color}>{STATUS[getSummitRuntimeStatus(preview)].label}</Tag></Space><Typography.Title level={3}>{preview.values.title}</Typography.Title><Typography.Paragraph type="secondary">{preview.values.slogan}</Typography.Paragraph></div>
        <Space orientation="vertical"><span><CalendarOutlined /> {preview.values.start ? dayjs(preview.values.start).format('YYYY-MM-DD HH:mm') : '待设置时间'}</span><span><EnvironmentOutlined /> {[preview.values.city, preview.values.venue].filter(Boolean).join(' · ') || '待设置地点'}</span><span><TeamOutlined /> 已报名 {preview.signup} 人</span></Space>
        <Card size="small" title="峰会介绍"><div dangerouslySetInnerHTML={{ __html: sanitizeActivityHtml(preview.values.detail) }} />{!getActivityText(preview.values.detail) && <Empty description="暂无介绍" />}</Card>
        <Card size="small" title={`峰会议程（${preview.values.agenda.length}）`}>{preview.values.agenda.length ? preview.values.agenda.map((item) => <div key={item.id} style={{ borderLeft: '2px solid #1A56DB', padding: '0 0 16px 16px' }}><Typography.Text type="secondary">{item.startTime}–{item.endTime}</Typography.Text><div><strong>{item.title}</strong></div><Typography.Text type="secondary">{[item.speaker, item.venue].filter(Boolean).join(' · ')}</Typography.Text></div>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无议程" />}</Card>
        <Card size="small" title={`峰会嘉宾（${preview.values.guests.length}）`}>{preview.values.guests.length ? preview.values.guests.map((guest) => <Card key={guest.id} size="small" style={{ marginBottom: 8 }}><Space>{guest.avatar && <Image src={guest.avatar} width={56} height={56} style={{ objectFit: 'cover', borderRadius: '50%' }} />}<div><strong>{guest.name}</strong><div>{[guest.company, guest.title].filter(Boolean).join(' · ')}</div><Typography.Text type="secondary">{guest.bio}</Typography.Text></div></Space></Card>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无嘉宾" />}</Card>
        {preview.values.allowRegister && <Button type="primary" block disabled>立即报名</Button>}
      </Space>}
    </Drawer>
  </Space>
}
