import type { ReactNode } from 'react'
import { Card, Descriptions, Divider, Image, Space, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons'
import type { ActivityConfig } from '../../models/activity'
import { MEETING_DEFAULTS } from './MeetingSettings'

const { Text, Paragraph } = Typography
type RecordValue = Record<string, unknown>
type DetailItem = { key: string; label: string; children: ReactNode }

const stringValue = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const displayValue = (value: unknown, empty = '未设置') => {
  const text = stringValue(value)
  if (text) return text
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : empty
}
const stringList = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean) : []
const recordList = (value: unknown): RecordValue[] => Array.isArray(value)
  ? value.filter((item): item is RecordValue => typeof item === 'object' && item !== null && !Array.isArray(item)) : []
const httpUrl = (value: unknown) => {
  const text = stringValue(value)
  if (!text) return ''
  try {
    const url = new URL(text)
    return /^https?:$/.test(url.protocol) && url.hostname ? url.href : ''
  } catch { return '' }
}
const imageUrl = (value: unknown) => {
  const text = stringValue(value)
  return /^data:image\/(?:png|jpeg|webp|gif)(?:;name=[^;,]*)?;base64,[A-Za-z0-9+/]+={0,2}$/.test(text) ? text : httpUrl(text)
}
const FILE_MIME_TYPES = new Set([
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-zip-compressed', 'application/octet-stream',
])
const localFile = (value: unknown) => {
  const text = stringValue(value)
  const match = text.match(/^data:([^;,]+)(?:;name=([^;,]*))?;base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!match || !FILE_MIME_TYPES.has(match[1].toLowerCase()) || match[3].length % 4 !== 0) return undefined
  let name = '活动资料'
  if (match[2]) {
    try { name = decodeURIComponent(match[2]).replace(/[\\/\p{Cc}]/gu, '_') || name }
    catch { /* Retain a readable fallback for malformed file names. */ }
  }
  return { href: text, name }
}
const status = (enabled: unknown) => enabled === true ? '已开启' : '未开启'
const item = (key: string, label: string, children: ReactNode): DetailItem => ({ key, label, children })

function Details({ items }: { items: DetailItem[] }) {
  return <Descriptions size="small" column={{ xs: 1, sm: 1, md: 2 }} items={items} styles={{ content: { overflowWrap: 'anywhere' } }} />
}

function Tags({ value }: { value: unknown }) {
  const tags = stringList(value)
  return tags.length ? <Space wrap size={[4, 4]}>{tags.map((tag, index) => <Tag key={`${index}-${tag}`}>{tag}</Tag>)}</Space> : <Text type="secondary">未设置</Text>
}

function LinkValue({ value }: { value: unknown }) {
  const href = httpUrl(value)
  if (!href) return <Text type="secondary">{stringValue(value) ? '链接无效' : '未设置'}</Text>
  return <a href={href} target="_blank" rel="noopener noreferrer" style={{ overflowWrap: 'anywhere' }}>{href}</a>
}

function Picture({ value, label }: { value: unknown; label: string }) {
  const src = imageUrl(value)
  if (!src) return <Text type="secondary">{stringValue(value) ? '图片格式无效' : '未设置'}</Text>
  return <Image src={src} alt={label} width={200} height={132} style={{ objectFit: 'contain', background: '#f5f7fb', borderRadius: 6 }} />
}

function Material({ value, name }: { value: unknown; name: unknown }) {
  const file = localFile(value)
  if (file) return <Space orientation="vertical" size={4}>
    <Text style={{ overflowWrap: 'anywhere' }}>{stringValue(name) || file.name}</Text>
    <a href={file.href} download={file.name}><DownloadOutlined /> 下载资料</a>
  </Space>
  const href = httpUrl(value)
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ overflowWrap: 'anywhere' }}><LinkOutlined /> {stringValue(name) || '打开活动资料'}</a>
  return <Text type="secondary">{stringValue(value) ? '资料格式无效' : '未上传资料'}</Text>
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: '单行文本', textarea: '多行文本', mobile: '手机号', email: '邮箱', select: '单选', multiple: '多选',
}
const IDENTITY_LABELS: Record<string, string> = { member: '会员', employee: '员工', choose: '由参与者选择' }
const mappedLabel = (labels: Record<string, string>, value: unknown) => {
  const label = labels[stringValue(value)]
  return typeof label === 'string' ? label : '未设置'
}
const unitValue = (value: unknown, unit: string) => typeof value === 'number' && Number.isFinite(value) ? `${value} ${unit}` : '未设置'
const BUTTON_FIELDS = [
  ['signupButtonText', '可报名'], ['signedUpButtonText', '已报名'], ['fullButtonText', '名额已满'],
  ['closedButtonText', '报名结束'], ['liveButtonText', '直播中'], ['replayButtonText', '活动回放'],
] as const

