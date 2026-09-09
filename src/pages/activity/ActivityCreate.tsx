import { useEffect, useState } from 'react'
import { Alert, Button, Card, Checkbox, Col, DatePicker, Descriptions, Form, Input, InputNumber, Radio, Row, Select, Space, Spin, Switch, Tabs, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined, CalendarOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { readSavedActivity, saveActivity } from '../../models/activity'
import type { ActivityConfig, StoredActivity } from '../../models/activity'
import MeetingSettings, { MEETING_DEFAULTS } from './MeetingSettings'
import ActivityMediaField from './ActivityMediaField'
import ActivityRichText, { getActivityText, sanitizeActivityHtml } from './ActivityRichText'

const { Text, Title, Paragraph } = Typography
const BASIC_FIELDS = new Set(['title', 'topTitle', 'mode', 'kind', 'start', 'end', 'registrationDeadline', 'city', 'location', 'cover', 'listCover', 'detail', 'liveUrl', 'livePlatform', 'speaker', 'earlyEntryMinutes', 'audio'])
const CONVERSION_FIELDS = new Set(['cpManager', 'bindingDays', 'allowRegister', 'needCheckin', 'needSurvey', 'leadToRegister'])
type ActivityFormValues = Omit<ActivityConfig, 'start' | 'end' | 'registrationDeadline'> & {
  start?: Dayjs | null
  end?: Dayjs | null
  registrationDeadline?: Dayjs | null
}
const DEFAULTS = {
  ...MEETING_DEFAULTS, topTitle: '活动详情', mode: 'offline', kind: '线下峰会', showInList: true,
  dateOnly: false, deadlineEnabled: false, showCountdown: false, leadCapture: false,
  livePlatform: '展视互动', earlyEntryMinutes: 10, needCheckin: true, needSurvey: false,
  allowRegister: true, leadToRegister: true, bindingDays: 30,
}
const HTTP_URL = /^https?:\/\/[^\s/]+(?:[/?#][^\s]*)?$/i

export default function ActivityCreate() {
  const [form] = Form.useForm<ActivityFormValues>()
  const [query] = useSearchParams()
  const activityId = query.get('id') ?? undefined
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(!!activityId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<StoredActivity>()
  const [loadError, setLoadError] = useState('')
  const [mediaBusy, setMediaBusy] = useState<Record<string, boolean>>({})
  const [messageApi, messageContext] = message.useMessage()
  const values = Form.useWatch([], form) as ActivityFormValues | undefined
  const mode = values?.mode ?? DEFAULTS.mode
  const allowRegister = values?.allowRegister ?? true
  const needCheckin = values?.needCheckin ?? true
  const isPublished = saved?.status === 'published'
  const hasBusyMedia = Object.values(mediaBusy).some(Boolean)

  useEffect(() => {
    let cancelled = false
    form.resetFields()
    setSaved(undefined)
    setLoadError('')
    if (!activityId) { setLoading(false); return }
    setLoading(true)
    readSavedActivity(activityId).then((record) => {
      if (cancelled) return
      if (!record) { setLoadError('未找到该活动，请返回活动列表重新选择。'); return }
      setSaved(record)
      const data = record.values
      form.setFieldsValue({ ...DEFAULTS, ...data,
        start: data.start ? dayjs(data.start) : null,
        end: data.end ? dayjs(data.end) : null,
        registrationDeadline: data.registrationDeadline ? dayjs(data.registrationDeadline) : null,
      })
    }).catch(() => { if (!cancelled) setLoadError('活动读取失败，请确认浏览器允许保存站点数据后重试。') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activityId, form])

  const persist = async (status: 'draft' | 'published') => {
    if (saving || loading || loadError || hasBusyMedia) return
    setSaving(true)
    try {
      const data = form.getFieldsValue(true)
      const config: ActivityConfig = { ...data,
        title: String(data.title ?? '').trim(),
        detail: sanitizeActivityHtml(String(data.detail ?? '')),
        start: data.start?.toISOString() ?? null,
        end: data.end?.toISOString() ?? null,
        registrationDeadline: data.deadlineEnabled ? data.registrationDeadline?.toISOString() ?? null : null,
        leadToRegister: Boolean(data.needCheckin && data.leadToRegister),
      }
      await saveActivity(config, status, activityId)
      messageApi.success(status === 'draft' ? '草稿已保存到本地' : isPublished ? '活动配置已更新' : '活动已在本地发布')
      navigate('/activity/list')
    } catch {
      messageApi.error('保存失败，请检查浏览器存储空间或减少附件后重试。填写内容已保留。')
    } finally { setSaving(false) }
  }
  const dateValidation = (other: 'start' | 'end', messageText: string) => ({
    validator: (_: unknown, date?: Dayjs) => {
      const otherDate = form.getFieldValue(other) as Dayjs | undefined
      return !date || !otherDate || (other === 'start' ? date.isAfter(otherDate) : date.isBefore(otherDate))
        ? Promise.resolve() : Promise.reject(new Error(messageText))
    },
  })
  const busy = (field: string) => (isBusy: boolean) => setMediaBusy((current) => ({ ...current, [field]: isBusy }))
  const basic = <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <Card title="活动与会议信息" size="small">
      <Row gutter={20}>
        <Col xs={24} md={8}><Form.Item label="顶部标题" name="topTitle" rules={[{ required: true, whitespace: true, message: '请输入顶部标题' }]}><Input maxLength={12} showCount placeholder="活动详情" /></Form.Item></Col>
        <Col xs={24} md={16}><Form.Item label="活动名称 / 会议名称" name="title" rules={[{ required: true, whitespace: true, message: '请输入活动名称' }]}><Input maxLength={64} showCount placeholder="如 2026沃尔玛卖家峰会" /></Form.Item></Col>
      </Row>
      <Form.Item name="showInList" valuePropName="checked"><Checkbox>显示在活动首页列表中</Checkbox></Form.Item>
      <Row gutter={20}>
        <Col xs={24} md={12}><Form.Item label="活动形式" name="mode"><Radio.Group options={[{ value: 'online', label: '线上' }, { value: 'offline', label: '线下' }]} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="活动类型 / 会议分类" name="kind" rules={[{ required: true, message: '请选择活动分类' }]}><Select options={['线上直播', '线下峰会', '工作坊', '分享会'].map((label) => ({ value: label, label }))} /></Form.Item></Col>
      </Row>
      <Row gutter={20}>
        <Col xs={24} md={12}><Form.Item label="开始时间" name="start" dependencies={['end']} rules={[{ required: true, message: '请选择开始时间' }, dateValidation('end', '开始时间必须早于结束时间')]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="结束时间" name="end" dependencies={['start']} rules={[{ required: true, message: '请选择结束时间' }, dateValidation('start', '结束时间必须晚于开始时间')]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
      <Space wrap size={24}>
        <Form.Item name="dateOnly" valuePropName="checked"><Checkbox>仅显示日期</Checkbox></Form.Item>
        <Form.Item name="showCountdown" valuePropName="checked"><Checkbox>显示倒计时</Checkbox></Form.Item>
        <Form.Item name="leadCapture" valuePropName="checked" tooltip="启用后使用会议配置中的留资表单采集参与者信息"><Checkbox>启用留资设置</Checkbox></Form.Item>
      </Space>
      {allowRegister && <>
        <Form.Item label="设置报名截止时间" name="deadlineEnabled" valuePropName="checked"><Switch /></Form.Item>
        {Boolean(values?.deadlineEnabled) && <Form.Item label="报名截止时间" name="registrationDeadline" dependencies={['start']} rules={[{ required: true, message: '请选择报名截止时间' }, { validator: (_: unknown, date?: Dayjs) => !date || !values?.start || !date.isAfter(values.start) ? Promise.resolve() : Promise.reject(new Error('报名截止时间不能晚于活动开始时间')) }]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>}
      </>}
      <Row gutter={20}>
        <Col xs={24} md={12}><Form.Item label="城市" name="city" rules={mode === 'offline' ? [{ required: true, whitespace: true, message: '请输入活动城市' }] : []}><Input placeholder={mode === 'offline' ? '如 深圳' : '线上'} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="主讲人" name="speaker"><Input maxLength={100} showCount placeholder="请输入主讲人信息" /></Form.Item></Col>
      </Row>
      {mode === 'offline'
        ? <Form.Item label="活动地点" name="location" rules={[{ required: true, whitespace: true, message: '请输入线下活动地点' }]}><Input placeholder="请输入详细会场地址" /></Form.Item>
        : <>
          <Row gutter={20}>
            <Col xs={24} md={12}><Form.Item label="直播 / 会议平台" name="livePlatform"><Select options={['展视互动', '其他平台'].map((label) => ({ value: label, label }))} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item label="提前进入直播（分钟）" name="earlyEntryMinutes"><InputNumber min={0} max={1440} precision={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item label="直播 / 会议链接" name="liveUrl" rules={[{ required: true, message: '请输入直播或会议链接' }, { pattern: HTTP_URL, message: '请输入完整的 http 或 https 链接' }]}><Input placeholder="请输入直播地址" /></Form.Item>
        </>}
    </Card>
    <Card title="封面与会议内容" size="small">
      <Row gutter={20}>
        <Col xs={24} md={12}><Form.Item label="活动 / 会议封面" name="cover" extra="建议 900 × 500 像素，小于 2 MB" rules={[{ required: true, message: '请设置活动封面' }]}><ActivityMediaField kind="image" label="活动封面" onBusyChange={busy('cover')} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="列表封面" name="listCover" extra="建议 750 × 500 像素，小于 2 MB；未设置时使用活动封面"><ActivityMediaField kind="image" label="列表封面" onBusyChange={busy('listCover')} /></Form.Item></Col>
      </Row>
      <Form.Item label="活动详情 / 会议正文" name="detail" rules={[{ validator: (_: unknown, html?: string) => getActivityText(html ?? '').trim() ? Promise.resolve() : Promise.reject(new Error('请填写活动详情')) }]}><ActivityRichText /></Form.Item>
      <Form.Item label="会议音频" name="audio" extra="支持 MP3，小于 5 MB"><ActivityMediaField kind="audio" label="会议音频" onBusyChange={busy('audio')} /></Form.Item>
    </Card>
  </Space>
  const conversion = <Card title="转化与溯源配置" size="small">
    <Paragraph type="secondary">将会议报名与活动签到、入驻引导放在同一活动中管理。</Paragraph>
    <Row gutter={24}>
      <Col xs={12} md={6}><Form.Item label="开放报名" name="allowRegister" valuePropName="checked"><Switch /></Form.Item></Col>
      <Col xs={12} md={6}><Form.Item label="需要签到" name="needCheckin" valuePropName="checked"><Switch /></Form.Item></Col>
      <Col xs={12} md={6}><Form.Item label="课后问卷" name="needSurvey" valuePropName="checked"><Switch /></Form.Item></Col>
      <Col xs={12} md={6}><Form.Item label="签到后引导入驻" name="leadToRegister" valuePropName="checked"><Switch disabled={!needCheckin} /></Form.Item></Col>
    </Row>
    <Form.Item label="溯源 CP Manager" name="cpManager" hidden><Input placeholder="活动归属招商经理（线索归属依据）" /></Form.Item>
    <Form.Item label="线索绑定有效期（天）" name="bindingDays" rules={[{ required: true, message: '请填写有效期' }]}><InputNumber min={1} max={365} precision={0} style={{ width: 220 }} /></Form.Item>
    <Alert type="info" showIcon title="活动归属" description="活动签到后直接提交入驻申请的卖家，以该活动作为“所属活动”的归属依据。" />
  </Card>

  return <div>
    {messageContext}
    <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} wrap>
      <Space><Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/activity/list')}>返回列表</Button><Title level={4} style={{ margin: 0 }}>{activityId ? '编辑活动' : '创建活动'}</Title>{saved && <Tag color={isPublished ? 'green' : 'default'}>{isPublished ? '已发布' : '草稿'}</Tag>}</Space>
      <Space>
        {!isPublished && <Button icon={<SaveOutlined />} loading={saving} disabled={loading || !!loadError || hasBusyMedia} onClick={() => void persist('draft')}>保存草稿</Button>}
        <Button type="primary" loading={saving} disabled={loading || !!loadError || hasBusyMedia} onClick={() => form.submit()}>{isPublished ? '保存修改' : '发布活动'}</Button>
      </Space>
    </Space>
    <Alert type="info" showIcon title="本地预览" description="活动和会议配置保存在当前浏览器，可保存草稿并在活动列表中继续编辑。" style={{ marginBottom: 20 }} />
    {loadError ? <Alert type="error" showIcon title={loadError} /> : <Spin spinning={loading}>
      <Form form={form} layout="vertical" initialValues={DEFAULTS} onFinish={() => void persist('published')} onFinishFailed={({ errorFields }) => {
        const name = String(errorFields[0]?.name[0] ?? '')
        setActiveTab(BASIC_FIELDS.has(name) ? 'basic' : CONVERSION_FIELDS.has(name) ? 'conversion' : 'meeting')
        messageApi.warning('请完善标红的配置后再发布')
        window.setTimeout(() => { if (errorFields[0]) form.scrollToField(errorFields[0].name, { block: 'center', focus: true }) }, 100)
      }}>
        <Row gutter={24}>
          <Col xs={24} xl={17}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
              { key: 'basic', label: '基础信息', forceRender: true, children: basic },
              { key: 'meeting', label: '会议配置', forceRender: true, children: <MeetingSettings onMediaBusyChange={(field, isBusy) => setMediaBusy((current) => ({ ...current, [field]: isBusy }))} /> },
              { key: 'conversion', label: '转化与溯源', forceRender: true, children: conversion },
            ]} />
          </Col>
          <Col xs={24} xl={7}>
            <Card title={<Space><EyeOutlined />活动预览</Space>} size="small" style={{ position: 'sticky', top: 16, marginTop: 12 }}>
              <div style={{ background: '#F5F7FB', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: 12, background: '#1A56DB', textAlign: 'center', color: '#fff' }}>{String(values?.topTitle || '活动详情')}</div>
                {typeof values?.cover === 'string' && /^(https?:\/\/|data:image\/(png|jpeg|webp|gif)(?:;name=[^;,]*)?;base64,)/i.test(values.cover)
                  ? <img src={values.cover} alt="活动封面预览" style={{ width: '100%', aspectRatio: '9 / 5', objectFit: 'cover' }} />
                  : <div style={{ padding: '32px 12px', textAlign: 'center', color: '#8792A2' }}><CalendarOutlined style={{ fontSize: 28 }} /><div style={{ marginTop: 8 }}>活动封面</div></div>}
                <div style={{ padding: 16 }}>
                  <Title level={5} style={{ margin: '0 0 12px', overflowWrap: 'anywhere' }}>{String(values?.title || '活动名称')}</Title>
                  <Space wrap><Tag color="blue">{mode === 'online' ? '线上' : '线下'}</Tag>{Boolean(values?.kind) && <Tag>{String(values?.kind)}</Tag>}</Space>
                  <Paragraph type="secondary" style={{ margin: '12px 0 0' }}>{values?.start ? values.start.format(values.dateOnly ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm') : '待设置活动时间'}</Paragraph>
                  <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>{mode === 'online' ? String(values?.livePlatform || '线上会议') : String(values?.location || '待设置活动地点')}</Paragraph>
                  <Paragraph ellipsis={{ rows: 4 }} style={{ marginTop: 16 }}>{getActivityText(String(values?.detail || '完善会议正文后在这里查看内容摘要。'))}</Paragraph>
                  {allowRegister && <Button type="primary" block disabled>立即报名</Button>}
                </div>
              </div>
              <Descriptions size="small" column={1} items={[
                { key: 'audience', label: '报名', children: allowRegister ? '已开放' : '已关闭' },
                { key: 'audit', label: '报名审核', children: values?.auditEnabled ? '需要审核' : '无需审核' },
                { key: 'checkin', label: '活动签到', children: needCheckin ? '已开启' : '未开启' },
                { key: 'capacity', label: '报名名额', children: values?.capacityLimited ? `${values?.capacity || '待设置'} 人` : '不限人数' },
              ]} />
              <Text type="secondary" style={{ fontSize: 12 }}>用于核对活动内容，实际展示以活动页面为准。</Text>
            </Card>
          </Col>
        </Row>
      </Form>
    </Spin>}
  </div>
}
