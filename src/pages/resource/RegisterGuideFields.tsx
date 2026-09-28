import type { ReactNode } from 'react'
import dayjs from 'dayjs'
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, Select, Space, Switch, Tabs, Tag, Tooltip, Typography } from 'antd'
import type { FormListFieldData, FormListOperation } from 'antd'
import type { RegisterGuideConfig } from '../../models/registerGuide'

type SectionKey = keyof RegisterGuideConfig

const ICON_OPTIONS = [
  { value: 'gift', label: '礼物' }, { value: 'checkCircle', label: '完成' },
  { value: 'users', label: '用户' }, { value: 'userCheck', label: '专属服务' },
  { value: 'trendingUp', label: '增长' }, { value: 'home', label: '门店' },
  { value: 'clock', label: '时间' }, { value: 'star', label: '星标' },
  { value: 'package', label: '包裹' },
]

function scheduleLabel(enabled?: boolean, period?: [dayjs.Dayjs, dayjs.Dayjs]) {
  if (!enabled) return { text: '已停用', color: 'default' }
  if (period?.[0] && dayjs().isBefore(period[0], 'day')) return { text: '待生效', color: 'processing' }
  if (period?.[1] && dayjs().isAfter(period[1], 'day')) return { text: '已结束', color: 'default' }
  return { text: '生效中', color: 'success' }
}

function SectionHeader({ section, title }: { section: SectionKey; title: string }) {
  const form = Form.useFormInstance()
  const enabled = Form.useWatch(['registerGuide', section, 'enabled'], form)
  const period = Form.useWatch(['registerGuide', section, 'period'], form)
  const state = scheduleLabel(enabled, period)
  return <div className="guide-section-head">
    <div><Typography.Title level={5}>{title}</Typography.Title><Tag color={state.color}>{state.text}</Tag></div>
    <Space wrap size={12}>
      <Form.Item name={['registerGuide', section, 'enabled']} label="区块启用" valuePropName="checked"><Switch /></Form.Item>
      <Form.Item name={['registerGuide', section, 'period']} label="生效时间"><DatePicker.RangePicker allowClear placeholder={['开始日期', '结束日期']} /></Form.Item>
    </Space>
  </div>
}

function ItemActions({ field, index, count, operation }: { field: FormListFieldData; index: number; count: number; operation: FormListOperation }) {
  return <Space size={0}>
    <Tooltip title="上移"><Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => operation.move(index, index - 1)} aria-label="上移" /></Tooltip>
    <Tooltip title="下移"><Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={index === count - 1} onClick={() => operation.move(index, index + 1)} aria-label="下移" /></Tooltip>
    <Tooltip title="删除"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => operation.remove(field.name)} aria-label="删除" /></Tooltip>
  </Space>
}

function GuideItems({ section, label, create, children }: {
  section: SectionKey
  label: string
  create: () => Record<string, unknown>
  children: (name: number) => ReactNode
}) {
  return <Form.List name={['registerGuide', section, 'items']}>{(fields, operation) => <div className="guide-list">
    {fields.map((field, index) => <div className="guide-entry" key={field.key}>
      <div className="guide-entry-head"><b>{label} {index + 1}</b><ItemActions field={field} index={index} count={fields.length} operation={operation} /></div>
      <Form.Item name={[field.name, 'id']} hidden><Input /></Form.Item>
      <div className="guide-entry-schedule">
        <Form.Item name={[field.name, 'enabled']} label="启用" valuePropName="checked"><Switch size="small" /></Form.Item>
        <Form.Item name={[field.name, 'period']} label="生效时间"><DatePicker.RangePicker size="small" allowClear placeholder={['开始日期', '结束日期']} /></Form.Item>
      </div>
      {children(field.name)}
    </div>)}
    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => operation.add(create())}>添加{label}</Button>
  </div>}</Form.List>
}

function TextItems({ name, label }: { name: (string | number)[]; label: string }) {
  return <Form.List name={name}>{(fields, operation) => <div className="guide-text-list">
    {fields.map((field, index) => <div className="guide-text-row" key={field.key}>
      <Form.Item name={field.name} rules={[{ required: true, whitespace: true, message: `请输入${label}` }]}><Input placeholder={`${label} ${index + 1}`} /></Form.Item>
      <ItemActions field={field} index={index} count={fields.length} operation={operation} />
    </div>)}
    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => operation.add('')}>添加{label}</Button>
  </div>}</Form.List>
}

function PromoFields() {
  return <>
    <SectionHeader section="promo" title="招商数据" />
    <div className="guide-section-body">
      <Form.Item name={['registerGuide', 'promo', 'title']} label="头部标题" rules={[{ required: true, whitespace: true }]}><Input maxLength={40} showCount /></Form.Item>
      <Form.Item name={['registerGuide', 'promo', 'subtitle']} label="头部说明"><Input maxLength={80} showCount /></Form.Item>
      <GuideItems section="promo" label="招商指标" create={() => ({ id: crypto.randomUUID(), enabled: true, label: '', value: '', icon: 'gift' })}>
        {(name) => <div className="guide-field-grid three">
          <Form.Item name={[name, 'label']} label="指标名称" rules={[{ required: true, whitespace: true }]}><Input maxLength={20} /></Form.Item>
          <Form.Item name={[name, 'value']} label="展示数值" rules={[{ required: true, whitespace: true }]}><Input maxLength={20} /></Form.Item>
          <Form.Item name={[name, 'icon']} label="图标"><Select options={ICON_OPTIONS} /></Form.Item>
        </div>}
      </GuideItems>
      <Typography.Text strong>招商标签</Typography.Text>
      <TextItems name={['registerGuide', 'promo', 'tags']} label="招商标签" />
    </div>
  </>
}

