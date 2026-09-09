import { useMemo, useState } from 'react'
import { AimOutlined, BookOutlined, CalendarOutlined, EyeOutlined, SearchOutlined, ShopOutlined, TagsOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Avatar, Button, Card, Col, Descriptions, Drawer, Empty, Input, Progress, Row, Select, Space, Statistic, Table, Tabs, Tag, Timeline, Typography } from 'antd'
import { GROWTH_SELLERS } from '../../models/growthSellers'
import type { GrowthSeller, SellerPersona, SellerRegistrationStatus, SellerSite, SellerTag } from '../../models/growthSellers'
import { getStandardTemplate, loadRegistrationTemplate } from '../../models/registrationTemplates'
import type { RegistrationField } from '../../models/registrationTemplates'

const STATUS: Record<SellerRegistrationStatus, { label: string; color: string }> = {
  unregistered: { label: '未入驻', color: 'default' }, pending: { label: '审核中', color: 'gold' }, online: { label: '已上线', color: 'green' },
}
const PERSONA_COLORS: Record<SellerPersona, string> = { 基础培育: 'default', 高意向待入驻: 'blue', 审核跟进: 'gold', 潜力成长: 'cyan', 核心高质量: 'purple' }
const SCORE_LABELS: Array<[keyof GrowthSeller['scores'], string]> = [['maturity', '经营成熟度'], ['activity', '平台活跃度'], ['learning', '学习成长力'], ['registrationIntent', '入驻意向'], ['growthValue', '成长价值']]

function scoreColor(value: number): string { return value >= 75 ? '#10B981' : value >= 50 ? '#1A56DB' : '#F59E0B' }

function SellerTags({ tags, limit }: { tags: SellerTag[]; limit?: number }) {
  const visible = typeof limit === 'number' ? tags.slice(0, limit) : tags
  return <Space size={[0, 4]} wrap>{visible.map((tag) => <Tag key={tag.name} color={tag.type === 'custom' ? 'orange' : 'blue'}>{tag.name}</Tag>)}{limit && tags.length > limit ? <Tag>+{tags.length - limit}</Tag> : null}</Space>
}

