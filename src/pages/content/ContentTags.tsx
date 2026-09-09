import { Card, Table, Tag, Button, Space, Input, Modal, Form, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { randInt, pick } from '../../mock/util'

interface CTag { id: number; name: string; count: number; hot: boolean }
const data: CTag[] = ['入驻', '选品', 'WFS', '广告', 'Listing', '合规', '物流', '佣金', '税务', '品牌', '爆款', '冷启动'].map((t, i) => ({
  id: i + 1, name: t, count: randInt(5, 80), hot: Math.random() > 0.6,
}))

export default function ContentTags() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '标签名称', dataIndex: 'name', render: (v: string, r: CTag) => <Tag color={r.hot ? 'red' : 'blue'}>{v}{r.hot ? ' 🔥' : ''}</Tag> },
    { title: '关联内容数', dataIndex: 'count', sorter: (a: CTag, b: CTag) => a.count - b.count },
    { title: '热门标签', dataIndex: 'hot', render: (v: boolean) => (v ? <Tag color="orange">热门</Tag> : '-') },
    { title: '操作', render: () => <Space><a>编辑</a><a style={{ color: '#EF4444' }}>删除</a></Space> },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="搜索标签" style={{ width: 220 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增标签</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 12 }} />

      <Modal title="新增内容标签" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已新增（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="标签名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="是否热门" name="hot"><Input placeholder="是/否" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
