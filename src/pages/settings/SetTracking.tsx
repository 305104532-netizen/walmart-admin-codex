import { Card, Table, Tag, Button, Space, Switch, Modal, Form, Input, Select, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

// 埋点配置：页面/事件埋点管理（对应PRD5数据收集）
interface Track { id: number; event: string; page: string; type: string; enabled: boolean; desc: string }
const data: Track[] = [
  { id: 1, event: 'page_view', page: '全局', type: '页面浏览', enabled: true, desc: 'PV/UV统计' },
  { id: 2, event: 'qrcode_landing', page: '二维码落地页', type: '事件', enabled: true, desc: '二维码落地页PV/UV' },
  { id: 3, event: 'claim_incentive', page: '激励页', type: '事件', enabled: true, desc: '点击领取激励' },
  { id: 4, event: 'venue_pv', page: '分会场', type: '事件', enabled: true, desc: '分会场PV/UV' },
  { id: 5, event: 'register_submit', page: '入驻页', type: '转化', enabled: true, desc: '提交入驻' },
  { id: 6, event: 'checkin_success', page: '活动签到', type: '转化', enabled: true, desc: '签到成功' },
]

export default function SetTracking() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '事件Key', dataIndex: 'event', render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: '所在页面', dataIndex: 'page' },
    { title: '类型', dataIndex: 'type', render: (v: string) => <Tag color={v === '转化' ? 'green' : v === '事件' ? 'blue' : 'default'}>{v}</Tag> },
    { title: '说明', dataIndex: 'desc' },
    { title: '启用', dataIndex: 'enabled', render: (v: boolean) => <Switch defaultChecked={v} /> },
    { title: '操作', render: () => <Space><a>编辑</a><a>数据</a></Space> },
  ]

  return (
    <div>
      <Card title="埋点配置" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增埋点</Button>}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      </Card>
      <Modal title="新增埋点" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已保存（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="事件Key" name="event" rules={[{ required: true }]}><Input placeholder="如 qrcode_landing" /></Form.Item>
          <Form.Item label="所在页面" name="page"><Input /></Form.Item>
          <Form.Item label="类型" name="type"><Select options={['页面浏览', '事件', '转化'].map((t) => ({ value: t, label: t }))} /></Form.Item>
          <Form.Item label="说明" name="desc"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
