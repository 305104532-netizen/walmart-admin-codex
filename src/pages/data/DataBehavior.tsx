import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import EChart from '../../components/EChart'
import { lastNDates, randInt } from '../../mock/util'

export default function DataBehavior() {
  const dates = lastNDates(14)
  const activeOption = {
    tooltip: { trigger: 'axis' }, legend: { data: ['DAU', '新增', '留存'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates }, yAxis: { type: 'value' },
    series: [
      { name: 'DAU', type: 'bar', data: dates.map(() => randInt(800, 1500)), itemStyle: { color: '#1A56DB' } },
      { name: '新增', type: 'line', smooth: true, data: dates.map(() => randInt(50, 150)), itemStyle: { color: '#10B981' } },
      { name: '留存', type: 'line', smooth: true, data: dates.map(() => randInt(300, 700)), itemStyle: { color: '#F59E0B' } },
    ],
  }
  const funnelOption = {
    tooltip: { trigger: 'item' },
    series: [{ type: 'funnel', left: '10%', width: '80%', label: { position: 'inside' }, data: [
      { value: 100, name: '访问小程序', itemStyle: { color: '#1A56DB' } },
      { value: 68, name: '浏览内容', itemStyle: { color: '#3B82F6' } },
      { value: 42, name: '进入入驻页', itemStyle: { color: '#60A5FA' } },
      { value: 25, name: '提交入驻', itemStyle: { color: '#10B981' } },
    ] }],
  }
  const paths = [
    { path: '首页 → 卖家大学 → 内容详情', count: 3200, rate: '28%' },
    { path: '首页 → 沃要开店 → 提交', count: 1800, rate: '16%' },
    { path: '活动中心 → 活动详情 → 报名', count: 1500, rate: '13%' },
    { path: '首页 → 成长中心 → 课程', count: 980, rate: '9%' },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="日活(DAU)" value={1256} valueStyle={{ color: '#1A56DB' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="月活(MAU)" value={18560} /></Card></Col>
        <Col span={6}><Card><Statistic title="次日留存" value={45.2} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="7日留存" value={28.6} suffix="%" /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col span={14}><Card title="活跃趋势"><EChart option={activeOption} /></Card></Col>
        <Col span={10}><Card title="核心转化漏斗"><EChart option={funnelOption} /></Card></Col>
      </Row>
      <Card title="高频访问路径" style={{ marginTop: 16 }}>
        <Table rowKey="path" pagination={false} dataSource={paths}
          columns={[
            { title: '访问路径', dataIndex: 'path' },
            { title: '访问次数', dataIndex: 'count' },
            { title: '占比', dataIndex: 'rate', render: (v: string) => <Tag color="blue">{v}</Tag> },
          ]} />
      </Card>
    </div>
  )
}
