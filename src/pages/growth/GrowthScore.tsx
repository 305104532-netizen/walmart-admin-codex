import { Card, Table, InputNumber, Slider, Button, Space, Row, Col, Divider, message } from 'antd'
import { useState } from 'react'

interface Dim { key: string; name: string; weight: number; items: string[] }
const DIMS: Dim[] = [
  { key: 'active', name: '用户活跃度', weight: 30, items: ['近7天打开次数', '平均每日访问时长', '页面访问深度'] },
  { key: 'business', name: '业务参与度', weight: 30, items: ['是否完成入驻', '直播参与次数', '线下活动报名', '问卷参与'] },
  { key: 'content', name: '内容互动', weight: 20, items: ['是否绑定PID', '是否阅读招商材料', '浏览文章数', '佣金工具使用'] },
  { key: 'growth', name: '学习成长', weight: 20, items: ['是否完成新卖家课程', '专辑学习数量'] },
]
const LEVELS = [
  { lv: 'LV1 新手卖家', min: 0, max: 200 },
  { lv: 'LV2 进阶卖家', min: 200, max: 550 },
  { lv: 'LV3 金牌卖家', min: 550, max: 1000 },
]

export default function GrowthScore() {
  const [dims, setDims] = useState(DIMS)
  const total = dims.reduce((s, d) => s + d.weight, 0)

  const setW = (key: string, w: number) => setDims((ds) => ds.map((d) => (d.key === key ? { ...d, weight: w } : d)))

  return (
    <div>
      <Card title="评分维度权重配置（总权重需为100%）" extra={<span style={{ color: total === 100 ? '#10B981' : '#EF4444' }}>当前合计 {total}%</span>}>
        {dims.map((d) => (
          <div key={d.key} style={{ marginBottom: 20 }}>
            <Row align="middle" gutter={16}>
              <Col span={4}><b>{d.name}</b></Col>
              <Col span={12}><Slider value={d.weight} onChange={(v) => setW(d.key, v)} max={100} /></Col>
              <Col span={4}><InputNumber value={d.weight} min={0} max={100} onChange={(v) => setW(d.key, v || 0)} addonAfter="%" /></Col>
            </Row>
            <div style={{ color: '#6B7280', fontSize: 12, marginLeft: '16.6%' }}>打分子项：{d.items.join(' / ')}</div>
          </div>
        ))}
        <Button type="primary" onClick={() => message.success('评分规则已保存（mock）')}>保存配置</Button>
      </Card>

      <Card title="等级阈值配置" style={{ marginTop: 16 }}>
        <Table
          rowKey="lv"
          pagination={false}
          dataSource={LEVELS}
          columns={[
            { title: '等级', dataIndex: 'lv' },
            { title: '成长值下限', dataIndex: 'min' },
            { title: '成长值上限', dataIndex: 'max' },
            { title: '解锁权益', render: (_, __, i) => ['专属客户经理、孵化课程', '+优先活动名额', '+广告金激励、高阶课程'][i] },
          ]}
        />
      </Card>
    </div>
  )
}