export default function GrowthSellers() {
  const [status, setStatus] = useState<'all' | SellerRegistrationStatus>('all')
  const [site, setSite] = useState<SellerSite>()
  const [persona, setPersona] = useState<SellerPersona>()
  const [manager, setManager] = useState<string>()
  const [keyword, setKeyword] = useState('')
  const [detail, setDetail] = useState<GrowthSeller>()
  const [detailTab, setDetailTab] = useState('portrait')
  const registrationTemplate = useMemo(() => {
    try { return loadRegistrationTemplate().published }
    catch { return { steps: getStandardTemplate(), version: 1, updatedAt: null, updatedBy: '系统预设' } }
  }, [])

  const filtered = useMemo(() => GROWTH_SELLERS.filter((seller) => (status === 'all' || seller.registrationStatus === status)
    && (!site || seller.sites.includes(site)) && (!persona || seller.persona === persona) && (!manager || seller.manager === manager)
    && (!keyword || `${seller.name}${seller.company}${seller.email}${seller.sellerId ?? ''}`.toLowerCase().includes(keyword.toLowerCase()))), [keyword, manager, persona, site, status])
  const counts = Object.fromEntries(['unregistered', 'pending', 'online'].map((key) => [key, GROWTH_SELLERS.filter((seller) => seller.registrationStatus === key).length])) as Record<SellerRegistrationStatus, number>
  const openDetail = (seller: GrowthSeller, tab = 'portrait') => { setDetail(seller); setDetailTab(tab) }

  const columns = [
    { title: '卖家', key: 'seller', fixed: 'left' as const, width: 230, render: (_: unknown, seller: GrowthSeller) => <Space><Avatar style={{ background: '#E8F1FF', color: '#1A56DB' }} icon={<ShopOutlined />} /><div><Button type="link" style={{ padding: 0, height: 'auto', fontWeight: 600 }} onClick={() => openDetail(seller)}>{seller.name}</Button><br /><Typography.Text type="secondary" ellipsis style={{ width: 165, fontSize: 12 }}>{seller.company}</Typography.Text></div></Space> },
    { title: '入驻状态', dataIndex: 'registrationStatus', width: 100, render: (value: SellerRegistrationStatus) => <Tag color={STATUS[value].color}>{STATUS[value].label}</Tag> },
    { title: '进度', dataIndex: 'registrationProgress', width: 130, render: (value: number) => <Progress percent={value} size="small" style={{ width: 100 }} /> },
    { title: '站点', dataIndex: 'sites', width: 130, render: (sites: SellerSite[]) => <Space size={[0, 4]} wrap>{sites.map((value) => <Tag key={value}>{value}</Tag>)}</Space> },
    { title: '360°画像', key: 'persona', width: 150, render: (_: unknown, seller: GrowthSeller) => <Space orientation="vertical" size={2}><Tag color={PERSONA_COLORS[seller.persona]}>{seller.persona}</Tag><Typography.Text type="secondary" style={{ fontSize: 12 }}>综合 {seller.profileScore} 分</Typography.Text></Space> },
    { title: '所属经理', key: 'manager', width: 140, render: (_: unknown, seller: GrowthSeller) => <div>{seller.manager}<br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{seller.department}</Typography.Text></div> },
    { title: '核心标签', dataIndex: 'tags', width: 230, render: (tags: SellerTag[]) => <SellerTags tags={tags} limit={2} /> },
    { title: '近30天活跃', dataIndex: 'activeDays30', width: 110, sorter: (left: GrowthSeller, right: GrowthSeller) => left.activeDays30 - right.activeDays30, render: (value: number) => `${value} 天` },
    { title: '最后活跃', dataIndex: 'lastActiveAt', width: 155 },
    { title: '操作', key: 'action', fixed: 'right' as const, width: 135, render: (_: unknown, seller: GrowthSeller) => <Space size={0}><Button type="link" size="small" onClick={() => openDetail(seller)}>画像</Button><Button type="link" size="small" onClick={() => openDetail(seller, 'registration')}>入驻信息</Button></Space> },
  ]

  const registrationTimeline = detail ? [
    { color: 'green', content: `${detail.bindDate} · 线索绑定至 ${detail.manager}${detail.activity ? `，来源活动：${detail.activity}` : ''}` },
    ...(detail.submittedAt ? [{ color: 'green', content: `${detail.submittedAt} · 提交 ${detail.primarySite} 站入驻申请` }] : [{ color: 'gray', content: '尚未提交入驻申请' }]),
    ...(detail.registrationStatus === 'pending' ? [{ color: 'blue', content: '当前 · 五要素及资质材料审核中' }] : []),
    ...(detail.onlineAt ? [{ color: 'green', content: `${detail.onlineAt} · 审核通过，店铺正式上线` }] : [{ color: 'gray', content: '店铺上线' }]),
  ] : []
  const registrationFieldColumns = detail ? [
    { title: '字段', key: 'field', width: 235, render: (_: unknown, field: RegistrationField) => <div><Space size={4}><Typography.Text strong>{field.label}</Typography.Text>{field.sensitive && <Tag color="red">敏感</Tag>}</Space><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{field.en}</Typography.Text></div> },
    { title: '卖家填写内容', key: 'value', render: (_: unknown, field: RegistrationField) => field.applicableSites.includes(detail.primarySite) ? <Typography.Text>{registrationFieldValue(detail, field.key)}</Typography.Text> : <Typography.Text type="secondary">不适用于当前 {detail.primarySite} 站申请</Typography.Text> },
    { title: '适用站点', dataIndex: 'applicableSites', width: 150, render: (sites: string[]) => <Space size={[0, 4]} wrap>{sites.map((value) => <Tag key={value} color={value === detail.primarySite ? 'blue' : 'default'}>{value}</Tag>)}</Space> },
    { title: '规则', key: 'rule', width: 180, render: (_: unknown, field: RegistrationField) => <Space orientation="vertical" size={2}><Tag color={field.required ? 'gold' : 'default'}>{field.required ? '必填' : '选填'}</Tag>{field.showIf && <Typography.Text type="secondary" style={{ fontSize: 12 }}>条件：{field.showIf}</Typography.Text>}</Space> },
  ] : []

  const portrait = detail ? <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <AlertCard seller={detail} />
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}><Card size="small" title="五维成长评分">{SCORE_LABELS.map(([key, label]) => <div key={key} style={{ marginBottom: 14 }}><Space style={{ display: 'flex', justifyContent: 'space-between' }}><Typography.Text>{label}</Typography.Text><Typography.Text strong>{detail.scores[key]}</Typography.Text></Space><Progress percent={detail.scores[key]} showInfo={false} strokeColor={scoreColor(detail.scores[key])} /></div>)}</Card></Col>
      <Col xs={24} lg={10}><Card size="small" title="卖家概览"><Descriptions column={1} size="small" items={[
        { key: 'category', label: '主营类目', children: detail.category }, { key: 'site', label: '经营站点', children: detail.sites.join('、') },
        { key: 'sellerId', label: 'Seller ID', children: detail.sellerId ?? '上线后生成' }, { key: 'manager', label: '所属招商', children: `${detail.manager} · ${detail.department}` },
        { key: 'active', label: '最后活跃', children: detail.lastActiveAt },
      ]} /></Card></Col>
    </Row>
    <Card size="small" title="偏好与标签"><Descriptions column={{ xs: 1, md: 2 }} items={[
      { key: 'preference', label: '内容偏好', children: detail.preferredCategories.join('、') },
      { key: 'tags', label: '当前标签', children: <SellerTags tags={detail.tags} /> },
    ]} /></Card>
  </Space> : null

  const registration = detail ? <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <Row gutter={[16, 16]}><Col xs={12} md={6}><Card size="small"><Statistic title="入驻状态" value={STATUS[detail.registrationStatus].label} /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="申请进度" value={detail.registrationProgress} suffix="%" /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="五要素5FA" value={detail.fiveFaStatus} /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="申请站点" value={detail.primarySite} /></Card></Col></Row>
    <Card size="small" title="入驻档案 · 基础与业务归属"><Descriptions bordered size="small" column={{ xs: 1, md: 2 }} items={[
      { key: 'company', label: '企业主体', children: detail.legalEntity }, { key: 'country', label: '注册国家/地区', children: detail.country },
      { key: 'name', label: '联系人', children: detail.name }, { key: 'phone', label: '手机号', children: detail.phone },
      { key: 'email', label: '邮箱', children: detail.email }, { key: 'form', label: '入驻表单', children: detail.formVersion },
      { key: 'source', label: '入驻来源', children: detail.source }, { key: 'activity', label: '所属活动', children: detail.activity ?? '—' },
      { key: 'manager', label: '所属经理', children: detail.manager }, { key: 'bind', label: '线索绑定日期', children: detail.bindDate },
    ]} /></Card>
    <Alert type="info" showIcon title={`完整入驻表单字段 · ${registrationTemplate.steps.reduce((total, step) => total + step.fields.length, 0)} 项`}
      description={`按当前已发布标准表单 v${registrationTemplate.version} 展示 US、CA、MX 三站字段并集；蓝色站点为该卖家当前申请站点，敏感信息已脱敏。`} />
    {registrationTemplate.steps.map((step, index) => <Card key={step.id} size="small" title={`${index + 1}. ${step.name}`} extra={`${step.fields.length} 个字段`}>
      {step.fields.length > 0 ? <Table rowKey="key" size="small" pagination={false} columns={registrationFieldColumns} dataSource={step.fields} scroll={{ x: 850 }} />
        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="确认提交步骤不包含可填写字段" />}
    </Card>)}
    <Card size="small" title="入驻进度"><Timeline items={registrationTimeline} /></Card>
  </Space> : null

  const behavior = detail ? <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <Row gutter={[12, 12]}><Col xs={12} md={6}><Card size="small"><Statistic title="近30天活跃" value={detail.activeDays30} suffix="天" prefix={<CalendarOutlined />} /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="页面访问" value={detail.pageViews30} suffix="次" prefix={<EyeOutlined />} /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="内容浏览" value={detail.contentViews30} suffix="篇" prefix={<BookOutlined />} /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="课程学习" value={detail.courseHours} suffix="小时" /></Card></Col></Row>
    <Card size="small" title="行为指标"><Descriptions column={{ xs: 1, md: 3 }} items={[
      { key: 'completion', label: '课程完课率', children: `${detail.courseCompletion}%` }, { key: 'activity', label: '参与活动', children: `${detail.activitiesJoined} 场` },
      { key: 'search', label: '搜索次数', children: `${detail.searches30} 次` }, { key: 'favorite', label: '收藏次数', children: `${detail.favorites30} 次` },
      { key: 'last', label: '最后活跃', children: detail.lastActiveAt }, { key: 'channel', label: '主要访问渠道', children: channelFor(detail) },
    ]} /></Card>
    <Card size="small" title="最近行为轨迹"><Table rowKey="id" size="small" pagination={false} dataSource={detail.behaviors} columns={[
      { title: '时间', dataIndex: 'time', width: 150 }, { title: '行为', dataIndex: 'action', width: 110, render: (value: string) => <Tag color="blue">{value}</Tag> },
      { title: '对象', dataIndex: 'object' }, { title: '渠道', dataIndex: 'channel', width: 100 },
    ]} /></Card>
  </Space> : null

  const tags = detail ? <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <Card size="small" title="标签概览"><SellerTags tags={detail.tags} /></Card>
    <Table rowKey="name" pagination={false} dataSource={detail.tags} columns={[
      { title: '标签名称', dataIndex: 'name', render: (value: string, tag: SellerTag) => <Tag color={tag.type === 'auto' ? 'blue' : 'orange'}>{value}</Tag> },
      { title: '标签类型', dataIndex: 'type', render: (value: SellerTag['type']) => value === 'auto' ? '自动标签' : '自定义标签' },
      { title: '生成来源', dataIndex: 'source' }, { title: '更新时间', dataIndex: 'updatedAt' },
    ]} />
    <Card size="small" title="标签使用说明"><Typography.Paragraph type="secondary" style={{ margin: 0 }}>自动标签由入驻状态、学习和行为数据每日计算；自定义标签由运营人员维护，可用于人群圈选、内容分发、活动邀约和任务派发。</Typography.Paragraph></Card>
  </Space> : null

  return <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <div><Typography.Title level={4} style={{ margin: 0 }}>卖家管理</Typography.Title><Typography.Text type="secondary">统一查看卖家入驻档案、成长行为、标签和 360°画像</Typography.Text></div>
    <Row gutter={[16, 16]}><Col xs={12} md={6}><Card size="small"><Statistic title="全部卖家" value={GROWTH_SELLERS.length} prefix={<TeamOutlined />} /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="未入驻" value={counts.unregistered} /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="审核中" value={counts.pending} /></Card></Col><Col xs={12} md={6}><Card size="small"><Statistic title="已上线" value={counts.online} /></Card></Col></Row>
    <Card>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input allowClear prefix={<SearchOutlined />} placeholder="卖家 / 公司 / 邮箱 / Seller ID" value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 280 }} />
        <Select allowClear placeholder="经营站点" value={site} onChange={setSite} style={{ width: 130 }} options={['US', 'CA', 'MX'].map((value) => ({ value, label: value }))} />
        <Select allowClear placeholder="360°画像" value={persona} onChange={setPersona} style={{ width: 160 }} options={Object.keys(PERSONA_COLORS).map((value) => ({ value, label: value }))} />
        <Select allowClear placeholder="所属经理" value={manager} onChange={setManager} style={{ width: 150 }} options={[...new Set(GROWTH_SELLERS.map((seller) => seller.manager))].map((value) => ({ value, label: value }))} />
      </Space>
      <Tabs activeKey={status} onChange={(key) => setStatus(key as typeof status)} items={[
        { key: 'all', label: `全部（${GROWTH_SELLERS.length}）` }, { key: 'unregistered', label: `未入驻（${counts.unregistered}）` },
        { key: 'pending', label: `审核中（${counts.pending}）` }, { key: 'online', label: `已上线（${counts.online}）` },
      ]} />
      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `共 ${total} 位卖家` }} scroll={{ x: 1450 }} locale={{ emptyText: <Empty description="未找到符合条件的卖家" /> }} />
    </Card>

    <Drawer open={!!detail} onClose={() => setDetail(undefined)} size="min(1060px, 94vw)" title={detail ? <Space><Avatar style={{ background: '#1A56DB' }} icon={<UserOutlined />} /><div><Typography.Text strong>{detail.name}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{detail.company}</Typography.Text></div><Tag color={STATUS[detail.registrationStatus].color}>{STATUS[detail.registrationStatus].label}</Tag></Space> : '卖家详情'}>
      {detail && <Tabs activeKey={detailTab} onChange={setDetailTab} items={[
        { key: 'portrait', label: <span><AimOutlined /> 360°卖家画像</span>, children: portrait },
        { key: 'registration', label: <span><ShopOutlined /> 入驻信息</span>, children: registration },
        { key: 'behavior', label: <span><EyeOutlined /> 行为数据</span>, children: behavior },
        { key: 'tags', label: <span><TagsOutlined /> 标签数据</span>, children: tags },
      ]} />}
    </Drawer>
  </Space>
}

