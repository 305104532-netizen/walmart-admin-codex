import { useState } from 'react'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Tag, Tooltip, Tree, Typography, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { loadCourseAlbums } from '../../models/courseCatalog'
import {
  DEFAULT_CONTENT_CATEGORIES, MAX_CATEGORY_DEPTH, categoryBranchHeight, categoryOptions,
  categoryPath, isCategoryOrDescendant, loadCategories, saveCategories,
} from '../../models/contentTaxonomy'
import type { CategoryDomain, CategoryOption, TaxonomyCategory } from '../../models/contentTaxonomy'
import './ContentCategories.css'

type CategoryFields = { name: string; parentId: string; sortOrder: number }
const ROOT = '__root__'
const CONTENT_DEFAULT_IDS = new Set(DEFAULT_CONTENT_CATEGORIES.map((category) => category.id))

function asTreeNodes(options: CategoryOption[]): DataNode[] {
  return options.map((option) => ({
    key: option.value,
    title: option.label,
    children: option.children ? asTreeNodes(option.children) : undefined,
  }))
}

function CategoryManager({ domain }: { domain: CategoryDomain }) {
  const [categories, setCategories] = useState(() => loadCategories(domain))
  const [selectedId, setSelectedId] = useState<string>()
  const [editing, setEditing] = useState<TaxonomyCategory>()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<CategoryFields>()
  const isCourse = domain === 'course'
  const title = isCourse ? '视频课程分类管理' : '内容分类管理'
  const selected = categories.find((category) => category.id === selectedId)
  const selectedPath = selected ? categoryPath(categories, selected.id) : []
  const hasChildren = !!selected && categories.some((category) => category.parentId === selected.id)
  const usedAlbums = isCourse && selected ? loadCourseAlbums().filter((album) => album.category === selected.id).length : 0
  const protectedContent = !isCourse && !!selected && CONTENT_DEFAULT_IDS.has(selected.id)
  const canDelete = !!selected && !hasChildren && !usedAlbums && !protectedContent
  const parentOptions = categories
    .filter((category) => !editing || !isCategoryOrDescendant(categories, category.id, editing.id))
    .map((category) => ({ value: category.id, label: categoryPath(categories, category.id).map((part) => part.name).join(' / ') }))

  const commit = (next: TaxonomyCategory[], success: string) => {
    try {
      saveCategories(domain, next)
      setCategories(next)
      message.success(success)
      return true
    } catch {
      message.error('分类保存失败，请检查浏览器本地存储空间')
      return false
    }
  }

  const openEditor = (category?: TaxonomyCategory, parentId: string | null = null) => {
    setEditing(category)
    const actualParent = category ? category.parentId : parentId
    const sortOrder = category?.sortOrder ?? Math.max(0, ...categories.filter((item) => item.parentId === actualParent).map((item) => item.sortOrder)) + 1
    form.resetFields()
    form.setFieldsValue({ name: category?.name ?? '', parentId: actualParent ?? ROOT, sortOrder })
    setOpen(true)
  }

  const save = async () => {
    let fields: CategoryFields
    try { fields = await form.validateFields() } catch { return }
    const name = fields.name.trim()
    const parentId = fields.parentId === ROOT ? null : fields.parentId
    const parentDepth = parentId ? categoryPath(categories, parentId).length : 0
    const branchHeight = editing ? categoryBranchHeight(categories, editing.id) : 1
    if (parentDepth + branchHeight > MAX_CATEGORY_DEPTH) {
      message.error(`分类结构最多支持 ${MAX_CATEGORY_DEPTH} 级`)
      return
    }
    if (parentId && (!categories.some((category) => category.id === parentId)
      || (editing && isCategoryOrDescendant(categories, parentId, editing.id)))) {
      message.error('请选择有效的上级分类')
      return
    }
    if (categories.some((category) => category.id !== editing?.id && category.parentId === parentId && category.name.trim() === name)) {
      message.error('同级分类名称不能重复')
      return
    }
    const id = editing?.id ?? `category-${crypto.randomUUID()}`
    const next = editing
      ? categories.map((category) => category.id === id ? { ...category, name, parentId, sortOrder: fields.sortOrder } : category)
      : [...categories, { id, name, parentId, sortOrder: fields.sortOrder }]
    if (commit(next, editing ? '分类已更新' : '分类已创建')) {
      setSelectedId(id)
      setOpen(false)
    }
  }

  const remove = () => {
    if (!selected || !canDelete) return
    if (commit(categories.filter((category) => category.id !== selected.id), '分类已删除')) setSelectedId(undefined)
  }

  return <div className="taxonomy-page">
    <div className="taxonomy-page-header">
      <div><Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title><Typography.Text type="secondary">{categories.length} 个分类</Typography.Text></div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>新增一级分类</Button>
    </div>
    <div className="taxonomy-layout">
      <section className="taxonomy-tree" aria-label={`${title}结构`}>
        <Typography.Text strong>分类结构</Typography.Text>
        <Tree key={categories.length} blockNode showLine defaultExpandAll treeData={asTreeNodes(categoryOptions(categories))}
          selectedKeys={selectedId ? [selectedId] : []} onSelect={(keys) => setSelectedId(keys[0] as string | undefined)} />
      </section>
      <section className="taxonomy-detail" aria-label="分类详情">
        {selected ? <Space orientation="vertical" size={20} style={{ width: '100%' }}>
          <div><Typography.Title level={5} style={{ margin: 0 }}>{selected.name}</Typography.Title><Typography.Text type="secondary">{selectedPath.map((category) => category.name).join(' / ')}</Typography.Text></div>
          <Space wrap><Tag color="blue">第 {selectedPath.length} 级</Tag><Tag>{hasChildren ? `${categories.filter((category) => category.parentId === selected.id).length} 个子分类` : '无子分类'}</Tag>{isCourse && <Tag>{usedAlbums} 个课程专辑</Tag>}</Space>
          <Space wrap>
            <Button icon={<EditOutlined />} onClick={() => openEditor(selected)}>编辑分类</Button>
            <Tooltip title={selectedPath.length >= MAX_CATEGORY_DEPTH ? `最多支持 ${MAX_CATEGORY_DEPTH} 级` : ''}>
              <Button icon={<PlusOutlined />} disabled={selectedPath.length >= MAX_CATEGORY_DEPTH} onClick={() => openEditor(undefined, selected.id)}>新增子分类</Button>
            </Tooltip>
            <Tooltip title={hasChildren ? '请先删除子分类' : usedAlbums ? '已有课程专辑使用此分类' : protectedContent ? '内置内容分类不可删除' : ''}>
              <span><Popconfirm title={`删除分类“${selected.name}”？`} description="删除后无法恢复" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={remove}>
                <Button danger icon={<DeleteOutlined />} disabled={!canDelete}>删除分类</Button>
              </Popconfirm></span>
            </Tooltip>
          </Space>
        </Space> : <Empty description="请选择左侧分类" />}
      </section>
    </div>

    <Modal title={editing ? '编辑分类' : '新增分类'} open={open} onCancel={() => setOpen(false)} onOk={() => void save()} destroyOnHidden width={560}>
      <Form form={form} layout="vertical">
        <Form.Item label="分类名称" name="name" rules={[{ required: true, whitespace: true, message: '请输入分类名称' }]}><Input maxLength={30} /></Form.Item>
        <Form.Item label="上级分类" name="parentId" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" options={[{ value: ROOT, label: '一级分类' }, ...parentOptions]} />
        </Form.Item>
        <Form.Item label="同级排序" name="sortOrder" rules={[{ required: true, message: '请输入排序值' }]}><InputNumber min={1} precision={0} style={{ width: 160 }} /></Form.Item>
      </Form>
    </Modal>
  </div>
}

export default function ContentCategories() { return <CategoryManager key="content" domain="content" /> }
export function CourseCategories() { return <CategoryManager key="course" domain="course" /> }
