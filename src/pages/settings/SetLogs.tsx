import { Table, Tag, Input, Select, DatePicker, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { pick, randInt } from '../../mock/util'

interface Log { id: number; user: string; role: string; action: string; module: string; ip: string; time: string }
const ACTIONS = ['登录', '新增', '编辑', '删除', '导出', '查看明文(五要素)', '发布', '审核通过']
const data: Log[] = Array.from({ length: 50 }).map((_, i) => ({
  id: i + 1,
  user: pick(['admin', '张运营', '李管理', '王经理']),
  role: pick(['超级管理员', '管理员', '运营', '招商经理']),
  action: pick(ACTIONS),
  module: pick(['入驻管理', '成长中心', '内容管理', '活动管理', '系统设置']),
  ip: `192.168.${randInt(0, 255)}.${randInt(1, 254)}`,
  time: `2026-07-${String(randInt(1, 20)).padStart(2, '0')} ${randInt(9, 18)}:${String(randInt(0, 59)).padStart(2, '0')}`,
}))

export default function SetLogs() {
  const columns = [
    { title: '操作人', dataIndex: 'user' },
    { title: '角色', dataIndex: 'role', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '操作', dataIndex: 'action', render: (v: string) => <Tag color={v.includes('删除') ? 'red' : v.includes('明文') ? 'orange' : 'default'}>{v}</Tag> },
    { title: '模块', dataIndex: 'module' },
    { title: 'IP地址', dataIndex: 'ip' },
    { title: '时间', dataIndex: 'time', sorter: (a: Log, b: Log) => a.time.localeCompare(b.time) },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="操作人" style={{ width: 130 }} allowClear options={['admin', '张运营', '李管理', '王经理'].map((u) => ({ value: u, label: u }))} />
        <Select placeholder="操作类型" style={{ width: 150 }} allowClear options={ACTIONS.map((a) => ({ value: a, label: a }))} />
        <Select placeholder="模块" style={{ width: 130 }} allowClear options={['入驻管理', '成长中心', '内容管理', '活动管理', '系统设置'].map((m) => ({ value: m, label: m }))} />
        <DatePicker.RangePicker />
        <Input placeholder="搜索" prefix={<SearchOutlined />} style={{ width: 180 }} />
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 20 }} />
    </div>
  )
}
