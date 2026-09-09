import { Table, Tag, Button, Space, Input, Select, Modal, Form, message, Upload } from 'antd'
import { useState } from 'react'
import { PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { pick, randInt } from '../../mock/util'

interface Video { id: number; title: string; cat: string; duration: string; status: string; plays: number; date: string }
const data: Video[] = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  title: pick(['手把手教你优化Listing', '广告投放实战', 'WFS操作演示', '店铺冷启动策略', '选品方法论']) + ` 第${i + 1}讲`,
  cat: pick(['新手入门', '进阶运营', '广告投放', '物流仓配']),
  duration: `${randInt(5, 45)}:${String(randInt(0, 59)).padStart(2, '0')}`,
  status: pick(['published', 'published', 'draft']), plays: randInt(200, 20000),
  date: `2026-07-${String(randInt(1, 28)).padStart(2, '0')}`,
}))

export default function ContentVideos() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: '课程标题', dataIndex: 'title', ellipsis: true },
    { title: '分类', dataIndex: 'cat', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '时长', dataIndex: 'duration' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'published' ? 'green' : 'default'}>{s === 'published' ? '已发布' : '草稿'}</Tag> },
    { title: '播放量', dataIndex: 'plays', sorter: (a: Video, b: Video) => a.plays - b.plays },
    { title: '发布日期', dataIndex: 'date' },
    { title: '操作', render: () => <Space><a>编辑</a><a>预览</a><a style={{ color: '#EF4444' }}>下架</a></Space> },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="分类" style={{ width: 140 }} allowClear options={['新手入门', '进阶运营', '广告投放', '物流仓配'].map((c) => ({ value: c, label: c }))} />
        <Select placeholder="状态" style={{ width: 120 }} allowClear options={[{ value: 'published', label: '已发布' }, { value: 'draft', label: '草稿' }]} />
        <Input placeholder="搜索课程" prefix={<SearchOutlined />} style={{ width: 220 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>上传视频课程</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 12 }} />

      <Modal title="上传视频课程" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已保存（mock）'); setOpen(false) }} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item label="课程标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="分类" name="cat"><Select options={['新手入门', '进阶运营', '广告投放', '物流仓配'].map((c) => ({ value: c, label: c }))} /></Form.Item>
          <Form.Item label="视频文件" name="video"><Upload.Dragger beforeUpload={() => false}><p className="ant-upload-drag-icon"><UploadOutlined /></p><p>点击或拖拽视频文件上传</p></Upload.Dragger></Form.Item>
          <Form.Item label="课程简介" name="desc"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
