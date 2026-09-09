import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

interface Msg { id: number; title: string; audience: string; sent: number; read: number; time: string; status: string }
const data: Msg[] = [
  { id: 1, title: '沃尔玛Q3新政策上线通知', audience: '全部卖家', sent: 12456, read: 8900, time: '2026-07-15', status: '已发送' },
  { id: 2, title: '新卖家专属福利', audience: '未入驻卖家', sent: 5230, read: 3100, time: '2026-07-14', status: '已发送' },
  { id: 3, title: '暑期活动预告', audience: '已入驻卖家', sent: 5366, read: 0, time: '2026-07-20', status: '待发送' },
]

export default function MsgInbox() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '消息标题', dataIndex: 'title' },
    { title: '目标人群', dataIndex: 'audience', render: (v: string) => <Tag>{v}</Tag> },
    { title: '发送数', dataIndex: 'sent' },
    { title: '已读数', dataIndex: 'read' },
    { title: '阅读率', render: (_: unknown, r: Msg) => (r.sent ? `${Math.round((r.read / r.sent) * 100)}%` : '-') },
    { title: '时间', dataIndex: 'time' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === '已发送' ? 'green' : 'gold'}>{s}</Tag> },
    { title: '操作', render: () => <Space><a>详情</a><a>撤回</a></Space> },
  ]

  return (
    <div>
      <Card title="站内信管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>发布站内信</Button>}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      </Card>
      <Modal title="发布站内信" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已发布（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="消息标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="目标人群" name="audience"><Select options={['全部卖家', '未入驻卖家', '已入驻卖家', '自定义人群包'].map((s) => ({ value: s, label: s }))} /></Form.Item>
          <Form.Item label="消息内容" name="content"><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
