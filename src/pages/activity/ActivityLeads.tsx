import { Card, Table, Tag, Select, DatePicker, Button, Space, Row, Col } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import EChart from '../../components/EChart'
import { NAMES, pick, randInt } from '../../mock/util'

// 按活动拆解的转化漏斗
const ACT_FUNNELS = [
  { name: '2026沃尔玛卖家峰会 (上海 07-20)', signup: 320, checkin: 256, register: 98 },
  { name: '新手入门直播课 (线上 07-22)', signup: 180, checkin: 150, register: 45 },
  { name: '广告投放工作坊 (深圳 07-17)', signup: 96, checkin: 78, register: 30 },
]

interface Lead { id: number; name: string; act: string; signup: string; checkin: string; register: string; remainDays: number; status: string }
const leads: Lead[] = Array.from({ length: 30 }).map((_, i) => {
  const remain = randInt(-5, 30)
  const hasReg = Math.random() > 0.6
  return {
    id: i + 1, name: pick(NAMES), act: pick(['峰会', '直播课', '工作坊']),
    signup: `07-${randInt(10, 18)}`, checkin: Math.random() > 0.3 ? `07-${randInt(15, 20)}` : '-',
    register: hasReg ? `07-${randInt(18, 22)}` : '-',
    remainDays: remain, status: remain < 0 ? 'expired' : hasReg ? 'registered' : 'checked',
  }
})
const ST = { registered: { t: '已入驻', c: 'blue' }, checked: { t: '已签到', c: 'green' }, expired: { t: '已失效', c: 'default' } }
type SK = keyof typeof ST

export default function ActivityLeads() {
  const columns = [
    { title: '卖家', dataIndex: 'name' },
    { title: '归属活动', dataIndex: 'act', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '报名', dataIndex: 'signup' },
    { title: '签到', dataIndex: 'checkin' },
    { title: '入驻', dataIndex: 'register' },
    { title: '绑定剩余', dataIndex: 'remainDays', render: (d: number) => (d < 0 ? <Tag>已失效</Tag> : <Tag color={d < 7 ? 'orange' : 'green'}>剩{d}天</Tag>) },
    { title: '状态', dataIndex: 'status', render: (s: SK) => <Tag color={ST[s].c}>{ST[s].t}</Tag> },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="活动" style={{ width: 200 }} allowClear options={ACT_FUNNELS.map((a) => ({ value: a.name, label: a.name }))} />
        <Select placeholder="城市" style={{ width: 120 }} allowClear options={['上海', '深圳', '线上'].map((c) => ({ value: c, label: c }))} />
        <Select placeholder="CP Manager" style={{ width: 150 }} allowClear options={['Candy Zhang', 'John Zhang'].map((c) => ({ value: c, label: c }))} />
        <DatePicker.RangePicker />
        <Button icon={<ExportOutlined />}>导出线索</Button>
      </Space>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {ACT_FUNNELS.map((a) => (
          <Col span={8} key={a.name}>
            <Card size="small" title={a.name} styles={{ header: { fontSize: 13 } }}>
              <EChart height={200} option={{
                tooltip: { trigger: 'item' },
                series: [{
                  type: 'funnel', left: 0, right: 0, top: 10, bottom: 10, label: { position: 'inside', formatter: '{b}\n{c}' },
                  data: [
                    { value: a.signup, name: '报名', itemStyle: { color: '#1A56DB' } },
                    { value: a.checkin, name: '签到', itemStyle: { color: '#3B82F6' } },
                    { value: a.register, name: '入驻', itemStyle: { color: '#10B981' } },
                  ],
                }],
              }} />
              <div style={{ textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
                签到率 {Math.round((a.checkin / a.signup) * 100)}% · 入驻率 {Math.round((a.register / a.signup) * 100)}%
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="线索明细（30天绑定规则：超期自动失效，重新参加重新绑定）">
        <Table rowKey="id" columns={columns} dataSource={leads} pagination={{ pageSize: 15 }} />
      </Card>
    </div>
  )
}
