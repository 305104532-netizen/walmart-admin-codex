import { Card, Table, Tag, Button, Space, Modal, Form, Input, DatePicker, message, QRCode } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

// 临时页面管理：H5 落地页 / 专题页（可生成二维码分发）
interface TempPage { id: number; title: string; path: string; pv: number; period: string; status: string }
const data: TempPage[] = [
  { id: 1, title: '2026峰会专题页', path: '/pages/temp/summit2026', pv: 12800, period: '07-01 ~ 07-31', status: '已发布' },
  { id: 2, title: 'WFS政策解读专题', path: '/pages/temp/wfs', pv: 5600, period: '长期', status: '已发布' },
  { id: 3, title: '双十一预热页', path: '/pages/temp/1111', pv: 0, period: '未开始', status: '草稿' },
]

export default function ResPages() {
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState<string>()
  const [form] = Form.useForm()

  const columns = [
    { title: '页面标题', dataIndex: 'title' },
    { title: '路径', dataIndex: 'path', render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: '访问量(PV)', dataIndex: 'pv' },
    { title: '有效期', dataIndex: 'period' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === '已发布' ? 'green' : s === '草稿' ? 'default' : 'gold'}>{s}</Tag> },
    { title: '操作', render: (_: unknown, r: TempPage) => <Space><a>编辑</a><a onClick={() => setQr(r.path)}>二维码</a><a style={{ color: '#EF4444' }}>下线</a></Space> },
  ]

  return (
    <div>
      <Card title="临时页面 / 专题页管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建临时页面</Button>}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      </Card>

      <Modal title="新建临时页面" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已创建（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="页面标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="页面路径" name="path"><Input placeholder="/pages/temp/xxx" /></Form.Item>
          <Form.Item label="有效期" name="period"><DatePicker.RangePicker /></Form.Item>
          <Form.Item label="页面内容" name="content"><Input.TextArea rows={4} placeholder="富文本/组件配置（mock）" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="页面二维码" open={!!qr} onCancel={() => setQr(undefined)} footer={null}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <QRCode value={`https://walmart-mp${qr || ''}`} size={180} />
          <p style={{ marginTop: 12, color: '#6B7280' }}>{qr}</p>
        </div>
      </Modal>
    </div>
  )
}
