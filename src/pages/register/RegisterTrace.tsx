import { useState } from 'react'
import { Card, Table, Segmented, DatePicker, Button, Space, Row, Col, Tag, Descriptions } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import EChart from '../../components/EChart'
import { MANAGERS, randInt } from '../../mock/util'

const UTM_FIELDS = [
  ['Lead Source', '线索来源', 'Manager'],
  ['Sub Lead Source', '子线索来源', 'WeChat-Share'],
  ['City', '城市', '深圳'],
  ['Promotion Site', '推广站点', 'mp-leads-h5'],
  ['Campaign', '活动', '2026Q3-newseller'],
  ['Content', '内容', 'banner-a'],
  ['CP Name', 'CP名称', '致趣百川'],
  ['CP Manager', 'CP经理', 'Candy Zhang'],
  ['Other Lead Source', '其他线索来源', '-'],
  ['Marketplace', '市场站点', 'US'],
  ['BD Manager', 'BD经理', 'John Zhang'],
]

export default function RegisterTrace() {
  const [dim, setDim] = useState<string>('manager')

  const rows = MANAGERS.map((m, i) => {
    const invite = randInt(50, 200)
    const signup = randInt(30, invite)
    const online = randInt(10, signup)
    return { key: i, name: m, invite, signup, online, rate: ((online / invite) * 100).toFixed(1) }
  })

  const columns = [
    { title: dim === 'manager' ? '客户经理' : '渠道', dataIndex: 'name' },
    { title: '邀请数', dataIndex: 'invite', sorter: (a: any, b: any) => a.invite - b.invite },
    { title: '报名数', dataIndex: 'signup' },
    { title: '入驻数', dataIndex: 'online' },
    { title: '转化率', dataIndex: 'rate', render: (v: string) => <Tag color="blue">{v}%</Tag> },
    { title: '操作', render: () => <a>查看明细</a> },
  ]

  const funnelOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'funnel', left: '10%', width: '80%', label: { position: 'inside' },
      data: [
        { value: 100, name: '链接访问', itemStyle: { color: '#1A56DB' } },
        { value: 80, name: '开始填写', itemStyle: { color: '#3B82F6' } },
        { value: 62, name: '提交申请', itemStyle: { color: '#60A5FA' } },
        { value: 45, name: '审核通过', itemStyle: { color: '#10B981' } },
      ],
    }],
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Segmented options={[{ label: '按经理', value: 'manager' }, { label: '按渠道', value: 'channel' }]} value={dim} onChange={(v) => setDim(v as string)} />
        <DatePicker.RangePicker />
        <Button type="primary" icon={<ExportOutlined />}>导出</Button>
      </Space>

      <Row gutter={16}>
        <Col span={14}>
          <Card title={dim === 'manager' ? '经理溯源转化' : '渠道溯源转化'}>
            <Table rowKey="key" columns={columns} dataSource={rows} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="转化漏斗">
            <EChart option={funnelOption} height={280} />
          </Card>
        </Col>
      </Row>

      <Card title="UTM 溯源字段（链接自动采集的11个隐藏字段）" style={{ marginTop: 16 }}>
        <Descriptions bordered size="small" column={2}>
          {UTM_FIELDS.map(([en, cn, val]) => (
            <Descriptions.Item key={en} label={`${cn} (${en})`}>{val}</Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      <Card title="转发溯源归属规则" style={{ marginTop: 16 }} size="small">
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>一级转发（经理→卖家）→ leads 归属该经理</li>
          <li>二级转发（卖家→卖家）→ 归属小程序 (organic)</li>
          <li>专属链接每个卖家仅可填写一次（linkId 校验）</li>
          <li>多来源冲突 → 以末次有效链接归属为准</li>
        </ul>
      </Card>
    </div>
  )
}
