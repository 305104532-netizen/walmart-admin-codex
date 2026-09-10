import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Button, Card, Col, Descriptions, Empty, Image, Result, Row, Space, Spin, Statistic, Tabs, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { getActivityStatus, readSavedActivity } from '../../models/activity'
import type { StoredActivity } from '../../models/activity'
import { findDemoActivity } from '../../models/activityDemo'
import { getActivityText, sanitizeActivityHtml } from './ActivityRichText'
import ActivityMeetingDetails from './ActivityMeetingDetails'

const { Title, Text } = Typography
const STATUS = {
  draft: { label: '草稿', color: 'default' },
  upcoming: { label: '未开始', color: 'blue' },
  ongoing: { label: '进行中', color: 'green' },
  ended: { label: '已结束', color: 'default' },
}
const MODES: Record<string, string> = { online: '线上', offline: '线下', hybrid: '线上 + 线下' }
const KINDS: Record<string, string> = { summit: '线下峰会', live: '线上直播', workshop: '工作坊' }
const display = (value: unknown, fallback = '未设置') => typeof value === 'string' && value.trim() ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : fallback
const enumLabel = (labels: Record<string, string>, value: unknown, fallback = '未设置') => {
  const key = display(value, '')
  return Object.hasOwn(labels, key) ? labels[key] : display(value, fallback)
}
const enabled = (value: unknown): ReactNode => typeof value === 'boolean' ? <Tag color={value ? 'green' : 'default'}>{value ? '已开启' : '未开启'}</Tag> : '未设置'
const time = (value: unknown, dateOnly = false) => typeof value === 'string' && value && dayjs(value).isValid() ? dayjs(value).format(dateOnly ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm') : '待设置'
const httpUrl = (value: unknown) => {
  if (typeof value !== 'string') return ''
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : '' }
  catch { return '' }
}
const imageUrl = (value: unknown) => typeof value === 'string' && /^data:image\/(?:png|jpeg|webp|gif)(?:;name=[^;,]*)?;base64,[A-Za-z0-9+/=]+$/.test(value) ? value : httpUrl(value)
const audioUrl = (value: unknown) => typeof value === 'string' && /^data:audio\/(?:mpeg|mp3|x-mpeg)(?:;name=[^;,]*)?;base64,[A-Za-z0-9+/=]+$/.test(value) ? value : httpUrl(value)

function Info({ items }: { items: [string, ReactNode][] }) {
  return <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 2 }} styles={{ content: { overflowWrap: 'anywhere' } }} items={items.map(([label, children]) => ({ key: label, label, children }))} />
}

export default function ActivityDetail() {
  const { id } = useParams()
  return <ActivityDetailContent key={id ?? ''} activityId={id} />
}

