import { useState } from 'react'
import { Row, Col, Card, Statistic, List, Badge, Button, Segmented, Space } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import EChart from '../components/EChart'
import { lastNDates } from '../mock/util'

const stats = [
  { title: '总卖家数', value: 12456, change: 3.2, up: true, to: '/register/list' },
  { title: '今日新增', value: 28, change: 12, up: true, to: '/register/list' },
  { title: '周活跃率', value: 34.5, suffix: '%', change: 2.1, up: false, to: '/data/behavior' },
  { title: '入驻转化率', value: 18.2, suffix: '%', change: 5.4, up: true, to: '/register/trace' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<number>(7)
  const dates = lastNDates(period)
  const pv = dates.map(() => 1000 + Math.floor(Math.random() * 800))
  const uv = dates.map(() => 400 + Math.floor(Math.random() * 300))

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
    { color: 'green', text: '5个新入驻卖家待绑定PID', to: '/register/list' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => setPeriod((p) => p)}>刷新</Button>
      </div>
      <Row gutter={16}>
        {stats.map((s) => (
          <Col span={6} key={s.title}>
            <Card hoverable onClick={() => navigate(s.to)} styles={{ body: { padding: 20 } }}>
              <Statistic
                title={s.title}
                value={s.value}
                suffix={s.suffix}
                valueStyle={{ color: '#111827', fontWeight: 700 }}
              />
              <div style={{ marginTop: 8, color: s.up ? '#10B981' : '#EF4444', fontSize: 13 }}>
                {s.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {s.change}% 较上期
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card
            title="PV / UV 趋势"
            extra={<Segmented options={[{ label: '7天', value: 7 }, { label: '30天', value: 30 }]} value={period} onChange={(v) => setPeriod(v as number)} />}
          >
            <EChart option={trendOption} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="卖家状态分布">
            <EChart option={pieOption} />
          </Card>
        </Col>
      </Row>

      <Card title="待办事项" style={{ marginTop: 16 }}>
        <List
          dataSource={todos}
          renderItem={(item) => (
            <List.Item actions={[<Button type="link" onClick={() => navigate(item.to)}>去处理 →</Button>]}>
              <Space><Badge color={item.color} />{item.text}</Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
