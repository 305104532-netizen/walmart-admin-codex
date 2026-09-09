import { Card, Button, Space, Select, Statistic, Row, Col, Tag, Table, message, Divider } from 'antd'
import { useState } from 'react'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { randInt } from '../../mock/util'

interface Cond { id: number; field: string; op: string; value: string }
const FIELDS = ['标签', '入驻状态', '成长等级', '综合评分', '近7天活跃', '完课率']
const OPS = ['等于', '不等于', '大于', '小于', '包含']

export default function GrowthAudience() {
  const [conds, setConds] = useState<Cond[]>([{ id: 1, field: '标签', op: '包含', value: '未采用WFS服务' }])
  const [conjunction, setConjunction] = useState('and')
  const estimated = randInt(800, 3000)

  const add = () => setConds((c) => [...c, { id: Date.now(), field: '入驻状态', op: '等于', value: '' }])
  const remove = (id: number) => setConds((c) => c.filter((x) => x.id !== id))
  const update = (id: number, k: keyof Cond, v: string) => setConds((c) => c.map((x) => (x.id === id ? { ...x, [k]: v } : x)))

  const savedGroups = [
    { key: 1, name: '未采用WFS的活跃卖家', count: 1240, created: '2026-07-10' },
    { key: 2, name: '高入驻意愿未转化', count: 860, created: '2026-07-12' },
  ]

  return (
    <div>
      <Card title="人群圈选条件">
        <Space style={{ marginBottom: 12 }}>
          条件关系：
          <Select value={conjunction} onChange={setConjunction} style={{ width: 120 }} options={[{ value: 'and', label: '同时满足(AND)' }, { value: 'or', label: '任一满足(OR)' }]} />
        </Space>
        {conds.map((c) => (
          <Space key={c.id} style={{ display: 'flex', marginBottom: 8 }}>
            <Select value={c.field} style={{ width: 130 }} onChange={(v) => update(c.id, 'field', v)} options={FIELDS.map((f) => ({ value: f, label: f }))} />
            <Select value={c.op} style={{ width: 100 }} onChange={(v) => update(c.id, 'op', v)} options={OPS.map((o) => ({ value: o, label: o }))} />
            <Select value={c.value} style={{ width: 200 }} onChange={(v) => update(c.id, 'value', v)} placeholder="值"
              options={['未采用WFS服务', '未投放广告', '已入驻', '未入驻', 'LV1', 'LV2', 'LV3'].map((v) => ({ value: v, label: v }))} />
            <Button icon={<DeleteOutlined />} danger onClick={() => remove(c.id)} />
          </Space>
        ))}
        <Button type="dashed" icon={<PlusOutlined />} onClick={add} style={{ marginTop: 8 }}>添加条件</Button>

        <Divider />
        <Row align="middle" gutter={24}>
          <Col><Statistic title="预估覆盖人数" value={estimated} valueStyle={{ color: '#1A56DB' }} /></Col>
          <Col><Button type="primary" onClick={() => message.success('人群包已保存（mock）')}>保存为人群包</Button></Col>
          <Col><Button onClick={() => message.info('已发起触达')}>直接推送触达</Button></Col>
        </Row>
      </Card>

      <Card title="已保存人群包" style={{ marginTop: 16 }}>
        <Table
          rowKey="key"
          pagination={false}
          dataSource={savedGroups}
          columns={[
            { title: '人群包名称', dataIndex: 'name' },
            { title: '人数', dataIndex: 'count', render: (v: number) => <Tag color="blue">{v}</Tag> },
            { title: '创建时间', dataIndex: 'created' },
            { title: '操作', render: () => <Space><a>推送课程</a><a>编辑</a><a style={{ color: '#EF4444' }}>删除</a></Space> },
          ]}
        />
      </Card>
    </div>
  )
}
