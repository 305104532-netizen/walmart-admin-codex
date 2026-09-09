import { Card, Row, Col, Statistic, Table, Tag, DatePicker, Space } from 'antd'
import EChart from '../../components/EChart'
import { lastNDates, randInt } from '../../mock/util'

export default function GrowthEffect() {
  const dates = lastNDates(14)
  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['送达率', '点击率', '转化率'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [
      { name: '送达率', type: 'line', smooth: true, data: dates.map(() => randInt(85, 98)), itemStyle: { color: '#1A56DB' } },
      { name: '点击率', type: 'line', smooth: true, data: dates.map(() => randInt(20, 45)), itemStyle: { color: '#F59E0B' } },
      { name: '转化率', type: 'line', smooth: true, data: dates.map(() => randInt(5, 18)), itemStyle: { color: '#10B981' } },
    ],
  }

  const records = [
    { id: 1, name: '绑定PID后3天未学习提醒', channel: '服务号模板', sent: 320, delivered: 305, clicked: 128, converted: 42, time: '2026-07-15' },
    { id: 2, name: '7天未活跃召回', channel: '服务号模板', sent: 560, delivered: 520, clicked: 180, converted: 56, time: '2026-07-14' },
    { id: 3, name: '新课程上线通知', channel: '订阅消息', sent: 980, delivered: 940, clicked: 410, converted: 120, time: '2026-07-12' },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="累计推送" value={12680} /></Card></Col>
        <Col span={6}><Card><Statistic title="平均送达率" value={92.5} suffix="%" valueStyle={{ color: '#1A56DB' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="平均点击率" value={35.2} suffix="%" valueStyle={{ color: '#F59E0B' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="平均转化率" value={11.8} suffix="%" valueStyle={{ color: '#10B981' }} /></Card></Col>
      </Row>

      <Card title="推送效果趋势" extra={<DatePicker.RangePicker />} style={{ marginBottom: 16 }}>
        <EChart option={trendOption} />
      </Card>

      <Card title="推送记录">
        <Table
          rowKey="id"
          dataSource={records}
          pagination={false}
          columns={[
            { title: '推送任务', dataIndex: 'name' },
            { title: '渠道', dataIndex: 'channel', render: (v: string) => <Tag color="blue">{v}</Tag> },
            { title: '发送', dataIndex: 'sent' },
            { title: '送达', dataIndex: 'delivered' },
            { title: '点击', dataIndex: 'clicked' },
            { title: '转化', dataIndex: 'converted', render: (v: number) => <Tag color="green">{v}</Tag> },
            { title: '推送时间', dataIndex: 'time' },
          ]}
        />
      </Card>
    </div>
  )
}
