import { Card, Row, Col, Statistic, DatePicker, Space } from 'antd'
import EChart from '../../components/EChart'
import { lastNDates, randInt } from '../../mock/util'

export default function DataOverview() {
  const dates = lastNDates(30)
  const pvOption = {
    tooltip: { trigger: 'axis' }, legend: { data: ['PV', 'UV'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [
      { name: 'PV', type: 'line', smooth: true, areaStyle: { opacity: 0.1 }, data: dates.map(() => randInt(1000, 2500)), itemStyle: { color: '#1A56DB' } },
      { name: 'UV', type: 'line', smooth: true, data: dates.map(() => randInt(400, 900)), itemStyle: { color: '#10B981' } },
    ],
  }
  const sourceOption = {
    tooltip: { trigger: 'item' }, legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'], data: [
      { value: 4200, name: '经理转发', itemStyle: { color: '#1A56DB' } },
      { value: 2800, name: '活动渠道', itemStyle: { color: '#10B981' } },
      { value: 1900, name: '自然流量', itemStyle: { color: '#F59E0B' } },
      { value: 1100, name: '二级转发', itemStyle: { color: '#8B5CF6' } },
    ] }],
  }
  const pageOption = {
    tooltip: { trigger: 'axis' }, grid: { left: 100, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: ['首页', '卖家大学', '活动中心', '沃要开店', '成长中心', '我的'] },
    series: [{ type: 'bar', data: [8900, 6700, 5400, 4200, 3100, 2800], itemStyle: { color: '#1A56DB', borderRadius: [0, 4, 4, 0] } }],
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}><DatePicker.RangePicker /></Space>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="总访问量(PV)" value={456780} /></Card></Col>
        <Col span={6}><Card><Statistic title="独立访客(UV)" value={128456} /></Card></Col>
        <Col span={6}><Card><Statistic title="人均停留(分)" value={12.5} /></Card></Col>
        <Col span={6}><Card><Statistic title="跳出率" value={32.1} suffix="%" /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col span={16}><Card title="PV/UV 趋势（近30天）"><EChart option={pvOption} /></Card></Col>
        <Col span={8}><Card title="流量来源分布"><EChart option={sourceOption} /></Card></Col>
      </Row>
      <Card title="页面访问排行" style={{ marginTop: 16 }}><EChart option={pageOption} height={260} /></Card>
    </div>
  )
}
