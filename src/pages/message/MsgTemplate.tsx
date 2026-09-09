import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

interface Tmpl { id: number; name: string; tmplId: string; scene: string; status: string; sent: number }
const data: Tmpl[] = [
  { id: 1, name: '入驻审核结果通知', tmplId: 'OPENTM01', scene: '入驻', status: 'enabled', sent: 1280 },
  { id: 2, name: '学习提醒通知', tmplId: 'OPENTM02', scene: '成长', status: 'enabled', sent: 3560 },
  { id: 3, name: '活动开始提醒', tmplId: 'OPENTM03', scene: '活动', status: 'enabled', sent: 2100 },
  { id: 4, name: 'PID绑定成功通知', tmplId: 'OPENTM04', scene: '入驻', status: 'disabled', sent: 860 },
]

export default function MsgTemplate() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '模板名称', dataIndex: 'name' },
    { title: '模板ID', dataIndex: 'tmplId', render: (v: string) => <code>{v}</code> },
    { title: '业务场景', dataIndex: 'scene', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '累计发送', dataIndex: 'sent' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'enabled' ? 'green' : 'default'}>{s === 'enabled' ? '启用' : '停用'}</Tag> },
    { title: '操作', render: () => <Space><a>编辑</a><a>测试发送</a><a>发送记录</a></Space> },
  ]

  return (
    <div>
      <Card title="服务号模板消息" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增模板</Button>}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      </Card>
      <Modal title="新增模板消息" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已保存（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="模板名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="微信模板ID" name="tmplId"><Input placeholder="OPENTM..." /></Form.Item>
          <Form.Item label="业务场景" name="scene"><Select options={['入驻', '成长', '活动', '内容'].map((s) => ({ value: s, label: s }))} /></Form.Item>
          <Form.Item label="模板内容" name="content"><Input.TextArea rows={4} placeholder="{{first.DATA}} 尊敬的卖家..." /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
