import { Card, Row, Col, Statistic, Table, Tag, Progress } from 'antd'
import EChart from '../../components/EChart'
import { randInt, pick } from '../../mock/util'

export default function DataLearning() {
  const courseRank = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    name: pick(['入驻准备指南', 'Listing优化', '广告投放实战', 'WFS操作', '选品方法论', '店铺冷启动']) + ` ${i + 1}`,
    plays: randInt(500, 8000), completion: randInt(30, 95), avgDuration: `${randInt(3, 20)}分`,
  })).sort((a, b) => b.plays - a.plays)

  const catOption = {
    tooltip: { trigger: 'item' }, legend: { bottom: 0 },
    series: [{ type: 'pie', roseType: 'radius', radius: ['30%', '65%'], center: ['50%', '45%'], data: [
      { value: 3200, name: '新手入门' }, { value: 2400, name: '进阶运营' },
      { value: 1800, name: '广告投放' }, { value: 1200, name: '物流仓配' },
    ] }],
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="课程总播放" value={45680} /></Card></Col>
        <Col span={6}><Card><Statistic title="平均完课率" value={62.5} suffix="%" valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="人均学习时长" value={86} suffix="分" /></Card></Col>
        <Col span={6}><Card><Statistic title="完课人数" value={3860} /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="课程排行(播放量/完课率)">
            <Table rowKey="id" pagination={false} dataSource={courseRank}
              columns={[
                { title: '课程', dataIndex: 'name' },
                { title: '播放量', dataIndex: 'plays', sorter: (a, b) => a.plays - b.plays },
                { title: '完课率', dataIndex: 'completion', render: (v: number) => <Progress percent={v} size="small" style={{ width: 100 }} /> },
                { title: '人均时长', dataIndex: 'avgDuration' },
              ]} />
          </Card>
        </Col>
        <Col span={8}><Card title="分类学习占比"><EChart option={catOption} /></Card></Col>
      </Row>
    </div>
  )
}
