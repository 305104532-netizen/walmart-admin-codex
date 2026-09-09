import { Card, Table, Tag, Button, Space, Progress, Modal, Form, Input, Select, DatePicker, Switch, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

interface Task { id: number; name: string; course: string; target: number; done: number; deadline: string; status: string }

const tasks: Task[] = [
  { id: 1, name: '7月新手课程学习', course: '入驻指南', target: 45, done: 32, deadline: '2026-07-20', status: '进行中' },
  { id: 2, name: '进阶运营课学习', course: '上架攻略', target: 28, done: 12, deadline: '2026-07-25', status: '进行中' },
  { id: 3, name: '广告投放专题', course: '广告运营', target: 60, done: 58, deadline: '2026-07-15', status: '即将截止' },
]

export default function RegisterTask() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '任务名称', dataIndex: 'name' },
    { title: '关联课程', dataIndex: 'course', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '目标人数', dataIndex: 'target' },
    { title: '完成数', dataIndex: 'done' },
    { title: '完成率', render: (_: unknown, r: Task) => <Progress percent={Math.round((r.done / r.target) * 100)} size="small" style={{ width: 120 }} /> },
    { title: '截止日', dataIndex: 'deadline' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === '即将截止' ? 'orange' : 'green'}>{s}</Tag> },
    { title: '操作', render: () => <Space><a>详情</a><a>催办</a></Space> },
  ]

  return (
    <div>
      <Card title="任务列表" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>创建任务</Button>}>
        <Table rowKey="id" columns={columns} dataSource={tasks} pagination={false} />
      </Card>

      <Modal title="创建任务" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('任务已创建（mock）'); setOpen(false) }} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item label="任务名称" name="name" rules={[{ required: true }]}><Input placeholder="如 7月新手课程学习" /></Form.Item>
          <Form.Item label="关联课程" name="courses"><Select mode="multiple" placeholder="选择课程" options={[{ value: 'c1', label: '入驻指南' }, { value: 'c2', label: '上架攻略' }, { value: 'c3', label: '广告运营' }]} /></Form.Item>
          <Form.Item label="目标卖家" name="target"><Select placeholder="选择方式" options={[{ value: 'seller', label: '指定卖家(搜索添加)' }, { value: 'persona', label: '按画像组' }, { value: 'manager', label: '按经理名下' }]} /></Form.Item>
          <Form.Item label="截止日期" name="deadline"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="提醒频率" name="freq"><Select options={[{ value: 'none', label: '不提醒' }, { value: 'daily', label: '每日' }, { value: 'alt', label: '隔日' }, { value: 'before1', label: '截止前1天' }]} /></Form.Item>
          <Form.Item label="创建时推送通知" name="notify" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
