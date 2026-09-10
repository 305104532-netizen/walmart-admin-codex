import { Card, Table, Tag, Button, Space, Input, Modal, Form, Select, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

// 内容字典：枚举/常量维护（站点、卖家类型、活动类型等）
interface DictGroup { key: string; name: string; items: string[] }
const groups: DictGroup[] = [
  { key: 'site', name: '站点', items: ['美国站', '加拿大站', '墨西哥站'] },
  { key: 'seller_type', name: '卖家类型', items: ['新卖家', '扩展卖家', 'DAY-ONE卖家'] },
  { key: 'activity_type', name: '活动类型', items: ['线上直播', '线下峰会', '工作坊', '分享会'] },
  { key: 'reg_status', name: '入驻状态', items: ['未入驻', '审核中', '已上线'] },
  { key: 'gmv_range', name: 'GMV区间', items: ['100万美元以下', '100-500万', '500-1000万', '1000-5000万', '5000万以上'] },
]

export default function ContentDictionary() {
  const [active, setActive] = useState('site')
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const cur = groups.find((g) => g.key === active)!

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <Card title="字典分组" style={{ flex: '1 1 200px' }} styles={{ body: { padding: 8 } }}>
        {groups.map((g) => (
          <button key={g.key} type="button" aria-pressed={g.key === active} onClick={() => setActive(g.key)}
            style={{ width: '100%', padding: '10px 12px', border: 0, borderRadius: 6, cursor: 'pointer', marginBottom: 4, textAlign: 'left', background: g.key === active ? '#EFF6FF' : 'transparent', color: g.key === active ? '#1A56DB' : '#111827' }}>
            {g.name}
          </button>
        ))}
      </Card>
      <Card title={`字典项 - ${cur.name}`} style={{ flex: '4 1 520px' }} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增字典项</Button>}>
        <Table
          rowKey="v"
          pagination={false}
          dataSource={cur.items.map((v, i) => ({ v, order: i + 1 }))}
          columns={[
            { title: '字典值', dataIndex: 'v', render: (v: string) => <Tag color="blue">{v}</Tag> },
            { title: '排序', dataIndex: 'order' },
            { title: '操作', render: () => <Space><a>编辑</a><a style={{ color: '#EF4444' }}>删除</a></Space> },
          ]}
          scroll={{ x: 560 }}
        />
      </Card>

      <Modal title="新增字典项" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已新增（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="所属分组" name="group"><Select defaultValue={active} options={groups.map((g) => ({ value: g.key, label: g.name }))} /></Form.Item>
          <Form.Item label="字典值" name="value" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
