import { Card, Table, Tag, Button, Space, Modal, Form, Select, Radio, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

interface Dist { id: number; course: string; audience: string; unlockLevel: string; channel: string; status: string; reach: number }

const data: Dist[] = [
  { id: 1, course: '入驻准备指南', audience: '未入驻卖家', unlockLevel: 'LV1+', channel: '服务号+站内信', status: '进行中', reach: 3200 },
  { id: 2, course: '广告投放与流量运营', audience: '已入驻·LV2以上', unlockLevel: 'LV3+', channel: '订阅消息', status: '进行中', reach: 980 },
  { id: 3, course: 'WFS物流全解析', audience: '未采用WFS人群', unlockLevel: 'LV2+', channel: '服务号', status: '已结束', reach: 1800 },
]

export default function GrowthDistribute() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '课程/专辑', dataIndex: 'course', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '目标人群', dataIndex: 'audience' },
    { title: '解锁等级', dataIndex: 'unlockLevel', render: (v: string) => <Tag color="purple">{v}</Tag> },
    { title: '触达渠道', dataIndex: 'channel' },
    { title: '覆盖人数', dataIndex: 'reach' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === '进行中' ? 'green' : 'default'}>{s}</Tag> },
    { title: '操作', render: () => <Space><a>数据</a><a>编辑</a></Space> },
  ]

  return (
    <div>
      <Card title="课程分发计划" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建分发</Button>}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      </Card>

      <Modal title="新建课程分发" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('分发计划已创建（mock）'); setOpen(false) }} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item label="选择课程/专辑" name="course" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择要分发的课程" options={['入驻准备指南', '店铺设置与品牌打造', '首批商品上架攻略', '广告投放与流量运营', 'WFS物流全解析'].map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item label="目标人群" name="audience"><Select placeholder="引用人群圈选包" options={[{ value: 'unregistered', label: '未入驻卖家' }, { value: 'no_wfs', label: '未采用WFS人群' }, { value: 'lv2', label: '已入驻·LV2以上' }]} /></Form.Item>
          <Form.Item label="解锁等级要求" name="unlockLevel"><Radio.Group options={['LV1+', 'LV2+', 'LV3+']} /></Form.Item>
          <Form.Item label="触达渠道" name="channel"><Select mode="multiple" options={['服务号模板消息', '站内信', '小程序订阅消息'].map((c) => ({ value: c, label: c }))} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
