import { Card, Table, Tag, Button, Space, Switch, Modal, Form, Input, Select, Radio, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

interface Rule { id: number; name: string; condition: string; push: string; freq: string; enabled: boolean }

const initRules: Rule[] = [
  { id: 1, name: '绑定PID后3天未开始学习', condition: 'days_since_bindpid > 3 AND study_hours = 0', push: '服务号模板消息', freq: '触发即推', enabled: true },
  { id: 2, name: '超7天未打开小程序', condition: 'days_since_last_active > 7', push: '服务号模板消息', freq: '每日定时检查', enabled: true },
  { id: 3, name: '入驻满7天未完成必修课', condition: 'days_since_register > 7 AND required_completion < 100%', push: '小程序订阅消息', freq: '仅推送一次', enabled: false },
]

export default function RegisterRemind() {
  const [rules, setRules] = useState(initRules)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const toggle = (id: number) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))

  const columns = [
    { title: '规则名称', dataIndex: 'name' },
    { title: '触发条件 (Trigger)', dataIndex: 'condition', render: (v: string) => <code style={{ fontSize: 12, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>{v}</code> },
    { title: '推送方式', dataIndex: 'push', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '执行频率', dataIndex: 'freq' },
    { title: '状态', dataIndex: 'enabled', render: (v: boolean, r: Rule) => <Switch checked={v} onChange={() => toggle(r.id)} /> },
    { title: '操作', render: () => <Space><a>编辑</a><a style={{ color: '#EF4444' }}>删除</a></Space> },
  ]

  return (
    <div>
      <Card
        title="学习提醒规则（触发器 Trigger + 旅程编排 Journey Builder）"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增规则</Button>}
      >
        <Table rowKey="id" columns={columns} dataSource={rules} pagination={false} />
        <div style={{ marginTop: 16, padding: 12, background: '#EFF6FF', borderRadius: 8, color: '#6B7280', fontSize: 13 }}>
          规则引擎即触发器+旅程编排能力入口：行为/时间自动触发 → 分层触达（引用人群圈选）→ 服务号模板消息/订阅消息。可视化编排画布为二期增强。
        </div>
      </Card>

      <Modal title="新增提醒规则" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已保存（mock）'); setOpen(false) }} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item label="规则名称" name="name" rules={[{ required: true }]}><Input placeholder="如 绑定PID后3天未学习" /></Form.Item>
          <Form.Item label="触发条件" name="condition"><Input.TextArea placeholder="days_since_bindpid > 3 AND study_hours = 0" /></Form.Item>
          <Form.Item label="目标人群" name="audience"><Select placeholder="引用人群圈选" options={[{ value: 'all', label: '全部卖家' }, { value: 'no_wfs', label: '未采用WFS人群' }, { value: 'inactive', label: '低活跃人群' }]} /></Form.Item>
          <Form.Item label="推送方式" name="push"><Radio.Group options={['服务号模板消息', '站内信', '小程序订阅消息']} /></Form.Item>
          <Form.Item label="执行频率" name="freq"><Radio.Group options={['触发即推', '每日定时检查', '仅推送一次']} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