function ActivityDetailContent({ activityId }: { activityId?: string }) {
  const navigate = useNavigate()
  const [record, setRecord] = useState<StoredActivity>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [loadedAt, setLoadedAt] = useState(() => Date.now())
  const demo = activityId ? findDemoActivity(activityId) : undefined
  const reload = () => { setLoading(true); setError(''); setRevision(value => value + 1) }

  useEffect(() => {
    let cancelled = false
    const request = demo ? Promise.resolve(demo) : activityId ? readSavedActivity(activityId) : Promise.resolve(undefined)
    request.then(value => { if (!cancelled) { setRecord(value); setLoadedAt(Date.now()) } })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : '活动读取失败，请重试。') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activityId, demo, revision])

  const back = <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/activity/list')}>返回活动列表</Button>
  if (loading) return <><div style={{ marginBottom: 24 }}>{back}</div><div role="status" aria-live="polite" aria-label="正在加载活动详情" style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /><div style={{ marginTop: 16 }}>正在加载活动详情…</div></div></>
  if (error) return <Result status="error" title="无法读取活动详情" subTitle={error} extra={<Space>{back}<Button type="primary" onClick={reload}>重试</Button></Space>} />
  if (!record) return <Result status="404" title="未找到活动" subTitle="该活动不存在，或尚未保存在当前浏览器中。请返回列表重新选择。" extra={back} />

  const values = record.values
  const modeLabel = enumLabel(MODES, values.mode, '')
  const activityStatus = getActivityStatus(record)
  const status = STATUS[activityStatus]
  const allowRegister = values.allowRegister !== false
  const hasCapacity = values.capacityLimited !== false && typeof values.capacity === 'number' && values.capacity > 0
  const capacity = allowRegister ? hasCapacity ? `${values.capacity} 人` : '不限人数' : '报名未开放'
  const deadlinePassed = values.deadlineEnabled === true && typeof values.registrationDeadline === 'string' && Date.parse(values.registrationDeadline) <= loadedAt
  const signupStatus = record.status === 'draft' ? '草稿未开放'
    : !allowRegister ? '已关闭'
    : activityStatus === 'ended' ? '已结束'
    : deadlinePassed ? '已截止'
    : hasCapacity && record.signup >= (values.capacity as number) ? '名额已满' : '可报名'
  const cover = imageUrl(values.cover)
  const listCover = imageUrl(values.listCover) || cover
  const audio = audioUrl(values.audio)
  const liveUrl = httpUrl(values.liveUrl)
  const rawDetail = typeof values.detail === 'string' ? values.detail : ''
  const detail = sanitizeActivityHtml(rawDetail)
  const isOffline = values.mode === 'offline' || values.mode === 'hybrid'
  const isOnline = values.mode === 'online' || values.mode === 'hybrid'
  const overview: [string, ReactNode][] = [
    ['顶部标题', display(values.topTitle)],
    ['活动类型', enumLabel(KINDS, values.kind)],
    ['活动形式', enumLabel(MODES, values.mode)],
    ['主讲人', display(values.speaker)],
    ['开始时间', time(values.start, values.dateOnly === true)],
    ['结束时间', time(values.end, values.dateOnly === true)],
    ['城市', display(values.city)],
    ...(isOffline ? [['活动地点', display(values.location)] as [string, ReactNode]] : []),
    ...(isOnline ? [
      ['直播 / 会议平台', display(values.livePlatform)],
      ['提前进入直播', typeof values.earlyEntryMinutes === 'number' ? `${values.earlyEntryMinutes} 分钟` : '未设置'],
      ['直播 / 会议链接', liveUrl ? <Typography.Link key="live-url" href={liveUrl} target="_blank" rel="noopener noreferrer">打开直播 / 会议链接</Typography.Link> : '未设置'],
    ] as [string, ReactNode][] : []),
    ['首页列表展示', enabled(values.showInList)],
    ['仅显示日期', enabled(values.dateOnly)],
    ['显示倒计时', enabled(values.showCountdown)],
    ['留资设置', enabled(values.leadCapture)],
    ...(allowRegister ? [['报名截止时间', values.deadlineEnabled === true ? time(values.registrationDeadline) : '未设置单独截止时间'] as [string, ReactNode]] : []),
  ]

  return <Space orientation="vertical" size={20} style={{ width: '100%' }}>
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Space wrap>{back}<Title level={4} style={{ margin: 0 }}>活动详情</Title></Space>
      <Space wrap>
        <Button icon={<ReloadOutlined />} onClick={reload}>刷新详情</Button>
        {!demo && <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/activity/create?id=${encodeURIComponent(record.id)}`)}>编辑活动</Button>}
      </Space>
    </Space>
    <Alert type="info" showIcon title={demo ? '演示活动' : '已保存活动'} description={demo ? '当前展示演示活动的信息与配置。' : '当前展示保存在此浏览器中的活动信息与会议配置。'} />
    <Card>
      <Row gutter={[24, 20]} align="middle">
        <Col xs={24} md={8}>
          {cover ? <Image src={cover} alt="活动封面" width="100%" style={{ maxHeight: 240, objectFit: 'contain', borderRadius: 8, background: '#f5f7fb' }} /> : <div style={{ padding: 24, background: '#f5f7fb', borderRadius: 8 }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无活动封面" /></div>}
        </Col>
        <Col xs={24} md={16}>
          <Space wrap><Tag color={status.color}>{status.label}</Tag><Tag>{demo ? '演示数据' : '已配置活动'}</Tag>{modeLabel && <Tag color="blue">{modeLabel}</Tag>}</Space>
          <Title level={3} style={{ margin: '12px 0', overflowWrap: 'anywhere' }}>{display(values.title, '未命名活动')}</Title>
          <Text type="secondary" style={{ overflowWrap: 'anywhere' }}>活动编号：{record.id}</Text>
          <Row gutter={[24, 16]} style={{ marginTop: 24 }}>
            <Col xs={12} sm={8}><Statistic title="报名人数" value={record.signup} suffix="人" /></Col>
            <Col xs={12} sm={8}><Statistic title="报名名额" value={capacity} styles={{ content: { fontSize: 22 } }} /></Col>
            <Col xs={24} sm={8}><Statistic title="报名状态" value={signupStatus} styles={{ content: { fontSize: 22 } }} /></Col>
          </Row>
        </Col>
      </Row>
    </Card>
    <Tabs items={[
      { key: 'overview', label: '活动信息', children: <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <Card title="基本信息"><Info items={overview} /></Card>
        <Card title="活动详情 / 会议正文">
          {getActivityText(rawDetail) ? <div style={{ lineHeight: 1.8, overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: detail }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无活动正文" />}
        </Card>
        <Card title="活动素材"><Row gutter={[24, 24]}>
          <Col xs={24} md={12}><div style={{ marginBottom: 12 }}>列表封面{!values.listCover && listCover && <Text type="secondary">（使用活动封面）</Text>}</div>{listCover ? <Image src={listCover} alt="列表封面" width={240} height={140} style={{ objectFit: 'contain' }} /> : <Text type="secondary">未上传</Text>}</Col>
          <Col xs={24} md={12}><div style={{ marginBottom: 12 }}>会议音频</div>{audio ? <audio src={audio} controls preload="none" aria-label="会议音频" style={{ width: '100%', maxWidth: 400 }} /> : <Text type="secondary">未上传</Text>}</Col>
        </Row></Card>
        <Card title="记录信息"><Info items={[
          ['保存状态', record.status === 'draft' ? '草稿' : '已发布'],
          ['数据来源', demo ? '演示数据' : '当前浏览器保存'],
          ['创建时间', time(record.createdAt)],
          ['更新时间', time(record.updatedAt)],
        ]} /></Card>
      </Space> },
      { key: 'meeting', label: '会议配置', children: <ActivityMeetingDetails values={values} /> },
      { key: 'conversion', label: '转化与溯源', children: <Card title="转化与溯源配置">
        <Info items={[
          ['开放报名', enabled(allowRegister)],
          ['需要签到', enabled(values.needCheckin)],
          ['课后问卷', enabled(values.needSurvey)],
          ['签到后引导入驻', enabled(Boolean(values.needCheckin && values.leadToRegister))],
          ['线索绑定有效期', typeof values.bindingDays === 'number' ? `${values.bindingDays} 天` : '未设置'],
        ]} />
        <Alert type="info" showIcon title="活动归属" description="活动签到后直接提交入驻申请的卖家，以该活动作为“所属活动”的归属依据。" style={{ marginTop: 20 }} />
      </Card> },
    ]} />
  </Space>
}
