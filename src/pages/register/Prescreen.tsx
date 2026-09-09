import { Table, Tag, Input, Select, Button, Space, Statistic, Row, Col, Card, Drawer, Descriptions, message, Modal } from 'antd'
import { useState } from 'react'
import { SearchOutlined, SafetyOutlined } from '@ant-design/icons'
import { NAMES, COMPANIES, pick, randInt } from '../../mock/util'

const AUDIT = { pending: { t: '待审', c: 'gold' }, pass: { t: '通过', c: 'green' }, reject: { t: '驳回', c: 'red' } }
type AuditKey = keyof typeof AUDIT

interface Row5FA {
  id: number; company: string; repName: string; phone: string; taxId: string; idNo: string
  status: AuditKey; verify: 'match' | 'mismatch' | 'none'; submitTime: string
}

function maskName(n: string) { return n[0] + '**' }
function maskPhone() { return `13${randInt(0, 9)}****${randInt(1000, 9999)}` }
function maskId(prefix: string) { return `${prefix}****${randInt(10, 99)}` }

const data: Row5FA[] = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1,
  company: pick(COMPANIES) + '有限公司',
  repName: maskName(pick(NAMES)),
  phone: maskPhone(),
  taxId: maskId('91'),
  idNo: maskId('44'),
  status: pick(['pending', 'pass', 'pass', 'reject']) as AuditKey,
  verify: pick(['match', 'match', 'mismatch', 'none']) as Row5FA['verify'],
  submitTime: `2026-07-${String(randInt(1, 28)).padStart(2, '0')} ${randInt(9, 18)}:00`,
}))

const VERIFY = { match: <Tag color="green">一致</Tag>, mismatch: <Tag color="red">不一致</Tag>, none: <Tag>未核验</Tag> }

export default function Prescreen() {
  const [detail, setDetail] = useState<Row5FA | null>(null)

  const reveal = (r: Row5FA) => {
    Modal.confirm({
      title: '二次鉴权',
      icon: <SafetyOutlined />,
      content: '查看五要素明文需管理员二次鉴权，操作将被记录到操作日志。确认继续？',
      onOk: () => { message.success('已通过鉴权，明文将显示30秒后自动隐藏（mock）'); setDetail(r) },
    })
  }

  const columns = [
    { title: '公司名称', dataIndex: 'company', ellipsis: true },
    { title: '法人姓名', dataIndex: 'repName' },
    { title: '手机(脱敏)', dataIndex: 'phone' },
    { title: '税号(脱敏)', dataIndex: 'taxId' },
    { title: '身份证(脱敏)', dataIndex: 'idNo' },
    { title: '三方核验', dataIndex: 'verify', render: (v: Row5FA['verify']) => VERIFY[v] },
    { title: '预审状态', dataIndex: 'status', render: (s: AuditKey) => <Tag color={AUDIT[s].c}>{AUDIT[s].t}</Tag> },
    { title: '提交时间', dataIndex: 'submitTime' },
    {
      title: '操作', render: (_: unknown, r: Row5FA) => (
        <Space>
          <a onClick={() => reveal(r)}>核对</a>
          {r.status === 'pending' && <><a style={{ color: '#10B981' }} onClick={() => message.success('已通过预审')}>通过</a><a style={{ color: '#EF4444' }} onClick={() => message.info('驳回（填写原因）')}>驳回</a></>}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="待预审" value={32} valueStyle={{ color: '#F59E0B' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="通过" value={186} valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="驳回" value={12} valueStyle={{ color: '#EF4444' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="通过率" value={85} suffix="%" /></Card></Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="预审状态" style={{ width: 140 }} allowClear options={Object.entries(AUDIT).map(([k, v]) => ({ value: k, label: v.t }))} />
        <Input placeholder="公司名/法人搜索" prefix={<SearchOutlined />} style={{ width: 240 }} />
      </Space>

      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 15 }} scroll={{ x: 1000 }} />

      <Drawer title="五要素核对（明文·30秒后隐藏）" width={460} open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="法定代表人姓名">张明（明文示例）</Descriptions.Item>
              <Descriptions.Item label="法定代表人手机号">138xxxx0000</Descriptions.Item>
              <Descriptions.Item label="法定公司名称">{detail.company}</Descriptions.Item>
              <Descriptions.Item label="公司税号">91xxxxxxxxxxxxxx56</Descriptions.Item>
              <Descriptions.Item label="法人身份证号">44xxxxxxxxxxxxxx3X</Descriptions.Item>
              <Descriptions.Item label="三方核验结果">{VERIFY[detail.verify]}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={() => { message.success('预审通过'); setDetail(null) }}>通过预审</Button>
              <Button danger onClick={() => { message.info('已驳回'); setDetail(null) }}>驳回</Button>
            </Space>
            <p style={{ marginTop: 12, color: '#9CA3AF', fontSize: 12 }}>五要素加密存储，禁止导出明文，符合个人信息保护要求。</p>
          </>
        )}
      </Drawer>
    </div>
  )
}
