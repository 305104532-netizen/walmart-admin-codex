import { Card, Row, Col, Table, Tag } from 'antd'
import EChart from '../../components/EChart'
import { randInt } from '../../mock/util'

const PERSONAS = [
  { key: 'base', name: '基础留存·意向不明', quadrant: '未入驻·低成熟度', count: 3200, color: '#9CA3AF' },
  { key: 'intent', name: '高入驻意愿卖家', quadrant: '未入驻·高成熟度', count: 1850, color: '#2563EB' },
  { key: 'need', name: '须进一步促活·指引学习', quadrant: '已入驻·低成熟度', count: 2400, color: '#D97706' },
  { key: 'potential', name: '潜力成长卖家', quadrant: '已入驻·中成熟度', count: 1600, color: '#0D9488' },
  { key: 'core', name: '核心高质量活跃卖家', quadrant: '已入驻·高成熟度', count: 980, color: '#7C3AED' },
]

export default function GrowthPersona() {
  // 散点图：x=成熟度评分 y=入驻进度
  const scatterOption = {
    tooltip: { trigger: 'item' },
    xAxis: { name: '成熟度评分', min: 0, max: 100 },
    yAxis: { name: '入驻进度', min: 0, max: 100 },
    series: [{
      type: 'scatter',
      symbolSize: (d: number[]) => Math.sqrt(d[2]) / 2,
      data: PERSONAS.flatMap((p) => Array.from({ length: 20 }).map(() => [randInt(0, 100), randInt(0, 100), p.count / 10])),
      itemStyle: { color: '#1A56DB', opacity: 0.5 },
    }],
  }

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '42%'], data: PERSONAS.map((p) => ({ name: p.name, value: p.count, itemStyle: { color: p.color } })) }],
  }

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}><Card title="卖家画像四象限分布（成熟度 × 入驻进度）"><EChart option={scatterOption} /></Card></Col>
        <Col span={12}><Card title="画像人群占比"><EChart option={pieOption} /></Card></Col>
      </Row>
      <Card title="画像人群明细" style={{ marginTop: 16 }}>
        <Table
          rowKey="key"
          pagination={false}
          dataSource={PERSONAS}
          columns={[
            { title: '画像名称', dataIndex: 'name', render: (v: string, r) => <Tag color={r.color === '#9CA3AF' ? 'default' : 'blue'}>{v}</Tag> },
            { title: '四象限归属', dataIndex: 'quadrant' },
            { title: '人群规模', dataIndex: 'count', sorter: (a, b) => a.count - b.count },
            { title: '运营建议', render: (_, __, i) => ['先完成入门测评，了解入驻收益', '尽快完成入驻申请', '完成必修课程提升运营力', '持续学习可晋级金牌', '尽享高阶权益，重点维护'][i] },
            { title: '操作', render: () => <a>圈选此人群 →</a> },
          ]}
        />
      </Card>
    </div>
  )
}
