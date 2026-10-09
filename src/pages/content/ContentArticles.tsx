import { Table, Tag, Button, Space, Input, Select, Modal, Form, message, Image, Cascader } from 'antd'
import { useState } from 'react'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { pick, randInt } from '../../mock/util'
import ImageUpload from '../../components/ImageUpload'
import { DEFAULT_CONTENT_CATEGORIES, categoryOptions, categoryPath, isCategoryOrDescendant, loadCategories } from '../../models/contentTaxonomy'

const DEFAULT_LEAF_IDS = DEFAULT_CONTENT_CATEGORIES.filter((category) => !DEFAULT_CONTENT_CATEGORIES.some((child) => child.parentId === category.id)).map((category) => category.id)

interface Article { id: number; title: string; categoryId: string; status: string; views: number; date: string; cover?: string; content?: string }
type ArticleForm = Pick<Article, 'title' | 'cover' | 'content'> & { categoryPath: string[] }
const data: Article[] = Array.from({ length: 40 }).map((_, i) => ({
  id: i + 1,
  title: pick(['沃尔玛入驻完整流程指南', 'Listing优化技巧', 'WFS入仓注意事项', 'Q3佣金政策解读', '选品趋势报告', '广告投放ROI优化']) + ` (${i + 1})`,
  categoryId: DEFAULT_LEAF_IDS[i % DEFAULT_LEAF_IDS.length],
  status: pick(['published', 'published', 'draft']), views: randInt(100, 30000),
  date: `2026-07-${String(randInt(1, 28)).padStart(2, '0')}`,
}))

export default function ContentArticles() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(data)
  const [categories] = useState(() => loadCategories('content'))
  const [categoryFilter, setCategoryFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState<Article | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm<ArticleForm>()
  const categoryChoices = categoryOptions(categories)
  const visibleRows = rows.filter((article) => (!categoryFilter || isCategoryOrDescendant(categories, article.categoryId, categoryFilter))
    && (!statusFilter || article.status === statusFilter)
    && (!keyword.trim() || article.title.toLowerCase().includes(keyword.trim().toLowerCase())))

  const openEditor = (article?: Article) => {
    setEditing(article ?? null)
    setUploading(false)
    form.resetFields()
    form.setFieldsValue(article ? { ...article, categoryPath: categoryPath(categories, article.categoryId).map((part) => part.id) }
      : { title: '', categoryPath: [], cover: '', content: '' })
    setOpen(true)
  }

  const save = async () => {
    if (uploading) return
    let values: ArticleForm
    try { values = await form.validateFields() } catch { return }
    const { categoryPath: selectedPath, ...articleValues } = values
    const categoryId = selectedPath.at(-1)
    if (!categoryId) return
    setRows(current => {
      if (editing) return current.map(article => article.id === editing.id ? { ...article, ...articleValues, categoryId } : article)
      return [{
        ...articleValues,
        id: Math.max(0, ...current.map(article => article.id)) + 1,
        categoryId,
        status: 'draft', views: 0, date: new Date().toISOString().slice(0, 10),
      }, ...current]
    })
    message.success('文章已保存')
    setOpen(false)
  }

  const columns = [
    { title: '封面', dataIndex: 'cover', width: 100, render: (cover?: string) => cover ? <Image src={cover} width={72} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} alt="文章封面" /> : '—' },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '内容分类', dataIndex: 'categoryId', render: (id: string) => <Tag color="blue">{categoryPath(categories, id).map((part) => part.name).join(' / ') || '未分类'}</Tag> },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'published' ? 'green' : 'default'}>{s === 'published' ? '已发布' : '草稿'}</Tag> },
    { title: '阅读量', dataIndex: 'views', sorter: (a: Article, b: Article) => a.views - b.views },
    { title: '发布日期', dataIndex: 'date' },
    { title: '操作', render: (_: unknown, article: Article) => <Space><a onClick={() => openEditor(article)}>编辑</a><a>预览</a><a style={{ color: '#EF4444' }}>下架</a></Space> },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Cascader placeholder="内容分类" style={{ width: 180 }} allowClear changeOnSelect showSearch options={categoryChoices}
          value={categoryFilter ? categoryPath(categories, categoryFilter).map((part) => part.id) : []}
          onChange={(values) => setCategoryFilter(values.length ? String(values[values.length - 1]) : undefined)} />
        <Select placeholder="状态" style={{ width: 120 }} allowClear value={statusFilter} onChange={setStatusFilter} options={[{ value: 'published', label: '已发布' }, { value: 'draft', label: '草稿' }]} />
        <Input placeholder="搜索标题" prefix={<SearchOutlined />} style={{ width: 220 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} allowClear />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>新建文章</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={visibleRows} rowSelection={{}} pagination={{ pageSize: 15 }} scroll={{ x: 900 }} />

      <Modal title={editing ? '编辑文章' : '新建文章'} open={open} onCancel={() => setOpen(false)} onOk={save} okButtonProps={{ disabled: uploading }} destroyOnHidden width={640}>
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="内容分类" name="categoryPath" rules={[{ required: true, message: '请选择内容分类' }]}>
            <Cascader changeOnSelect showSearch options={categoryChoices} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="封面图" name="cover"><ImageUpload label="文章封面" onBusyChange={setUploading} /></Form.Item>
          <Form.Item label="正文" name="content"><Input.TextArea rows={6} placeholder="富文本编辑器（mock）" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
