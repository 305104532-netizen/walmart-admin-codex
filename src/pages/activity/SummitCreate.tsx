import { useEffect, useState } from 'react'
import { Alert, Button, Card, Checkbox, Col, DatePicker, Descriptions, Form, Input, InputNumber, Row, Space, Spin, Switch, Tabs, Tag, Typography, message } from 'antd'
import { ArrowDownOutlined, ArrowLeftOutlined, ArrowUpOutlined, CalendarOutlined, DeleteOutlined, EyeOutlined, PlusOutlined, SaveOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { readSummit, saveSummit } from '../../models/summit'
import type { StoredSummit, SummitAgendaItem, SummitConfig, SummitGuest } from '../../models/summit'
import ActivityMediaField from './ActivityMediaField'
import ActivityRichText, { getActivityText, sanitizeActivityHtml } from './ActivityRichText'

const { Text, Title, Paragraph } = Typography
type SummitFormValues = Omit<SummitConfig, 'start' | 'end' | 'registrationDeadline'> & {
  start?: Dayjs | null
  end?: Dayjs | null
  registrationDeadline?: Dayjs | null
}

const DEFAULTS: Partial<SummitFormValues> = {
  topTitle: '沃尔玛峰会', allowRegister: true, auditRequired: true, needCheckin: true,
  checkinStartMinutes: 60, checkinEndMinutes: 30, leadToRegister: true, bindingDays: 30, needSurvey: true,
  showInCalendar: true, sourceTraceEnabled: true, registrationFields: ['name', 'phone', 'company', 'sellerId'],
  signupSuccessText: '峰会报名已提交，审核结果将通过消息通知。', agenda: [], guests: [], capacity: 500,
}
const TAB_FIELDS: Record<string, string> = {
  title: 'basic', topTitle: 'basic', slogan: 'basic', start: 'basic', end: 'basic', registrationDeadline: 'basic', city: 'basic', venue: 'basic', address: 'basic', capacity: 'basic',
  cover: 'content', listCover: 'content', shareImage: 'content', detail: 'content',
  agenda: 'agenda', guests: 'guests', allowRegister: 'registration', registrationFields: 'registration', signupSuccessText: 'registration', bindingDays: 'registration',
}
const REGISTRATION_OPTIONS = [
  { value: 'name', label: '姓名' }, { value: 'phone', label: '手机号' }, { value: 'company', label: '公司名称' },
  { value: 'sellerId', label: '卖家 ID' }, { value: 'email', label: '邮箱' }, { value: 'city', label: '所在城市' }, { value: 'category', label: '主营类目' },
]

function id(prefix: string): string { return `${prefix}-${crypto.randomUUID()}` }

export default function SummitCreate() {
  const [form] = Form.useForm<SummitFormValues>()
  const [query] = useSearchParams()
  const summitId = query.get('id') ?? undefined
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(!!summitId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<StoredSummit>()
  const [error, setError] = useState('')
  const [mediaBusy, setMediaBusy] = useState<Record<string, boolean>>({})
  const [messageApi, messageContext] = message.useMessage()
  const values = Form.useWatch([], form) as SummitFormValues | undefined
  const hasBusyMedia = Object.values(mediaBusy).some(Boolean)

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(async () => {
      if (cancelled) return
      form.resetFields()
      setSaved(undefined)
      setError('')
      if (!summitId) { setLoading(false); return }
      setLoading(true)
      try {
        const record = await readSummit(summitId)
        if (cancelled) return
        if (!record) { setError('未找到该峰会，请返回峰会列表重新选择。'); return }
        setSaved(record)
        form.setFieldsValue({ ...DEFAULTS, ...record.values,
          start: record.values.start ? dayjs(record.values.start) : null,
          end: record.values.end ? dayjs(record.values.end) : null,
          registrationDeadline: record.values.registrationDeadline ? dayjs(record.values.registrationDeadline) : null,
        })
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : '峰会读取失败，请重试。')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [form, summitId])

  const buildConfig = (): SummitConfig => {
    const data = form.getFieldsValue(true)
    return {
      title: String(data.title ?? '').trim(), shortTitle: String(data.shortTitle ?? '').trim(), slogan: String(data.slogan ?? '').trim(), topTitle: String(data.topTitle ?? '沃尔玛峰会').trim(),
      start: data.start?.toISOString() ?? null, end: data.end?.toISOString() ?? null, registrationDeadline: data.registrationDeadline?.toISOString() ?? null,
      city: String(data.city ?? '').trim(), venue: String(data.venue ?? '').trim(), address: String(data.address ?? '').trim(), capacity: typeof data.capacity === 'number' ? data.capacity : null,
      cover: String(data.cover ?? ''), listCover: String(data.listCover ?? ''), shareImage: String(data.shareImage ?? ''), detail: sanitizeActivityHtml(String(data.detail ?? '')),
      agenda: (data.agenda ?? []).map((item: SummitAgendaItem) => ({ ...item, id: item.id || id('agenda'), title: String(item.title ?? '').trim() })),
      guests: (data.guests ?? []).map((guest: SummitGuest) => ({ ...guest, id: guest.id || id('guest'), name: String(guest.name ?? '').trim(), title: String(guest.title ?? '').trim() })),
      allowRegister: Boolean(data.allowRegister), auditRequired: Boolean(data.auditRequired), needCheckin: Boolean(data.needCheckin),
      checkinStartMinutes: Number(data.checkinStartMinutes ?? 60), checkinEndMinutes: Number(data.checkinEndMinutes ?? 30), leadToRegister: Boolean(data.needCheckin && data.leadToRegister), bindingDays: Number(data.bindingDays ?? 30), needSurvey: Boolean(data.needSurvey), showInCalendar: Boolean(data.showInCalendar),
      registrationFields: Array.isArray(data.registrationFields) ? data.registrationFields : [], signupSuccessText: String(data.signupSuccessText ?? '').trim(), shareSummary: String(data.shareSummary ?? '').trim(), sourceTraceEnabled: Boolean(data.sourceTraceEnabled),
    }
  }

  const persist = async (status: 'draft' | 'published') => {
    if (loading || saving || error || hasBusyMedia) return
    setSaving(true)
    try {
      const record = await saveSummit(buildConfig(), status, summitId)
      setSaved(record)
      messageApi.success(status === 'draft' ? '峰会草稿已保存' : saved?.status === 'published' ? '峰会配置已更新' : '沃尔玛峰会已发布')
      navigate('/activity/summit')
    } catch (cause) {
      messageApi.error(cause instanceof Error ? cause.message : '峰会保存失败，填写内容已保留。')
    } finally { setSaving(false) }
  }

  const dateRule = (other: 'start' | 'end', text: string) => ({ validator: (_: unknown, date?: Dayjs) => {
    const target = form.getFieldValue(other) as Dayjs | undefined
    return !date || !target || (other === 'start' ? date.isAfter(target) : date.isBefore(target)) ? Promise.resolve() : Promise.reject(new Error(text))
  } })
  const busy = (field: string) => (value: boolean) => setMediaBusy((current) => ({ ...current, [field]: value }))

  const basic = <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <Card size="small" title="峰会基本信息">
      <Row gutter={20}>
        <Col xs={24} md={8}><Form.Item label="小程序顶部标题" name="topTitle" rules={[{ required: true, whitespace: true, message: '请输入顶部标题' }]}><Input maxLength={12} showCount /></Form.Item></Col>
        <Col xs={24} md={16}><Form.Item label="峰会名称" name="title" rules={[{ required: true, whitespace: true, message: '请输入峰会名称' }]}><Input maxLength={64} showCount placeholder="如 2026沃尔玛全球电商峰会" /></Form.Item></Col>
      </Row>
      <Row gutter={20}>
        <Col xs={24} md={8}><Form.Item label="列表简称" name="shortTitle"><Input maxLength={24} showCount placeholder="沃尔玛卖家峰会" /></Form.Item></Col>
        <Col xs={24} md={16}><Form.Item label="峰会口号" name="slogan"><Input maxLength={80} showCount placeholder="峰会卡片和详情页标题下展示" /></Form.Item></Col>
      </Row>
      <Row gutter={20}>
        <Col xs={24} md={12}><Form.Item label="开始时间" name="start" dependencies={['end']} rules={[{ required: true, message: '请选择开始时间' }, dateRule('end', '开始时间必须早于结束时间')]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="结束时间" name="end" dependencies={['start']} rules={[{ required: true, message: '请选择结束时间' }, dateRule('start', '结束时间必须晚于开始时间')]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
      <Row gutter={20}>
        <Col xs={24} md={8}><Form.Item label="城市" name="city" rules={[{ required: true, whitespace: true, message: '请输入城市' }]}><Input placeholder="如 上海" /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item label="会场" name="venue" rules={[{ required: true, whitespace: true, message: '请输入会场' }]}><Input placeholder="如 上海国际会议中心" /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item label="报名名额" name="capacity" rules={[{ required: true, message: '请输入报名名额' }]}><InputNumber min={1} max={100000} precision={0} style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
      <Form.Item label="详细地址" name="address"><Input maxLength={150} placeholder="会场详细地址，供地图导航和签到使用" /></Form.Item>
      <Space wrap size={24}>
        <Form.Item name="showInCalendar" valuePropName="checked"><Checkbox>同步展示在小程序活动日历</Checkbox></Form.Item>
        <Form.Item name="sourceTraceEnabled" valuePropName="checked"><Checkbox>启用峰会溯源邀约</Checkbox></Form.Item>
      </Space>
    </Card>
  </Space>

  const content = <Card size="small" title="峰会视觉与详情">
    <Row gutter={20}>
      <Col xs={24} md={8}><Form.Item label="峰会详情封面" name="cover" extra="建议 900 × 500 像素，小于 2 MB" rules={[{ required: true, message: '请上传峰会封面' }]}><ActivityMediaField kind="image" label="峰会详情封面" onBusyChange={busy('cover')} /></Form.Item></Col>
      <Col xs={24} md={8}><Form.Item label="活动列表封面" name="listCover" extra="建议 750 × 500 像素；未设置时使用详情封面"><ActivityMediaField kind="image" label="峰会列表封面" onBusyChange={busy('listCover')} /></Form.Item></Col>
      <Col xs={24} md={8}><Form.Item label="分享卡片图片" name="shareImage" extra="用于小程序分享卡片"><ActivityMediaField kind="image" label="峰会分享图片" onBusyChange={busy('shareImage')} /></Form.Item></Col>
    </Row>
    <Form.Item label="峰会介绍" name="detail" rules={[{ validator: (_: unknown, html?: string) => getActivityText(html ?? '').trim() ? Promise.resolve() : Promise.reject(new Error('请填写峰会介绍')) }]}><ActivityRichText /></Form.Item>
    <Form.Item label="分享摘要" name="shareSummary"><Input.TextArea rows={2} maxLength={50} showCount placeholder="概括峰会亮点，用于分享卡片" /></Form.Item>
  </Card>

  const agenda = <Card size="small" title="峰会议程" extra="小程序详情页以时间线展示">
    <Form.List name="agenda">
      {(fields, { add, remove, move }) => <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        {fields.map((field, index) => <Card key={field.key} size="small" title={`议程 ${index + 1}`} extra={<Space size={0}><Button type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, index - 1)} /><Button type="text" icon={<ArrowDownOutlined />} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)} /><Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)}>删除</Button></Space>}>
          <Form.Item name={[field.name, 'id']} hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col xs={12} md={4}><Form.Item label="开始" name={[field.name, 'startTime']} rules={[{ required: true, message: '请输入开始时间' }]}><Input placeholder="09:00" /></Form.Item></Col>
            <Col xs={12} md={4}><Form.Item label="结束" name={[field.name, 'endTime']} rules={[{ required: true, message: '请输入结束时间' }]}><Input placeholder="10:00" /></Form.Item></Col>
            <Col xs={24} md={16}><Form.Item label="议程主题" name={[field.name, 'title']} rules={[{ required: true, whitespace: true, message: '请输入议程主题' }]}><Input maxLength={80} /></Form.Item></Col>
          </Row>
          <Row gutter={16}><Col xs={24} md={12}><Form.Item label="演讲嘉宾" name={[field.name, 'speaker']}><Input maxLength={80} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="分会场" name={[field.name, 'venue']}><Input maxLength={80} /></Form.Item></Col></Row>
          <Form.Item label="议程说明" name={[field.name, 'description']}><Input.TextArea rows={2} maxLength={300} showCount /></Form.Item>
        </Card>)}
        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ id: id('agenda'), startTime: '', endTime: '', title: '' })}>新增议程</Button>
      </Space>}
    </Form.List>
  </Card>

  const guests = <Card size="small" title="峰会嘉宾" extra="小程序详情页以头像和简介卡片展示">
    <Form.List name="guests">
      {(fields, { add, remove, move }) => <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        {fields.map((field, index) => <Card key={field.key} size="small" title={`嘉宾 ${index + 1}`} extra={<Space size={0}><Button type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, index - 1)} /><Button type="text" icon={<ArrowDownOutlined />} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)} /><Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)}>删除</Button></Space>}>
          <Form.Item name={[field.name, 'id']} hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={6}><Form.Item label="嘉宾头像" name={[field.name, 'avatar']}><ActivityMediaField kind="image" label={`嘉宾 ${index + 1} 头像`} maxMB={2} onBusyChange={busy(`guest-${field.key}`)} /></Form.Item></Col>
            <Col xs={24} md={18}><Row gutter={16}><Col xs={24} md={12}><Form.Item label="嘉宾姓名" name={[field.name, 'name']} rules={[{ required: true, whitespace: true, message: '请输入嘉宾姓名' }]}><Input maxLength={50} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="职务" name={[field.name, 'title']} rules={[{ required: true, whitespace: true, message: '请输入嘉宾职务' }]}><Input maxLength={80} /></Form.Item></Col></Row><Form.Item label="公司 / 机构" name={[field.name, 'company']}><Input maxLength={100} /></Form.Item><Form.Item label="嘉宾简介" name={[field.name, 'bio']}><Input.TextArea rows={2} maxLength={300} showCount /></Form.Item></Col>
          </Row>
        </Card>)}
        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ id: id('guest'), name: '', title: '' })}>新增嘉宾</Button>
      </Space>}
    </Form.List>
  </Card>

  const registration = <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <Card size="small" title="报名设置">
      <Row gutter={16}><Col xs={12} md={6}><Form.Item label="开放报名" name="allowRegister" valuePropName="checked"><Switch /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="报名审核" name="auditRequired" valuePropName="checked"><Switch /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="现场签到" name="needCheckin" valuePropName="checked"><Switch /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="会后问卷" name="needSurvey" valuePropName="checked"><Switch /></Form.Item></Col></Row>
      <Form.Item label="报名截止时间" name="registrationDeadline" dependencies={['start']} rules={[{ required: true, message: '请选择报名截止时间' }, { validator: (_: unknown, value?: Dayjs) => !value || !values?.start || value.isBefore(values.start) ? Promise.resolve() : Promise.reject(new Error('报名截止时间必须早于峰会开始时间')) }]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
      <Form.Item label="报名信息字段" name="registrationFields" rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个报名字段' }]}><Checkbox.Group options={REGISTRATION_OPTIONS} /></Form.Item>
      <Form.Item label="报名成功提示" name="signupSuccessText" rules={[{ required: true, whitespace: true, message: '请输入报名成功提示' }]}><Input.TextArea rows={2} maxLength={120} showCount /></Form.Item>
    </Card>
    <Card size="small" title="签到与入驻引导">
      <Row gutter={16}><Col xs={24} md={8}><Form.Item label="提前开放签到（分钟）" name="checkinStartMinutes"><InputNumber min={0} max={1440} precision={0} style={{ width: '100%' }} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="结束后保留签到（分钟）" name="checkinEndMinutes"><InputNumber min={0} max={1440} precision={0} style={{ width: '100%' }} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="签到后引导入驻" name="leadToRegister" valuePropName="checked"><Switch disabled={!values?.needCheckin} /></Form.Item></Col></Row>
      <Form.Item label="线索绑定有效期（天）" name="bindingDays" tooltip="超过有效期后线索归属自动失效，用户再次参加活动时可重新绑定" rules={[{ required: true, message: '请填写线索绑定有效期' }]}><InputNumber min={1} max={365} precision={0} style={{ width: 220 }} /></Form.Item>
      <Alert type="info" showIcon title="峰会溯源邀约" description="通过经理转发、活动海报或二维码进入峰会的用户，将携带来源参数；签到后直接入驻的卖家会记录该峰会为所属活动。" />
    </Card>
  </Space>

  return <div>
    {messageContext}
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
      <Space wrap><Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/activity/summit')}>峰会列表</Button><Title level={4} style={{ margin: 0 }}>{summitId ? '编辑沃尔玛峰会' : '创建沃尔玛峰会'}</Title>{saved && <Tag color={saved.status === 'published' ? 'green' : 'default'}>{saved.status === 'published' ? '已发布' : '草稿'}</Tag>}</Space>
      <Space><Button icon={<SaveOutlined />} loading={saving} disabled={loading || !!error || hasBusyMedia} onClick={() => void persist('draft')}>保存草稿</Button><Button type="primary" loading={saving} disabled={loading || !!error || hasBusyMedia} onClick={() => form.submit()}>{saved?.status === 'published' ? '保存并发布' : '发布峰会'}</Button></Space>
    </Space>
    <Alert type="info" showIcon title="峰会专属配置" description="根据小程序峰会页面配置详情、议程和嘉宾，并统一管理报名、审核、签到、分享和溯源。当前配置保存在本地浏览器。" style={{ marginBottom: 16 }} />
    {error ? <Alert type="error" showIcon title="无法读取峰会" description={error} /> : <Spin spinning={loading}>
      <Form form={form} layout="vertical" initialValues={DEFAULTS} onFinish={() => void persist('published')} onFinishFailed={({ errorFields }) => {
        const root = String(errorFields[0]?.name[0] ?? 'basic')
        setActiveTab(TAB_FIELDS[root] ?? root)
        messageApi.warning('请完善标红的峰会配置后再发布')
        window.setTimeout(() => { if (errorFields[0]) form.scrollToField(errorFields[0].name, { block: 'center', focus: true }) }, 100)
      }}>
        <Row gutter={24}>
          <Col xs={24} xl={17}><Tabs activeKey={activeTab} onChange={setActiveTab} items={[
            { key: 'basic', label: '基本信息', forceRender: true, children: basic },
            { key: 'content', label: '视觉与详情', forceRender: true, children: content },
            { key: 'agenda', label: `峰会议程（${values?.agenda?.length ?? 0}）`, forceRender: true, children: agenda },
            { key: 'guests', label: `峰会嘉宾（${values?.guests?.length ?? 0}）`, forceRender: true, children: guests },
            { key: 'registration', label: '报名与签到', forceRender: true, children: registration },
          ]} /></Col>
          <Col xs={24} xl={7}><Card size="small" title={<Space><EyeOutlined />小程序峰会预览</Space>} style={{ position: 'sticky', top: 16, marginTop: 12 }}>
            <div style={{ background: '#F5F7FB', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: 12, background: '#1A56DB', color: '#fff', textAlign: 'center' }}>{values?.topTitle || '沃尔玛峰会'}</div>
              {values?.cover ? <img src={values.cover} alt="峰会封面预览" style={{ width: '100%', aspectRatio: '9 / 5', objectFit: 'cover' }} /> : <div style={{ padding: 28, textAlign: 'center', color: '#8792A2' }}><CalendarOutlined style={{ fontSize: 30 }} /><div>峰会封面</div></div>}
              <div style={{ padding: 16 }}><Tag color="orange">线下峰会</Tag><Title level={5}>{values?.title || '峰会名称'}</Title><Paragraph type="secondary">{values?.slogan || '峰会口号'}</Paragraph><Paragraph><CalendarOutlined /> {values?.start ? values.start.format('YYYY-MM-DD HH:mm') : '待设置时间'}</Paragraph><Paragraph><TeamOutlined /> 名额 {values?.capacity || '待设置'} 人</Paragraph><Paragraph ellipsis={{ rows: 3 }}>{getActivityText(values?.detail || '') || '完善峰会介绍后在这里查看摘要。'}</Paragraph>{values?.allowRegister && <Button type="primary" block disabled>立即报名</Button>}</div>
            </div>
            <Descriptions size="small" column={1} items={[
              { key: 'agenda', label: '议程', children: `${values?.agenda?.length ?? 0} 项` }, { key: 'guests', label: '嘉宾', children: `${values?.guests?.length ?? 0} 位` },
              { key: 'audit', label: '报名审核', children: values?.auditRequired ? '需要审核' : '自动通过' }, { key: 'checkin', label: '现场签到', children: values?.needCheckin ? '已开启' : '未开启' },
              { key: 'binding', label: '线索绑定', children: `${values?.bindingDays ?? 30} 天` },
            ]} />
            <Text type="secondary" style={{ fontSize: 12 }}>预览用于核对峰会信息，实际展示以小程序为准。</Text>
          </Card></Col>
        </Row>
      </Form>
    </Spin>}
  </div>
}
