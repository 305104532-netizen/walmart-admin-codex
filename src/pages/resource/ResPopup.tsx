import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, Radio, message, Image } from 'antd'
import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { PlusOutlined } from '@ant-design/icons'
import ImageUpload from '../../components/ImageUpload'

interface Popup { id: number; title: string; trigger: string; audience: string; freq: string; enabled: boolean; period: string; img?: string; link?: string; periodDates?: [Dayjs, Dayjs] }
interface PopupForm { title: string; trigger?: string; audience?: string; freq?: string; img?: string; link?: string; period?: [Dayjs, Dayjs] | null }
const data: Popup[] = [
  { id: 1, title: '新人入驻引导弹窗', trigger: '首次进入小程序', audience: '未入驻卖家', freq: '仅一次', enabled: true, period: '长期' },
  { id: 2, title: '峰会报名弹窗', trigger: '进入首页', audience: '全部卖家', freq: '每日一次', enabled: true, period: '07-01 ~ 07-20' },
  { id: 3, title: '问卷邀请弹窗', trigger: '活动结束后', audience: '参会卖家', freq: '仅一次', enabled: false, period: '活动结束后3天' },
]

export default function ResPopup() {
  const [rows, setRows] = useState<Popup[]>(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Popup | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [form] = Form.useForm<PopupForm>()

  const openEditor = (record?: Popup) => {
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
    let values: PopupForm
    try { values = await form.validateFields() } catch { return }
    const periodDates = values.period ?? undefined
    const period = periodDates
      ? `${periodDates[0].format('MM-DD')} ~ ${periodDates[1].format('MM-DD')}`
      : editing && values.period !== null ? editing.period : '长期'
    const record: Popup = {
      id: editing?.id ?? Date.now(),
      title: values.title,
      trigger: values.trigger ?? '',
      audience: values.audience ?? '',
      freq: values.freq ?? '',
      img: values.img,
      link: values.link,
      enabled: editing?.enabled ?? true,
      period,
      periodDates,
    }
    setRows((current) => editing ? current.map((row) => row.id === editing.id ? record : row) : [...current, record])
    message.success('已保存')
    closeEditor()
  }

  const columns = [
    { title: '预览', dataIndex: 'img', render: (img: string | undefined, record: Popup) => img ? <Image width={60} height={60} src={img} alt={record.title} style={{ borderRadius: 4, objectFit: 'cover' }} /> : <span style={{ color: '#999' }}>未上传</span> },
    { title: '弹窗标题', dataIndex: 'title' },
    { title: '触发时机', dataIndex: 'trigger', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '目标人群', dataIndex: 'audience' },
    { title: '展示频次', dataIndex: 'freq' },
    { title: '投放周期', dataIndex: 'period' },
    { title: '状态', dataIndex: 'enabled', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    { title: '操作', render: (_: unknown, record: Popup) => <Space><a onClick={() => openEditor(record)}>编辑</a><a>数据</a><a style={{ color: '#EF4444' }}>删除</a></Space> },
  ]

  return (
    <div>
      <Card title="弹窗管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>新增弹窗</Button>}>
        <Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />
      </Card>
      <Modal title={editing ? '编辑弹窗' : '新增弹窗'} open={open} onCancel={closeEditor} onOk={save} okButtonProps={{ disabled: imageBusy }} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item label="弹窗标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="弹窗图片" name="img"><ImageUpload label="弹窗图片" onBusyChange={setImageBusy} /></Form.Item>
          <Form.Item label="触发时机" name="trigger"><Select options={['首次进入小程序', '进入首页', '活动结束后', '完成入驻后'].map((t) => ({ value: t, label: t }))} /></Form.Item>
          <Form.Item label="目标人群" name="audience"><Select options={['全部卖家', '未入驻卖家', '已入驻卖家', '参会卖家'].map((t) => ({ value: t, label: t }))} /></Form.Item>
          <Form.Item label="展示频次" name="freq"><Radio.Group options={['仅一次', '每日一次', '每次进入']} /></Form.Item>
          <Form.Item label="投放周期" name="period"><DatePicker.RangePicker /></Form.Item>
          <Form.Item label="跳转链接" name="link"><Input placeholder="/activity/detail/1" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
