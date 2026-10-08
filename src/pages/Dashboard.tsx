import { useState } from 'react'
import { Row, Col, Card, Statistic, List, Badge, Button, Segmented, Space, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import EChart from '../components/EChart'
import { lastNDates } from '../mock/util'
import './Dashboard.css'

const stats = [
  { title: '总卖家数', value: 12456, change: 3.2, up: true, to: '/growth/sellers' },
  { title: '今日新增', value: 28, change: 12, up: true, to: '/growth/sellers' },
  { title: '周活跃率', value: 34.5, suffix: '%', change: 2.1, up: false, to: '/data/behavior' },
  { title: '入驻转化率', value: 18.2, suffix: '%', change: 5.4, up: true, to: '/register/trace' },
]

const statColors = ['#0071CE', '#25864A', '#B86E00', '#0071CE']

export default function Dashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<number>(7)
  const [refreshKey, setRefreshKey] = useState(0)
  const dates = lastNDates(period)
  const pv = dates.map((_, index) => 1000 + ((refreshKey * 137 + index * 173) % 800))
  const uv = dates.map((_, index) => 400 + ((refreshKey * 83 + index * 97) % 300))

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['PV', 'UV'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: [{ type: 'value', name: 'PV' }, { type: 'value', name: 'UV' }],
    series: [
      { name: 'PV', type: 'line', smooth: true, data: pv, itemStyle: { color: '#1A56DB' }, areaStyle: { opacity: 0.1 } },
      { name: 'UV', type: 'line', smooth: true, yAxisIndex: 1, data: uv, itemStyle: { color: '#10B981' } },
    ],
  }

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      data: [
        { value: 5230, name: '未入驻', itemStyle: { color: '#9CA3AF' } },
        { value: 1860, name: '审核中', itemStyle: { color: '#F59E0B' } },
        { value: 5366, name: '已上线', itemStyle: { color: '#10B981' } },
      ],
    }],
  }

  const todos = [
    { color: 'red', text: '12个卖家报名待审核', to: '/activity/signup' },
    { color: 'gold', text: '28个卖家超7天未学习', to: '/register/remind' },
    { color: 'green', text: '5个新入驻卖家待绑定PID', to: '/growth/sellers' },
  ]

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <Typography.Title level={2}>运营概览</Typography.Title>
          <Typography.Text type="secondary">实时掌握商家入驻、活跃与内容运营情况</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => setRefreshKey((key) => key + 1)}>刷新数据</Button>
      </div>
      <Row gutter={[16, 16]} className="dashboard-stat-grid">
        {stats.map((s, index) => (
          <Col xs={24} sm={12} xl={6} key={s.title}>
            <Card className="dashboard-stat-card" hoverable onClick={() => navigate(s.to)} styles={{ body: { padding: 20 } }}>
              <div className="dashboard-stat-label">{s.title}</div>
              <Statistic
                value={s.value}
                suffix={s.suffix}
                valueStyle={{ color: statColors[index], fontWeight: 750 }}
              />
              <div className={`dashboard-stat-change ${s.up ? 'is-up' : 'is-down'}`}>
                {s.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {s.change}% 较上期
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="dashboard-chart-grid">
        <Col xs={24} xl={16}>
          <Card
            className="dashboard-panel-card"
            title={<span className="dashboard-card-title">PV / UV 趋势</span>}
            extra={<Segmented options={[{ label: '7天', value: 7 }, { label: '30天', value: 30 }]} value={period} onChange={(v) => setPeriod(v as number)} />}
          >
            <EChart option={trendOption} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="dashboard-panel-card" title={<span className="dashboard-card-title">卖家状态分布</span>}>
            <EChart option={pieOption} />
          </Card>
        </Col>
      </Row>

      <Card className="dashboard-panel-card dashboard-todo-card" title={<span className="dashboard-card-title">待办事项</span>}>
        <List
          dataSource={todos}
          renderItem={(item) => (
            <List.Item actions={[<Button key={item.to} type="link" onClick={() => navigate(item.to)}>去处理</Button>]}> 
              <Space><Badge color={item.color} />{item.text}</Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
