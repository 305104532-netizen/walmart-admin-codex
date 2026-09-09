import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Radio, message, Tabs } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

interface TagItem { id: number; name: string; type: 'auto' | 'custom'; rule: string; count: number }

const initTags: TagItem[] = [
  { id: 1, name: '已入驻', type: 'auto', rule: 'status = online', count: 5366 },
  { id: 2, name: '未入驻', type: 'auto', rule: 'status = unregistered', count: 5230 },
  { id: 3, name: '高停留时长', type: 'auto', rule: 'avg_daily_minutes > 15', count: 2100 },
  { id: 4, name: '低停留时长', type: 'auto', rule: 'avg_daily_minutes < 3', count: 3400 },
  { id: 5, name: '未采用WFS服务', type: 'custom', rule: '人工/运营标记', count: 1800 },
  { id: 6, name: '未投放广告', type: 'custom', rule: '人工/运营标记', count: 2600 },
  { id: 7, name: '未达到MB门槛', type: 'custom', rule: '人工/运营标记', count: 900 },
]

export default function GrowthTags() {
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const data = tab === 'all' ? initTags : initTags.filter((t) => t.type === tab)

  const columns = [
    { title: '标签名称', dataIndex: 'name', render: (v: string, r: TagItem) => <Tag color={r.type === 'auto' ? 'blue' : 'orange'}>{v}</Tag> },
    { title: '类型', dataIndex: 'type', render: (t: string) => (t === 'auto' ? '自动标签' : '自定义标签') },
    { title: '规则/来源', dataIndex: 'rule', render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: '覆盖人数', dataIndex: 'count', sorter: (a: TagItem, b: TagItem) => a.count - b.count },
    { title: '操作', render: (_: unknown, r: TagItem) => <Space><a>编辑</a><a>圈选</a>{r.type === 'custom' && <a style={{ color: '#EF4444' }}>删除</a>}</Space> },
  ]

  return (
    <div>
      <Tabs activeKey={tab} onChange={setTab} items={[{ key: 'all', label: '全部' }, { key: 'auto', label: '自动标签' }, { key: 'custom', label: '自定义标签' }]}
        tabBarExtraContent={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增自定义标签</Button>} />
      <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />

      <Modal title="新增自定义标签" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已创建（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="标签名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="标签类型" name="type"><Radio.Group options={[{ value: 'manual', label: '人工打标' }, { value: 'rule', label: '规则自动' }]} /></Form.Item>
          <Form.Item label="规则表达式(规则类)" name="rule"><Input placeholder="如 wfs_used = false" /></Form.Item>
          <Form.Item label="标签颜色" name="color"><Select options={[{ value: 'blue', label: '蓝' }, { value: 'orange', label: '橙' }, { value: 'green', label: '绿' }]} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
