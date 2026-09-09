import { Card, Table, Tag, Button, Space, Statistic, Row, Col, Progress, QRCode } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { NAMES, COMPANIES, pick, randInt } from '../../mock/util'

interface CheckinRow { id: number; name: string; company: string; checkedIn: boolean; checkinTime: string; registered: boolean }
const data: CheckinRow[] = Array.from({ length: 25 }).map((_, i) => {
  const ci = Math.random() > 0.3
  return { id: i + 1, name: pick(NAMES), company: pick(COMPANIES) + '有限公司', checkedIn: ci, checkinTime: ci ? `14:${String(randInt(0, 59)).padStart(2, '0')}` : '-', registered: ci && Math.random() > 0.5 }
})

export default function ActivityCheckin() {
  const { id } = useParams()
  const total = data.length
  const checked = data.filter((d) => d.checkedIn).length
  const converted = data.filter((d) => d.registered).length

  const columns = [
    { title: '姓名', dataIndex: 'name' },
    { title: '公司', dataIndex: 'company', ellipsis: true },
    { title: '签到状态', dataIndex: 'checkedIn', render: (v: boolean) => (v ? <Tag color="green">已签到</Tag> : <Tag>未签到</Tag>) },
    { title: '签到时间', dataIndex: 'checkinTime' },
    { title: '签到后入驻', dataIndex: 'registered', render: (v: boolean) => (v ? <Tag color="blue">已入驻</Tag> : '-') },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card><Statistic title="应到" value={total} /></Card></Col>
        <Col span={5}><Card><Statistic title="已签到" value={checked} valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={5}><Card><Statistic title="签到率" value={Math.round((checked / total) * 100)} suffix="%" /></Card></Col>
        <Col span={5}><Card><Statistic title="签到后入驻" value={converted} valueStyle={{ color: '#1A56DB' }} /></Card></Col>
        <Col span={4}>
          <Card styles={{ body: { textAlign: 'center', padding: 12 } }}>
            <QRCode value={`https://walmart-mp/checkin?act=${id || 'demo'}`} size={80} />
            <div style={{ fontSize: 12, color: '#6B7280' }}>签到码</div>
          </Card>
        </Col>
      </Row>

      <Card title="签到后一站式转化" style={{ marginBottom: 16 }} size="small">
        <Space size={40}>
          <span>签到 → 立即入驻转化率：<b style={{ color: '#1A56DB' }}>{Math.round((converted / (checked || 1)) * 100)}%</b></span>
          <Progress percent={Math.round((converted / (checked || 1)) * 100)} style={{ width: 240 }} />
          <span style={{ color: '#6B7280' }}>签到成功后活动页展示"立即入驻"，线索归属本场活动</span>
        </Space>
      </Card>

      <Card title="签到明细" extra={<Button icon={<ExportOutlined />}>导出签到数据</Button>}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 15 }} />
      </Card>
    </div>
  )
}
