import { Table, Tag, Button, Space, Input, Select, Modal, Form, message, Image } from 'antd'
import { useState } from 'react'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { pick, randInt } from '../../mock/util'
import ImageUpload from '../../components/ImageUpload'

const CATS = ['流量秘籍', '平台工具', '物流指南', '政策条款', '运营干货']
const SUBS = ['快速入门', '报告分析', 'WFS', '政策条款', '最新资讯', '成功卖家']

interface Article { id: number; title: string; cat: string; sub: string; status: string; views: number; date: string; cover?: string; content?: string }
type ArticleForm = Pick<Article, 'title' | 'cat' | 'sub' | 'cover' | 'content'>
const data: Article[] = Array.from({ length: 40 }).map((_, i) => ({
  id: i + 1,
  title: pick(['沃尔玛入驻完整流程指南', 'Listing优化技巧', 'WFS入仓注意事项', 'Q3佣金政策解读', '选品趋势报告', '广告投放ROI优化']) + ` (${i + 1})`,
  cat: pick(CATS), sub: pick(SUBS),
  status: pick(['published', 'published', 'draft']), views: randInt(100, 30000),
  date: `2026-07-${String(randInt(1, 28)).padStart(2, '0')}`,
}))

export default function ContentArticles() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(data)
  const [editing, setEditing] = useState<Article | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm<ArticleForm>()

  const openEditor = (article?: Article) => {
    setEditing(article ?? null)
    setUploading(false)
    form.resetFields()
    if (article) form.setFieldsValue(article)
    setOpen(true)
  }

  const save = async () => {
    if (uploading) return
    let values: ArticleForm
    try { values = await form.validateFields() } catch { return }
    setRows(current => {
      if (editing) return current.map(article => article.id === editing.id ? { ...article, ...values } : article)
      return [{
        ...values,
        id: Math.max(0, ...current.map(article => article.id)) + 1,
        cat: values.cat ?? '', sub: values.sub ?? '',
        status: 'draft', views: 0, date: new Date().toISOString().slice(0, 10),
      }, ...current]
    })
    message.success('文章已保存')
    setOpen(false)
  }

  const columns = [
    { title: '封面', dataIndex: 'cover', width: 100, render: (cover?: string) => cover ? <Image src={cover} width={72} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} alt="文章封面" /> : '—' },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '一级分类', dataIndex: 'cat', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '二级分类', dataIndex: 'sub', render: (v: string) => <Tag>{v}</Tag> },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'published' ? 'green' : 'default'}>{s === 'published' ? '已发布' : '草稿'}</Tag> },
    { title: '阅读量', dataIndex: 'views', sorter: (a: Article, b: Article) => a.views - b.views },
    { title: '发布日期', dataIndex: 'date' },
    { title: '操作', render: (_: unknown, article: Article) => <Space><a onClick={() => openEditor(article)}>编辑</a><a>预览</a><a style={{ color: '#EF4444' }}>下架</a></Space> },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="一级分类" style={{ width: 140 }} allowClear options={CATS.map((c) => ({ value: c, label: c }))} />
        <Select placeholder="二级分类" style={{ width: 140 }} allowClear options={SUBS.map((c) => ({ value: c, label: c }))} />
        <Select placeholder="状态" style={{ width: 120 }} allowClear options={[{ value: 'published', label: '已发布' }, { value: 'draft', label: '草稿' }]} />
        <Input placeholder="搜索标题" prefix={<SearchOutlined />} style={{ width: 220 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>新建文章</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={rows} rowSelection={{}} pagination={{ pageSize: 15 }} />

      <Modal title={editing ? '编辑文章' : '新建文章'} open={open} onCancel={() => setOpen(false)} onOk={save} okButtonProps={{ disabled: uploading }} destroyOnHidden width={640}>
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Space>
            <Form.Item label="一级分类" name="cat"><Select style={{ width: 200 }} options={CATS.map((c) => ({ value: c, label: c }))} /></Form.Item>
            <Form.Item label="二级分类" name="sub"><Select style={{ width: 200 }} options={SUBS.map((c) => ({ value: c, label: c }))} /></Form.Item>
          </Space>
          <Form.Item label="封面图" name="cover"><ImageUpload label="文章封面" onBusyChange={setUploading} /></Form.Item>
          <Form.Item label="正文" name="content"><Input.TextArea rows={6} placeholder="富文本编辑器（mock）" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