export default function ActivityMeetingDetails({ values }: { values: ActivityConfig }) {
  const config: ActivityConfig = { ...MEETING_DEFAULTS, ...values }
  const allowRegister = config.allowRegister !== false
  const audience = stringList(config.audience)
  const hasMembers = audience.includes('member')
  const customFields = recordList(config.customFields).map((field, key) => ({ key, label: displayValue(field.label), value: displayValue(field.value) }))
  const memberFields = recordList(config.memberFields).map((field, key) => ({
    key, label: displayValue(field.label), type: mappedLabel(FIELD_TYPE_LABELS, field.type),
    required: field.required === true ? '是' : '否',
    options: ['select', 'multiple'].includes(stringValue(field.type)) ? stringList(field.options).join('、') || '未设置' : '—',
  }))
  const rules = recordList(config.participationRules).map((rule, key) => ({
    key,
    type: rule.type === 'payment' ? '付费报名' : rule.type === 'invitation' ? '邀请码' : '未设置',
    content: rule.type === 'payment'
      ? typeof rule.paymentAmount === 'number' && Number.isFinite(rule.paymentAmount) ? `${rule.paymentAmount.toFixed(2)} 元` : '未设置'
      : rule.type === 'invitation' ? displayValue(rule.invitationCode) : '未设置',
  }))
  const registrationItems: DetailItem[] = [
    item('audience', '参与对象', audience.filter(identity => identity === 'member' || identity === 'employee').map(identity => mappedLabel(IDENTITY_LABELS, identity)).join('、') || '未设置'),
    item('identity', '推荐参与身份', mappedLabel(IDENTITY_LABELS, config.recommendedIdentity)),
    ...(hasMembers ? [item('memberScope', '会员参与范围', config.memberScope === 'all' ? '全部会员' : config.memberScope === 'selected' ? '指定会员分组' : '未设置')] : []),
    ...(hasMembers && config.memberScope === 'selected' ? [item('memberGroups', '会员分组', <Tags value={config.memberGroups} />)] : []),
    item('leadCapture', '报名信息收集', status(config.leadCapture)),
    item('audit', '报名需要审核', config.auditEnabled === true ? '需要审核' : '无需审核'),
    item('capacity', '报名名额', config.capacityLimited === true ? unitValue(config.capacity, '人') : '不限人数'),
    item('advanced', '高级参与条件', status(config.advancedRulesEnabled)),
  ]

  return <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <Card title="内部记录" size="small">
      <Details items={[item('campaign', 'Campaign 编码', <Tags value={config.campaignCodes} />)]} />
      {customFields.length ? <Table size="small" pagination={false} dataSource={customFields} columns={[
        { title: '字段名称', dataIndex: 'label', width: '30%' }, { title: '字段内容', dataIndex: 'value' },
      ]} style={{ overflowWrap: 'anywhere' }} /> : <Text type="secondary">未设置自定义字段</Text>}
    </Card>

    <Card title="参与规则与报名信息" size="small">
      {!allowRegister ? <Text type="secondary">报名已关闭，参与规则与报名信息收集未启用。</Text> : <>
        <Details items={registrationItems} />
        {config.leadCapture === true && <>
          <Divider titlePlacement="start">报名信息收集</Divider>
          <Table size="small" pagination={false} dataSource={memberFields} locale={{ emptyText: '未设置报名字段' }} scroll={{ x: 480 }} columns={[
            { title: '字段名称', dataIndex: 'label' }, { title: '字段类型', dataIndex: 'type' },
            { title: '必填', dataIndex: 'required', width: 64 }, { title: '可选项', dataIndex: 'options' },
          ]} style={{ overflowWrap: 'anywhere' }} />
        </>}
        {config.advancedRulesEnabled === true && <>
          <Divider titlePlacement="start">高级参与条件</Divider>
          <Table size="small" pagination={false} dataSource={rules} locale={{ emptyText: '未设置参与条件' }} columns={[
            { title: '条件类型', dataIndex: 'type', width: '30%' }, { title: '条件内容', dataIndex: 'content' },
          ]} style={{ overflowWrap: 'anywhere' }} />
        </>}
        <Divider titlePlacement="start">关注与参与引导</Divider>
        <Details items={[
          item('followWechat', '微信内引导关注', status(config.followWechat)),
          item('followNonWechat', '非微信环境引导关注', status(config.followNonWechat)),
          ...((config.followWechat === true || config.followNonWechat === true) ? [
            item('followReply', '关注后回复内容', displayValue(config.followReply)),
            item('followTitle', '关注弹窗标题', displayValue(config.followPopupTitle)),
            item('followDescription', '关注弹窗说明', displayValue(config.followPopupDescription)),
          ] : []),
          item('enterpriseQr', '展示企业微信二维码', status(config.enterpriseQrEnabled)),
          ...(config.enterpriseQrEnabled === true ? [item('enterpriseQrImage', '企业微信二维码', <Picture value={config.enterpriseQrUrl} label="企业微信二维码" />)] : []),
        ]} />
      </>}
    </Card>

    <Card title="状态及按钮文案" size="small">
      <Details items={[
        item('buttonMode', '按钮文案', config.buttonMode === 'custom' ? '自定义文案' : '使用默认文案'),
        ...BUTTON_FIELDS.map(([key, label]) => item(key, label, displayValue(config.buttonMode === 'custom' ? config[key] : MEETING_DEFAULTS[key]))),
      ]} />
    </Card>

    <Card title="来源和标签" size="small">
      <Details items={[
        item('source', '活动来源', displayValue(config.source)),
        item('focusTags', '关注标签', <Tags value={config.focusTags} />),
        item('signupTags', '报名标签', <Tags value={config.signupTags} />),
        item('attendanceTags', '参会标签', <Tags value={config.attendanceTags} />),
        item('replayTags', '回放标签', <Tags value={config.replayTags} />),
      ]} />
    </Card>

    <Card title="推广和分享" size="small">
      <Details items={[
        item('promotion', '推广渠道', <Tags value={config.promotionChannels} />),
        item('wechatShare', '允许微信分享', status(config.wechatShare)),
        ...(config.wechatShare === true ? [
          item('shareImage', '分享图片', <Picture value={config.shareImage} label="分享图片" />),
          item('shareSummary', '分享摘要', displayValue(config.shareSummary)),
        ] : []),
      ]} />
    </Card>

    <Card title="回放与活动资料" size="small">
      <Details items={[
        item('replay', '回放链接', <LinkValue value={config.replayUrl} />),
        item('materialName', '资料名称', displayValue(config.materialName)),
        item('material', '活动资料', <Material value={config.materialUrl} name={config.materialName} />),
      ]} />
    </Card>

    <Card title="报名成功设置" size="small">
      {!allowRegister ? <Text type="secondary">报名已关闭，报名成功提示与跳转未启用。</Text> : <>
        <Details items={[
          item('signupSuccess', '报名成功提示', <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{displayValue(config.signupSuccessText)}</Paragraph>),
          item('redirectEnabled', '报名成功后跳转', status(config.redirectEnabled)),
          ...(config.redirectEnabled === true ? [
            item('redirectUrl', '跳转链接', <LinkValue value={config.redirectUrl} />),
            item('redirectSeconds', '跳转等待时间', unitValue(config.redirectSeconds, '秒')),
          ] : []),
        ]} />
      </>}
    </Card>
  </Space>
}
