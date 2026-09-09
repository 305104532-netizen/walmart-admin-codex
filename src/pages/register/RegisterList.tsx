import { useState } from 'react'
import { Table, Tag, Input, Select, DatePicker, Button, Space, Tabs, Drawer, Descriptions, Progress, Tooltip } from 'antd'
import { SearchOutlined, ExportOutlined } from '@ant-design/icons'
import { NAMES, COMPANIES, MANAGERS, pick, randInt } from '../../mock/util'

const STATUS = { unregistered: { t: '未入驻', c: 'default' }, pending: { t: '审核中', c: 'gold' }, online: { t: '已上线', c: 'green' } }
type StatusKey = keyof typeof STATUS
type StatusFilter = 'all' | StatusKey

interface Seller {
  id: number; seller_name: string; company_name: string; status: StatusKey
  manager_name: string; channel: string; bind_time: string; study_hours: number
  completion_rate: number; pid: string; last_active: string
  activity_id: number | null; activity_name: string | null
}

const CHANNELS = ['manager_share', 'organic', 'qrcode', 'activity']
const ACTIVITIES = [
  { id: 1, name: '2026沃尔玛卖家峰会' },
  { id: 2, name: '新手入门直播课' },
  { id: 3, name: 'Q3选品趋势分享会' },
]
const mockData: Seller[] = Array.from({ length: 60 }).map((_, i) => {
  const status: StatusKey = (['unregistered', 'pending', 'online'] as const)[i % 3]
  // 模拟活动签到后直接提交入驻申请，归属保留至审核及上线阶段；普通活动渠道不自动归属。
  const activity = status !== 'unregistered' && i % 2 === 0 ? ACTIVITIES[Math.floor(i / 3) % ACTIVITIES.length] : null
  return {
    id: i + 1,
    seller_name: pick(NAMES),
    company_name: pick(COMPANIES) + '有限公司',
    status,
    manager_name: pick(MANAGERS),
    channel: activity ? 'activity' : pick(CHANNELS),
    activity_id: activity?.id ?? null,
    activity_name: activity?.name ?? null,
    bind_time: `2026-07-${String(randInt(1, 28)).padStart(2, '0')}`,
    study_hours: status === 'online' ? randInt(2, 80) : 0,
    completion_rate: status === 'online' ? randInt(10, 100) : 0,
    pid: status === 'online' ? `100${randInt(10000, 99999)}` : '-',
    last_active: `${randInt(1, 12)}小时前`,
  }
})

export default function RegisterList() {
  const [tab, setTab] = useState<StatusFilter>('all')
  const [activityId, setActivityId] = useState<number | undefined>()
  const [detail, setDetail] = useState<Seller | null>(null)
  const activityFiltered = mockData.filter((d) => activityId === undefined || d.activity_id === activityId)
  const filtered = tab === 'all' ? activityFiltered : activityFiltered.filter((d) => d.status === tab)

  const columns = [
    { title: '卖家名称', dataIndex: 'seller_name', render: (v: string, r: Seller) => <a onClick={() => setDetail(r)}>{v}</a> },
    { title: '公司名称', dataIndex: 'company_name', ellipsis: true },
    { title: '入驻状态', dataIndex: 'status', render: (s: StatusKey) => <Tag color={STATUS[s].c}>{STATUS[s].t}</Tag> },
    { title: '所属经理', dataIndex: 'manager_name' },
    { title: '渠道来源', dataIndex: 'channel' },
    { title: <Tooltip title="记录卖家活动签到后直接提交入驻申请的来源活动">所属活动</Tooltip>, dataIndex: 'activity_name', width: 200, ellipsis: true, render: (v: string | null) => v || '—' },
    { title: '绑定日期', dataIndex: 'bind_time', sorter: (a: Seller, b: Seller) => a.bind_time.localeCompare(b.bind_time) },
    { title: '学习时长', dataIndex: 'study_hours', render: (v: number) => (v ? `${v}h` : '-') },
    { title: '完课率', dataIndex: 'completion_rate', render: (v: number) => (v ? <Progress percent={v} size="small" style={{ width: 90 }} /> : '-') },
    { title: 'PID', dataIndex: 'pid' },
    { title: '最后活跃', dataIndex: 'last_active' },
    { title: '操作', render: (_: unknown, r: Seller) => <Space><a onClick={() => setDetail(r)}>详情</a><a>提醒</a><a>派发任务</a></Space> },
  ]

  const counts = {
    all: activityFiltered.length,
    unregistered: activityFiltered.filter((d) => d.status === 'unregistered').length,
    pending: activityFiltered.filter((d) => d.status === 'pending').length,
    online: activityFiltered.filter((d) => d.status === 'online').length,
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select<StatusKey> placeholder="状态" style={{ width: 120 }} allowClear value={tab === 'all' ? undefined : tab} onChange={(value) => setTab(value ?? 'all')} options={Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.t }))} />
        <Select placeholder="经理" style={{ width: 120 }} allowClear options={MANAGERS.map((m) => ({ value: m, label: m }))} />
        <Select placeholder="渠道" style={{ width: 140 }} allowClear options={CHANNELS.map((m) => ({ value: m, label: m }))} />
        <Select<number> placeholder="所属活动" style={{ width: 220 }} allowClear showSearch optionFilterProp="label" value={activityId} onChange={setActivityId} options={ACTIVITIES.map((activity) => ({ value: activity.id, label: activity.name }))} />
        <DatePicker.RangePicker />
        <Input placeholder="搜索卖家名/公司名/邮箱/PID" prefix={<SearchOutlined />} style={{ width: 240 }} />
        <Button type="primary" icon={<ExportOutlined />}>导出Excel</Button>
      </Space>

      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as StatusFilter)}
        items={[
          { key: 'all', label: `全部(${counts.all})` },
          { key: 'unregistered', label: `未入驻(${counts.unregistered})` },
          { key: 'pending', label: `审核中(${counts.pending})` },
          { key: 'online', label: `已上线(${counts.online})` },
        ]}
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} rowSelection={{}} pagination={{ pageSize: 20, showSizeChanger: true }} scroll={{ x: 1500 }} />

      <Drawer title="卖家详情" width={480} open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="卖家名称">{detail.seller_name}</Descriptions.Item>
            <Descriptions.Item label="公司名称">{detail.company_name}</Descriptions.Item>
            <Descriptions.Item label="入驻状态"><Tag color={STATUS[detail.status].c}>{STATUS[detail.status].t}</Tag></Descriptions.Item>
            <Descriptions.Item label="所属经理">{detail.manager_name}</Descriptions.Item>
            <Descriptions.Item label="渠道来源">{detail.channel}</Descriptions.Item>
            <Descriptions.Item label="所属活动">{detail.activity_name || '—'}</Descriptions.Item>
            <Descriptions.Item label="绑定日期">{detail.bind_time}</Descriptions.Item>
            <Descriptions.Item label="学习时长">{detail.study_hours}h</Descriptions.Item>
            <Descriptions.Item label="完课率">{detail.completion_rate}%</Descriptions.Item>
            <Descriptions.Item label="PID">{detail.pid}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}
