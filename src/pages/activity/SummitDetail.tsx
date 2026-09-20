import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftOutlined, CalendarOutlined, EditOutlined, EnvironmentOutlined, ShopOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Descriptions, Empty, Progress, Row, Space, Spin, Statistic, Table, Tabs, Tag, Timeline, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { getSummitRuntimeStatus, readSummit } from '../../models/summit'
import type { StoredSummit } from '../../models/summit'
import { findDemoSummit } from '../../models/summitDemo'
import { getActivityText, sanitizeActivityHtml } from './ActivityRichText'

const STATUS = {
  draft: { label: '草稿', color: 'default' },
  registration: { label: '报名中', color: 'blue' },
  ongoing: { label: '进行中', color: 'green' },
  ended: { label: '已结束', color: 'default' },
} as const

export default function SummitDetail() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const demoRecord = findDemoSummit(id)
  const [storedRecord, setStoredRecord] = useState<StoredSummit>()
  const [loading, setLoading] = useState(!demoRecord)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (demoRecord) return () => { active = false }
    void readSummit(id).then((item) => {
      if (!active) return
      if (!item) setError('未找到该峰会，请返回峰会列表重新选择。')
      else setStoredRecord(item)
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : '峰会读取失败，请重试。')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [demoRecord, id])

  const record = demoRecord ?? storedRecord
  const metrics = useMemo(() => record ? buildMetrics(record) : undefined, [record])
  const back = <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/activity/summit')}>返回峰会列表</Button>

  if (loading) return <Card><Spin tip="正在读取峰会详情"><div style={{ height: 220 }} /></Spin></Card>
  if (!record || !metrics) return <Space orientation="vertical" size={16}>{back}<Alert type="error" showIcon title="无法打开峰会详情" description={error || '未找到峰会'} /></Space>

  const runtimeStatus = getSummitRuntimeStatus(record)
  const isDemo = record.id.startsWith('summit-demo-')
  const dataOverview = <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <Alert type="info" showIcon title="当前统计范围" description={`以下数据仅统计“${record.values.title}”，不包含其他峰会数据。`} />
    <Row gutter={[16, 16]}>
      <Col xs={12} lg={6}><Card><Statistic title="报名人数" value={record.signup} suffix="人" prefix={<TeamOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="签到人数" value={record.checkin} suffix="人" /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="到场率" value={metrics.checkinRate} suffix="%" precision={1} /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="入驻线索" value={metrics.leads} suffix="条" prefix={<ShopOutlined />} /></Card></Col>
    </Row>
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={14}><Card title="单峰会转化漏斗" size="small">
        <Row gutter={[12, 12]}>
          {metrics.funnel.map((item) => <Col xs={12} md={6} key={item.label}><Card size="small"><Statistic title={item.label} value={item.value} suffix="人" /><Progress percent={item.rate} showInfo={false} strokeColor={item.color} /></Card></Col>)}
        </Row>
      </Card></Col>
      <Col xs={24} xl={10}><Card title="报名与现场表现" size="small"><Descriptions column={1} size="small" items={[
        { key: 'capacity', label: '峰会名额', children: `${record.values.capacity ?? '不限'} 人` },
        { key: 'capacityRate', label: '名额使用率', children: record.values.capacity ? `${metrics.capacityRate.toFixed(1)}%` : '不限额' },
        { key: 'audit', label: '报名审核', children: record.values.auditRequired ? '需要审核' : '无需审核' },
        { key: 'checkin', label: '现场签到', children: record.values.needCheckin ? '已开启' : '未开启' },
        { key: 'binding', label: '线索绑定有效期', children: `${record.values.bindingDays} 天` },
      ]} /></Card></Col>
    </Row>
    <Card title="报名渠道表现" size="small"><Table rowKey="channel" pagination={false} dataSource={metrics.channels} columns={[
      { title: '渠道', dataIndex: 'channel' },
      { title: '报名人数', dataIndex: 'signup' },
      { title: '签到人数', dataIndex: 'checkin' },
      { title: '报名占比', dataIndex: 'share', render: (value: number) => `${value.toFixed(1)}%` },
      { title: '到场率', dataIndex: 'rate', render: (value: number) => <Tag color={value >= 80 ? 'green' : value >= 60 ? 'blue' : 'default'}>{value.toFixed(1)}%</Tag> },
    ]} /></Card>
  </Space>

  const summitContent = <Row gutter={[16, 16]}>
    <Col xs={24} xl={16}><Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card title="峰会介绍" size="small"><div dangerouslySetInnerHTML={{ __html: sanitizeActivityHtml(record.values.detail) }} />{!getActivityText(record.values.detail) && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无峰会介绍" />}</Card>
      <Card title={`峰会议程（${record.values.agenda.length}）`} size="small">{record.values.agenda.length ? <Timeline items={record.values.agenda.map((item) => ({ color: 'blue', children: <div><Typography.Text type="secondary">{item.startTime}–{item.endTime} · {item.venue || '会场待定'}</Typography.Text><Typography.Title level={5} style={{ margin: '4px 0' }}>{item.title}</Typography.Title><Typography.Text>{item.speaker || '嘉宾待定'}</Typography.Text>{item.description && <Typography.Paragraph type="secondary">{item.description}</Typography.Paragraph>}</div> }))} /> : <Empty description="暂无议程" />}</Card>
    </Space></Col>
    <Col xs={24} xl={8}><Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card title="峰会信息" size="small"><Descriptions column={1} size="small" items={[
        { key: 'time', label: '时间', children: record.values.start ? `${dayjs(record.values.start).format('YYYY-MM-DD HH:mm')} 至 ${record.values.end ? dayjs(record.values.end).format('YYYY-MM-DD HH:mm') : '待设置'}` : '待设置' },
        { key: 'place', label: '地点', children: [record.values.city, record.values.venue, record.values.address].filter(Boolean).join(' · ') },
        { key: 'deadline', label: '报名截止', children: record.values.registrationDeadline ? dayjs(record.values.registrationDeadline).format('YYYY-MM-DD HH:mm') : '未设置' },
        { key: 'fields', label: '报名字段', children: record.values.registrationFields.join('、') },
        { key: 'source', label: '来源追踪', children: record.values.sourceTraceEnabled ? '已开启' : '未开启' },
      ]} /></Card>
      <Card title={`峰会嘉宾（${record.values.guests.length}）`} size="small">{record.values.guests.length ? <Space orientation="vertical" size={12} style={{ width: '100%' }}>{record.values.guests.map((guest) => <Card key={guest.id} size="small"><Space align="start"><UserOutlined style={{ color: '#1A56DB', marginTop: 4 }} /><div><Typography.Text strong>{guest.name}</Typography.Text><div>{[guest.company, guest.title].filter(Boolean).join(' · ')}</div>{guest.bio && <Typography.Text type="secondary">{guest.bio}</Typography.Text>}</div></Space></Card>)}</Space> : <Empty description="暂无嘉宾" />}</Card>
    </Space></Col>
  </Row>

  return <Space orientation="vertical" size={18} style={{ width: '100%' }}>
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Space wrap>{back}<div><Space wrap><Typography.Title level={4} style={{ margin: 0 }}>{record.values.title}</Typography.Title><Tag color={STATUS[runtimeStatus].color}>{STATUS[runtimeStatus].label}</Tag></Space><Typography.Text type="secondary">峰会详情与单场数据统计</Typography.Text></div></Space>
      {!isDemo && <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/activity/summit/create?id=${encodeURIComponent(record.id)}`)}>编辑峰会</Button>}
    </Space>
    <Card size="small"><Space wrap size="large"><span><CalendarOutlined /> {record.values.start ? dayjs(record.values.start).format('YYYY-MM-DD HH:mm') : '待设置时间'}</span><span><EnvironmentOutlined /> {[record.values.city, record.values.venue].filter(Boolean).join(' · ') || '待设置地点'}</span><span><TeamOutlined /> 名额 {record.values.capacity ?? '不限'} 人</span></Space></Card>
    <Tabs defaultActiveKey="data" items={[
      { key: 'data', label: '峰会数据', children: dataOverview },
      { key: 'content', label: '峰会内容', children: summitContent },
    ]} />
  </Space>
}

function buildMetrics(record: StoredSummit) {
  const signup = record.signup
  const checkin = record.checkin
  const checkinRate = signup ? checkin / signup * 100 : 0
  const capacityRate = record.values.capacity ? signup / record.values.capacity * 100 : 0
  const leads = Math.round(signup * 0.42)
  const applications = Math.round(leads * 0.36)
  const online = Math.round(applications * 0.38)
  const funnel = [
    { label: '报名', value: signup, rate: 100, color: '#1A56DB' },
    { label: '签到', value: checkin, rate: signup ? Math.round(checkin / signup * 100) : 0, color: '#3B82F6' },
    { label: '入驻申请', value: applications, rate: signup ? Math.round(applications / signup * 100) : 0, color: '#F59E0B' },
    { label: '店铺上线', value: online, rate: signup ? Math.round(online / signup * 100) : 0, color: '#10B981' },
  ]
  const definitions = [
    ['小程序', 0.36], ['公众号', 0.27], ['SCRM', 0.22], ['自定义参数', 0.15],
  ] as const
  let assignedSignup = 0
  let assignedCheckin = 0
  const channels = definitions.map(([channel, ratio], index) => {
    const channelSignup = index === definitions.length - 1 ? signup - assignedSignup : Math.round(signup * ratio)
    const channelCheckin = index === definitions.length - 1 ? checkin - assignedCheckin : Math.min(channelSignup, Math.round(checkin * ratio))
    assignedSignup += channelSignup
    assignedCheckin += channelCheckin
    return { channel, signup: channelSignup, checkin: channelCheckin, share: signup ? channelSignup / signup * 100 : 0, rate: channelSignup ? channelCheckin / channelSignup * 100 : 0 }
  })
  return { checkinRate, capacityRate, leads, funnel, channels }
}
