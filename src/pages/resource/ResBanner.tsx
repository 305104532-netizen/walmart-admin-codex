import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, Switch, message, Image } from 'antd'
import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { PlusOutlined } from '@ant-design/icons'
import ImageUpload from '../../components/ImageUpload'

interface Banner { id: number; title: string; position: string; img?: string; link: string; order: number; enabled: boolean; period: string; periodDates?: [Dayjs, Dayjs] }
interface BannerForm { title: string; position?: string; img?: string; link?: string; order?: number; period?: [Dayjs, Dayjs] | null }
const data: Banner[] = [
  { id: 1, title: '2026峰会招募', position: '首页轮播', link: '/activity/detail/1', order: 1, enabled: true, period: '07-01 ~ 07-31' },
  { id: 2, title: '新卖家福利', position: '首页轮播', link: '/register', order: 2, enabled: true, period: '长期' },
  { id: 3, title: 'WFS专题', position: '卖家大学顶部', link: '/learn', order: 1, enabled: false, period: '07-10 ~ 08-10' },
]

export default function ResBanner() {
  const [rows, setRows] = useState<Banner[]>(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [form] = Form.useForm<BannerForm>()

  const openEditor = (record?: Banner) => {
    form.resetFields()
    setImageBusy(false)
    setEditing(record ?? null)
    if (record) form.setFieldsValue({ ...record, period: record.periodDates })
    setOpen(true)
  }

  const closeEditor = () => {
    setOpen(false)
    setImageBusy(false)
    form.resetFields()
    setEditing(null)
  }

  const save = async () => {
    if (imageBusy) return
    let values: BannerForm
    try { values = await form.validateFields() } catch { return }
    const periodDates = values.period ?? undefined
    const period = periodDates
      ? `${periodDates[0].format('MM-DD')} ~ ${periodDates[1].format('MM-DD')}`
      : editing && values.period !== null ? editing.period : '长期'
    const record: Banner = {
      id: editing?.id ?? Date.now(),
      title: values.title,
      position: values.position ?? '',
      img: values.img,
      link: values.link ?? '',
      order: values.order ?? 1,
      enabled: editing?.enabled ?? true,
      period,
      periodDates,
    }
    setRows((current) => editing ? current.map((row) => row.id === editing.id ? record : row) : [...current, record])
    message.success('已保存')
    closeEditor()
  }

  const columns = [
    { title: '预览', dataIndex: 'img', render: (img: string | undefined, record: Banner) => img ? <Image width={80} height={40} src={img} alt={record.title} style={{ borderRadius: 4, objectFit: 'cover' }} /> : <span style={{ color: '#999' }}>未上传</span> },
    { title: '标题', dataIndex: 'title' },
    { title: '位置', dataIndex: 'position', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '跳转链接', dataIndex: 'link', render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: '排序', dataIndex: 'order' },
    { title: '投放周期', dataIndex: 'period' },
    { title: '状态', dataIndex: 'enabled', render: (v: boolean) => <Switch defaultChecked={v} /> },
    { title: '操作', render: (_: unknown, record: Banner) => <Space><a onClick={() => openEditor(record)}>编辑</a><a style={{ color: '#EF4444' }}>删除</a></Space> },
  ]

  return (
    <div>
      <Card title="Banner 管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>新增Banner</Button>}>
        <Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />
      </Card>
      <Modal title={editing ? '编辑 Banner' : '新增 Banner'} open={open} onCancel={closeEditor} onOk={save} okButtonProps={{ disabled: imageBusy }} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="投放位置" name="position"><Select options={['首页轮播', '卖家大学顶部', '活动中心顶部'].map((p) => ({ value: p, label: p }))} /></Form.Item>
          <Form.Item label="Banner 图片" name="img"><ImageUpload label="Banner 图片" onBusyChange={setImageBusy} /></Form.Item>
          <Form.Item label="跳转链接" name="link"><Input placeholder="/activity/detail/1" /></Form.Item>
          <Space>
            <Form.Item label="排序" name="order"><InputNumber min={1} /></Form.Item>
            <Form.Item label="投放周期" name="period"><DatePicker.RangePicker /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