function SiteFields() {
  return <>
    <SectionHeader section="sites" title="站点条件" />
    <div className="guide-section-body">
      <GuideItems section="sites" label="站点" create={() => ({ id: crypto.randomUUID(), enabled: true, flag: '', name: '', url: '', badge: '', desc: '', condition: '', stats: [], tags: [] })}>
        {(name) => <>
          <div className="guide-field-grid site">
            <Form.Item name={[name, 'flag']} label="标识"><Input placeholder="站点标识" maxLength={8} /></Form.Item>
            <Form.Item name={[name, 'name']} label="站点名称" rules={[{ required: true, whitespace: true }]}><Input placeholder="美国站 · US Marketplace" /></Form.Item>
            <Form.Item name={[name, 'url']} label="站点域名"><Input placeholder="walmart.com" /></Form.Item>
            <Form.Item name={[name, 'badge']} label="角标"><Input placeholder="热门" maxLength={12} /></Form.Item>
          </div>
          <Form.Item name={[name, 'desc']} label="站点介绍" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={3} maxLength={600} showCount /></Form.Item>
          <Form.Item name={[name, 'condition']} label="入驻条件"><Input.TextArea rows={2} maxLength={300} showCount /></Form.Item>
          <Typography.Text strong>站点亮点</Typography.Text>
          <Form.List name={[name, 'stats']}>{(fields, operation) => <div className="guide-text-list">
            {fields.map((field, index) => <div className="guide-text-row" key={field.key}>
              <Form.Item name={[field.name, 'id']} hidden><Input /></Form.Item>
              <Form.Item name={[field.name, 'icon']}><Select aria-label="亮点图标" options={ICON_OPTIONS} style={{ width: 112 }} /></Form.Item>
              <Form.Item name={[field.name, 'text']} rules={[{ required: true, whitespace: true }]}><Input placeholder="站点亮点" /></Form.Item>
              <ItemActions field={field} index={index} count={fields.length} operation={operation} />
            </div>)}
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => operation.add({ id: crypto.randomUUID(), icon: 'star', text: '' })}>添加站点亮点</Button>
          </div>}</Form.List>
          <Typography.Text strong>站点标签</Typography.Text>
          <TextItems name={[name, 'tags']} label="站点标签" />
        </>}
      </GuideItems>
    </div>
  </>
}

function FlowFields() {
  return <>
    <SectionHeader section="flows" title="流程节点" />
    <div className="guide-section-body">
      <GuideItems section="flows" label="流程节点" create={() => ({ id: crypto.randomUUID(), enabled: true, title: '', desc: '' })}>
        {(name) => <div className="guide-field-grid two">
          <Form.Item name={[name, 'title']} label="节点名称" rules={[{ required: true, whitespace: true }]}><Input maxLength={30} /></Form.Item>
          <Form.Item name={[name, 'desc']} label="节点说明" rules={[{ required: true, whitespace: true }]}><Input maxLength={100} /></Form.Item>
        </div>}
      </GuideItems>
      <Typography.Text strong>所需材料</Typography.Text>
      <TextItems name={['registerGuide', 'flows', 'materials']} label="材料" />
    </div>
  </>
}

function FaqFields() {
  return <>
    <SectionHeader section="faqs" title="FAQ" />
    <div className="guide-section-body">
      <GuideItems section="faqs" label="常见问题" create={() => ({ id: crypto.randomUUID(), enabled: true, q: '', a: '' })}>
        {(name) => <>
          <Form.Item name={[name, 'q']} label="问题" rules={[{ required: true, whitespace: true }]}><Input maxLength={100} showCount /></Form.Item>
          <Form.Item name={[name, 'a']} label="回答" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={3} maxLength={1000} showCount /></Form.Item>
        </>}
      </GuideItems>
    </div>
  </>
}

function PolicyFields() {
  return <>
    <SectionHeader section="policies" title="政策内容" />
    <div className="guide-section-body">
      <GuideItems section="policies" label="政策" create={() => ({ id: crypto.randomUUID(), enabled: true, title: '', summary: '', content: '', url: '' })}>
        {(name) => <>
          <Form.Item name={[name, 'title']} label="政策标题" rules={[{ required: true, whitespace: true }]}><Input maxLength={80} showCount /></Form.Item>
          <Form.Item name={[name, 'summary']} label="摘要"><Input.TextArea rows={2} maxLength={180} showCount /></Form.Item>
          <Form.Item name={[name, 'content']} label="政策正文" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={5} maxLength={5000} showCount /></Form.Item>
          <Form.Item name={[name, 'url']} label="详情链接"><Input placeholder="小程序页面路径或 https:// 链接" /></Form.Item>
        </>}
      </GuideItems>
    </div>
  </>
}

export default function RegisterGuideFields({ activeKey, onChange }: { activeKey: SectionKey; onChange: (key: SectionKey) => void }) {
  return <div className="guide-config"><Tabs size="small" activeKey={activeKey} onChange={(key) => onChange(key as SectionKey)} items={[
    { key: 'promo', label: '招商数据', children: <PromoFields />, forceRender: true },
    { key: 'sites', label: '站点条件', children: <SiteFields />, forceRender: true },
    { key: 'flows', label: '流程节点', children: <FlowFields />, forceRender: true },
    { key: 'faqs', label: 'FAQ', children: <FaqFields />, forceRender: true },
    { key: 'policies', label: '政策内容', children: <PolicyFields />, forceRender: true },
  ]} /></div>
}
