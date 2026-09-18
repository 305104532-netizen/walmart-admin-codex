import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd'
import EChart from '../../components/EChart'
import { lastNDates, randInt } from '../../mock/util'
import { DEFAULT_MINI_PROGRAM_PAGES } from '../../models/tempPages'

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
  const totalPageViews = DEFAULT_MINI_PROGRAM_PAGES.reduce((total, page) => total + page.pv, 0)

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
      <Card title="小程序页面访问明细" style={{ marginTop: 16 }} extra={<Typography.Text type="secondary">页面名称与路径为演示配置</Typography.Text>}>
        <Table rowKey="id" dataSource={DEFAULT_MINI_PROGRAM_PAGES} scroll={{ x: 850 }} pagination={{ pageSize: 10, hideOnSinglePage: true }}
          columns={[
            { title: '页面名称', dataIndex: 'title', width: 250 },
            { title: '页面路径', dataIndex: 'path', width: 300, render: (value: string) => <Typography.Text code copyable={{ text: value }}>{value}</Typography.Text> },
            { title: '页面类型', dataIndex: 'kind', width: 120, render: (value: string) => <Tag color={value === 'temporary' ? 'blue' : 'default'}>{value === 'temporary' ? '临时页面' : '系统页面'}</Tag> },
            { title: '访问量 PV', dataIndex: 'pv', width: 130, sorter: (left, right) => left.pv - right.pv, render: (value: number) => value.toLocaleString('zh-CN') },
            { title: '访客数 UV', dataIndex: 'uv', width: 130, sorter: (left, right) => left.uv - right.uv, render: (value: number) => value.toLocaleString('zh-CN') },
            { title: 'PV 占比', key: 'share', width: 120, render: (_: unknown, page) => `${(page.pv / totalPageViews * 100).toFixed(1)}%` },
          ]} />
      </Card>
    </div>
  )
}