function channelFor(seller: GrowthSeller): string {
  return seller.contentViews30 >= seller.activitiesJoined * 5 ? '卖家大学' : '活动中心'
}

function registrationFieldValue(seller: GrowthSeller, key: string): string {
  const sequence = Number.parseInt(seller.id.replace(/\D/g, ''), 10) || 1
  const submitted = seller.registrationStatus !== 'unregistered'
  const leadFields = new Set(['contactName', 'regionCode', 'phone', 'email', 'companyName', 'operationLocation', 'regLocation', 'category', 'bdManager'])
  if (!submitted && !leadFields.has(key)) return key.toLowerCase().includes('screenshot') ? '未上传' : '未填写'
  const hasUsAccount = seller.sites.includes('US')
  const hasMxExperience = seller.sites.includes('MX')
  const values: Record<string, string> = {
    contactName: seller.name,
    regionCode: '+86 中国大陆',
    phone: seller.phone,
    email: seller.email,
    companyName: seller.company,
    operationLocation: ['深圳市', '广州市', '杭州市', '上海市'][sequence % 4],
    regLocation: '中国大陆',
    brand: `${seller.company.slice(0, 4)}品牌`,
    category: seller.category,
    subCategory: `${seller.category}细分品类`,
    annualGMV: ['100万–500万美元', '500万–1000万美元', '1000万美元以上'][sequence % 3],
    bdManager: seller.manager,
    otherPlatforms: ['Amazon、eBay', 'Amazon、Shopee', 'TikTok Shop、Amazon'][sequence % 3],
    storeLink: `https://example.com/store/${seller.id}`,
    sellerId: seller.sellerId ?? `CN-${String(600000 + sequence * 137)}`,
    gmvScreenshot: '已上传（GMV后台截图）',
    wfsSupport: sequence % 2 === 0 ? '是' : '否',
    hasUSAccount: hasUsAccount ? '是' : '否',
    usPid: hasUsAccount ? seller.sellerId ?? `US-${String(300000 + sequence * 97)}` : '条件未触发，未填写',
    mxExperience: hasMxExperience ? '是' : '否',
    mxGmvScreenshot: hasMxExperience ? '已上传（墨西哥GMV截图）' : '条件未触发，未上传',
    mxPlatformName: hasMxExperience ? 'Mercado Libre' : '条件未触发，未填写',
    mxPlatformUrl: hasMxExperience ? `https://example.com/mx-store/${seller.id}` : '条件未触发，未填写',
    mxSellerId: hasMxExperience ? `MX-${String(400000 + sequence * 83)}` : '条件未触发，未填写',
    rfcTax: hasMxExperience && sequence % 2 === 0 ? '是' : '否',
    legalRepName: seller.name,
    legalRepPhone: seller.phone,
    legalCompanyName: seller.legalEntity,
    legalCompanyTaxId: `91************${String(4200 + sequence).slice(-4)}`,
    legalRepIdNumber: `31************${String(7800 + sequence).slice(-4)}`,
  }
  return values[key] ?? '未填写'
}

function AlertCard({ seller }: { seller: GrowthSeller }) {
  return <Card size="small" styles={{ body: { background: '#F7FAFF' } }}><Row gutter={[16, 12]} align="middle"><Col flex="auto"><Space orientation="vertical" size={4}><Space wrap><Tag color={PERSONA_COLORS[seller.persona]}>{seller.persona}</Tag><Typography.Text strong>综合画像 {seller.profileScore} 分</Typography.Text></Space><Typography.Text>{seller.recommendation}</Typography.Text></Space></Col><Col><Progress type="circle" percent={seller.profileScore} size={74} strokeColor={scoreColor(seller.profileScore)} format={(value) => `${value}分`} /></Col></Row></Card>
}
