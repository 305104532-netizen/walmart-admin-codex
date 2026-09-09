import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Progress } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

interface Survey { id: number; title: string; act: string; questions: number; responses: number; sent: number; status: string }
const data: Survey[] = [
  { id: 1, title: '2026峰会满意度调查', act: '沃尔玛卖家峰会', questions: 8, responses: 186, sent: 256, status: '收集中' },
  { id: 2, title: '直播课后反馈', act: '新手入门直播课', questions: 5, responses: 98, sent: 150, status: '收集中' },
  { id: 3, title: '工作坊效果评估', act: '广告投放工作坊', questions: 6, responses: 70, sent: 78, status: '已结束' },
]

export default function ActivitySurvey() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '问卷标题', dataIndex: 'title' },
    { title: '关联活动', dataIndex: 'act', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '题目数', dataIndex: 'questions' },
    { title: '回收率', render: (_: unknown, r: Survey) => <Progress percent={Math.round((r.responses / r.sent) * 100)} size="small" style={{ width: 120 }} /> },
    { title: '回收/发放', render: (_: unknown, r: Survey) => `${r.responses}/${r.sent}` },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === '收集中' ? 'green' : 'default'}>{s}</Tag> },
    { title: '操作', render: () => <Space><a>查看结果</a><a>编辑</a><a>导出</a></Space> },
  ]

  return (
    <div>
      <Card title="问卷列表" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>创建问卷</Button>}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      </Card>

      <Modal title="创建问卷" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('问卷已创建（mock）'); setOpen(false) }} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item label="问卷标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="关联活动" name="act"><Select options={['沃尔玛卖家峰会', '新手入门直播课', '广告投放工作坊'].map((a) => ({ value: a, label: a }))} /></Form.Item>
          <Form.Item label="题目设置" name="questions"><Input.TextArea rows={4} placeholder="每行一题，支持单选/多选/评分/填空（mock）" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
