import { Card, Table, Tag, Button, Space, Select, Input, Statistic, Row, Col, message } from 'antd'
import { SearchOutlined, ExportOutlined, CheckOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { NAMES, COMPANIES, pick, randInt } from '../../mock/util'

interface Signup { id: number; name: string; company: string; phone: string; audit: string; source: string; time: string }
const data: Signup[] = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1, name: pick(NAMES), company: pick(COMPANIES) + '有限公司',
  phone: `138****${randInt(1000, 9999)}`, audit: pick(['pending', 'pass', 'pass', 'reject']),
  source: pick(['经理转发', '活动海报', '社群', '自然流量']), time: `2026-07-${randInt(10, 20)} ${randInt(9, 18)}:00`,
}))
const AUDIT = { pending: { t: '待审核', c: 'gold' }, pass: { t: '已通过', c: 'green' }, reject: { t: '已拒绝', c: 'red' } }
type AK = keyof typeof AUDIT

export default function ActivitySignup() {
  const { id } = useParams()

  const columns = [
    { title: '姓名', dataIndex: 'name' },
    { title: '公司', dataIndex: 'company', ellipsis: true },
    { title: '手机', dataIndex: 'phone' },
    { title: '来源', dataIndex: 'source', render: (v: string) => <Tag>{v}</Tag> },
    { title: '报名时间', dataIndex: 'time' },
    { title: '审核状态', dataIndex: 'audit', render: (s: AK) => <Tag color={AUDIT[s].c}>{AUDIT[s].t}</Tag> },
    { title: '操作', render: (_: unknown, r: Signup) => r.audit === 'pending' ? <Space><a style={{ color: '#10B981' }} onClick={() => message.success('已通过')}>通过</a><a style={{ color: '#EF4444' }} onClick={() => message.info('已拒绝')}>拒绝</a></Space> : <a>详情</a> },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="总报名" value={data.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="待审核" value={data.filter((d) => d.audit === 'pending').length} valueStyle={{ color: '#F59E0B' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已通过" value={data.filter((d) => d.audit === 'pass').length} valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="活动ID" value={id || '—'} /></Card></Col>
      </Row>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="审核状态" style={{ width: 130 }} allowClear options={Object.entries(AUDIT).map(([k, v]) => ({ value: k, label: v.t }))} />
        <Input placeholder="搜索姓名/公司" prefix={<SearchOutlined />} style={{ width: 200 }} />
        <Button icon={<CheckOutlined />} onClick={() => message.success('已批量通过')}>批量通过</Button>
        <Button icon={<ExportOutlined />}>导出</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} rowSelection={{}} pagination={{ pageSize: 15 }} />
    </div>
  )
}
