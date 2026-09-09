import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, InputNumber, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'

// 佣金公式管理（对齐佣金计算器对应表：flat/whole/tiered 三种计费）
interface Comm { id: number; category: string; group: string; type: string; rule: string }
const data: Comm[] = [
  { id: 1, category: '服饰鞋履、箱包&配饰', group: 'Fashion', type: 'whole', rule: '≤$15:5% / $15-20:10% / >$20:15%' },
  { id: 2, category: '小型家电', group: 'Home', type: 'tiered', rule: '≤$300:12% / 超出:8%' },
  { id: 3, category: '大型家电', group: 'Home', type: 'flat', rule: '8%' },
  { id: 4, category: '珠宝和贵金属', group: 'Fashion', type: 'tiered', rule: '≤$250:20% / 超出:5%' },
  { id: 5, category: '手表', group: 'Fashion', type: 'tiered', rule: '≤$1500:15% / 超出:3%' },
  { id: 6, category: '个人电脑', group: 'ETS', type: 'flat', rule: '6%' },
  { id: 7, category: '消费电子产品', group: 'ETS', type: 'flat', rule: '8%' },
  { id: 8, category: '玩具和游戏', group: 'ETS', type: 'flat', rule: '15%' },
]
const TYPE = { flat: { t: '固定费率', c: 'blue' }, whole: { t: '整档计费', c: 'orange' }, tiered: { t: '分段累进', c: 'purple' } }
type TK = keyof typeof TYPE

export default function SetCommission() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '商品类目', dataIndex: 'category' },
    { title: '合同分组', dataIndex: 'group', render: (v: string) => <Tag>{v}</Tag> },
    { title: '计费方式', dataIndex: 'type', render: (t: TK) => <Tag color={TYPE[t].c}>{TYPE[t].t}</Tag> },
    { title: '费率规则', dataIndex: 'rule', render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: '操作', render: () => <Space><a>编辑</a><a style={{ color: '#EF4444' }}>删除</a></Space> },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="搜索类目" prefix={<SearchOutlined />} style={{ width: 220 }} />
        <Select placeholder="计费方式" style={{ width: 140 }} allowClear options={Object.entries(TYPE).map(([k, v]) => ({ value: k, label: v.t }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增类目费率</Button>
        <Button>从Excel导入</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 15 }} />
      <div style={{ marginTop: 12, color: '#6B7280', fontSize: 13 }}>数据来源：佣金计算器对应表(2026-04-22版)，共35个类目。修改后同步至小程序佣金计算器。</div>

      <Modal title="新增类目费率" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已保存（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="商品类目" name="category" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="合同分组" name="group"><Select options={['Fashion', 'Home', 'Hardlines', 'ETS', 'FCHW'].map((g) => ({ value: g, label: g }))} /></Form.Item>
          <Form.Item label="计费方式" name="type"><Select options={Object.entries(TYPE).map(([k, v]) => ({ value: k, label: v.t }))} /></Form.Item>
          <Form.Item label="固定费率(%)" name="rate"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="分档规则(分段/整档时填)" name="tiers"><Input.TextArea rows={2} placeholder="如 300:12,999999:8 表示≤300为12%,超出8%" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
