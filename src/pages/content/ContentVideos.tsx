import { useMemo, useState } from 'react'
import { ArrowDownOutlined, ArrowUpOutlined, EditOutlined, PlayCircleOutlined, PlusOutlined, SearchOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, Drawer, Form, Image, Input, InputNumber, Modal, Segmented, Select, Space, Switch, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd'
import ImageUpload from '../../components/ImageUpload'
import { COURSE_CATEGORIES, loadCourseAlbums, saveCourseAlbums } from '../../models/courseCatalog'
import type { CourseAlbum, CourseCategory, CourseLesson, CourseRequirement, CourseStatus } from '../../models/courseCatalog'

type AlbumFields = Pick<CourseAlbum, 'title' | 'category' | 'requirement' | 'description' | 'cover' | 'sortOrder'>
type LessonFields = Pick<CourseLesson, 'title' | 'durationMinutes' | 'videoUrl' | 'status'> & { albumId: string }
type LessonRow = CourseLesson & { albumId: string; albumTitle: string; category: CourseCategory; requirement: CourseRequirement }

const CATEGORY_NAMES = Object.fromEntries(COURSE_CATEGORIES.map(({ value, label }) => [value, label])) as Record<CourseCategory, string>
const REQUIREMENT_NAMES: Record<CourseRequirement, string> = { required: '必修', elective: '选修' }
const STATUS_NAMES: Record<CourseStatus, string> = { draft: '草稿', published: '已发布' }
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

export default function ContentVideos() {
  const [albums, setAlbums] = useState(loadCourseAlbums)
  const [view, setView] = useState('albums')
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<CourseCategory>()
  const [requirement, setRequirement] = useState<CourseRequirement>()
  const [status, setStatus] = useState<CourseStatus>()
  const [albumOpen, setAlbumOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<CourseAlbum>()
  const [activeAlbumId, setActiveAlbumId] = useState<string>()
  const [lessonOpen, setLessonOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<CourseLesson>()
  const [previewUrl, setPreviewUrl] = useState('')
  const [albumForm] = Form.useForm<AlbumFields>()
  const [lessonForm] = Form.useForm<LessonFields>()

  const activeAlbum = albums.find((album) => album.id === activeAlbumId)
  const orderedAlbums = useMemo(() => [...albums].sort((left, right) => left.sortOrder - right.sortOrder), [albums])
  const allLessons = useMemo<LessonRow[]>(() => orderedAlbums.flatMap((album) => album.lessons.map((lesson) => ({
    ...lesson, albumId: album.id, albumTitle: album.title, category: album.category, requirement: album.requirement,
  }))), [orderedAlbums])
  const matchesFilters = (album: CourseAlbum) => (!category || album.category === category)
    && (!requirement || album.requirement === requirement) && (!status || album.status === status)
    && (!keyword || `${album.title}${album.description}`.toLowerCase().includes(keyword.trim().toLowerCase()))
  const visibleAlbums = orderedAlbums.filter(matchesFilters)
  const visibleLessons = allLessons.filter((lesson) => (!category || lesson.category === category)
    && (!requirement || lesson.requirement === requirement) && (!status || lesson.status === status)
    && (!keyword || `${lesson.title}${lesson.albumTitle}`.toLowerCase().includes(keyword.trim().toLowerCase())))

  const commit = (next: CourseAlbum[], success: string) => {
    try {
      saveCourseAlbums(next)
      setAlbums(next)
      message.success(success)
      return true
    } catch {
      message.error('保存失败，请检查浏览器本地存储空间')
      return false
    }
  }

  const openAlbumEditor = (album?: CourseAlbum) => {
    setEditingAlbum(album)
    albumForm.resetFields()
    albumForm.setFieldsValue(album ?? {
      title: '', category: 'entry', requirement: 'required', description: '', cover: '',
      sortOrder: Math.max(0, ...albums.map((item) => item.sortOrder)) + 1,
    })
    setAlbumOpen(true)
  }

  const saveAlbum = async () => {
    let values: AlbumFields
    try { values = await albumForm.validateFields() } catch { return }
    const next = editingAlbum
      ? albums.map((album) => album.id === editingAlbum.id ? { ...album, ...values } : album)
      : [...albums, { ...values, id: newId('album'), learners: 0, status: 'draft' as const, lessons: [] }]
    if (commit(next, editingAlbum ? '专辑已更新' : '专辑已创建')) setAlbumOpen(false)
  }

  const toggleAlbum = (album: CourseAlbum) => {
    if (album.status === 'draft' && !album.lessons.some((lesson) => lesson.status === 'published')) {
      message.warning('请先添加并发布至少一节课时')
      return
    }
    const nextStatus = album.status === 'published' ? 'draft' : 'published'
    commit(albums.map((item) => item.id === album.id ? { ...item, status: nextStatus } : item), nextStatus === 'published' ? '专辑已发布' : '专辑已下架')
  }

  const openLessonEditor = (albumId?: string, lesson?: CourseLesson) => {
    setEditingLesson(lesson)
    lessonForm.resetFields()
    lessonForm.setFieldsValue(lesson ? { ...lesson, albumId: albumId ?? '' } : {
      albumId: albumId ?? '', title: '', durationMinutes: 10, videoUrl: '', status: 'draft',
    })
    setLessonOpen(true)
  }

  const saveLesson = async () => {
    let values: LessonFields
    try { values = await lessonForm.validateFields() } catch { return }
    const { albumId, ...lessonValues } = values
    const next = albums.map((album) => {
      if (album.id !== albumId) return album
      const lessons = editingLesson
        ? album.lessons.map((lesson) => lesson.id === editingLesson.id ? { ...lesson, ...lessonValues } : lesson)
        : [...album.lessons, { ...lessonValues, id: newId('lesson') }]
      return { ...album, lessons }
    })
    if (commit(next, editingLesson ? '课时已更新' : '课时已添加')) setLessonOpen(false)
  }

  const toggleLesson = (albumId: string, lesson: CourseLesson) => {
    const nextStatus = lesson.status === 'published' ? 'draft' : 'published'
    commit(albums.map((album) => album.id === albumId ? {
      ...album, lessons: album.lessons.map((item) => item.id === lesson.id ? { ...item, status: nextStatus } : item),
    } : album), nextStatus === 'published' ? '课时已发布' : '课时已设为草稿')
  }

  const moveLesson = (album: CourseAlbum, index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= album.lessons.length) return
    const lessons = [...album.lessons]
    ;[lessons[index], lessons[target]] = [lessons[target], lessons[index]]
    commit(albums.map((item) => item.id === album.id ? { ...item, lessons } : item), '课时顺序已更新')
  }

  const albumColumns = [
    { title: '课程专辑', key: 'album', width: 280, render: (_: unknown, album: CourseAlbum) => <Space align="start" style={{ flexWrap: 'nowrap' }}><Image src={album.cover} alt={`${album.title}封面`} width={64} height={48} preview={false} style={{ objectFit: 'cover', borderRadius: 4 }} /><Space orientation="vertical" size={2}><Typography.Text strong>{album.title}</Typography.Text><Typography.Text type="secondary" ellipsis style={{ width: 164, fontSize: 12 }}>{album.description}</Typography.Text></Space></Space> },
    { title: '分类', dataIndex: 'category', width: 105, render: (value: CourseCategory) => CATEGORY_NAMES[value] },
    { title: '学习属性', dataIndex: 'requirement', width: 90, render: (value: CourseRequirement) => <Tag color={value === 'required' ? 'red' : 'blue'}>{REQUIREMENT_NAMES[value]}</Tag> },
    { title: '课时', dataIndex: 'lessons', width: 70, render: (lessons: CourseLesson[]) => `${lessons.filter((lesson) => lesson.status === 'published').length} / ${lessons.length}` },
    { title: '学习人数', dataIndex: 'learners', width: 88, render: (value: number) => value.toLocaleString('zh-CN') },
    { title: '排序', dataIndex: 'sortOrder', width: 58 },
    { title: '状态', dataIndex: 'status', width: 98, render: (_: CourseStatus, album: CourseAlbum) => <Switch checked={album.status === 'published'} checkedChildren="已发布" unCheckedChildren="草稿" onChange={() => toggleAlbum(album)} aria-label={`${album.title}发布状态`} /> },
    { title: '操作', key: 'actions', fixed: 'right' as const, width: 174, render: (_: unknown, album: CourseAlbum) => <Space size={0} style={{ flexWrap: 'nowrap' }}><Button type="link" icon={<UnorderedListOutlined />} onClick={() => setActiveAlbumId(album.id)}>课时</Button><Button type="link" icon={<EditOutlined />} onClick={() => openAlbumEditor(album)}>编辑</Button></Space> },
  ]

  const lessonColumns = [
    { title: '视频课时', dataIndex: 'title', width: 220, ellipsis: true },
    { title: '所属专辑', dataIndex: 'albumTitle', width: 140, ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 100, render: (value: CourseCategory) => CATEGORY_NAMES[value] },
    { title: '学习属性', dataIndex: 'requirement', width: 80, render: (value: CourseRequirement) => <Tag color={value === 'required' ? 'red' : 'blue'}>{REQUIREMENT_NAMES[value]}</Tag> },
    { title: '时长', dataIndex: 'durationMinutes', width: 90, render: (value: number) => <span style={{ whiteSpace: 'nowrap' }}>{value} 分钟</span> },
    { title: '视频', dataIndex: 'videoUrl', width: 100, render: (value: string) => <Tag color={value ? 'green' : 'default'}>{value ? '已配置' : '未配置'}</Tag> },
    { title: '状态', dataIndex: 'status', width: 95, render: (value: CourseStatus) => <Tag color={value === 'published' ? 'green' : 'default'}>{STATUS_NAMES[value]}</Tag> },
    { title: '操作', key: 'actions', fixed: 'right' as const, width: 150, render: (_: unknown, lesson: LessonRow) => <Space size={2} style={{ flexWrap: 'nowrap' }}><Tooltip title="编辑课时"><Button type="text" size="small" icon={<EditOutlined />} aria-label={`编辑${lesson.title}`} onClick={() => openLessonEditor(lesson.albumId, lesson)} /></Tooltip><Tooltip title={lesson.videoUrl ? '预览视频' : '未配置视频地址'}><Button type="text" size="small" icon={<PlayCircleOutlined />} aria-label={`预览${lesson.title}`} disabled={!lesson.videoUrl} onClick={() => setPreviewUrl(lesson.videoUrl)} /></Tooltip><Button type="link" size="small" onClick={() => toggleLesson(lesson.albumId, lesson)}>{lesson.status === 'published' ? '下架' : '发布'}</Button></Space> },
  ]

  return <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <div><Typography.Title level={4} style={{ margin: 0 }}>视频课程管理</Typography.Title><Typography.Text type="secondary">{albums.length} 个专辑 · {allLessons.length} 节课时 · {albums.filter((album) => album.requirement === 'required').length} 个必修专辑</Typography.Text></div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
      <Space wrap>
        <Input allowClear prefix={<SearchOutlined />} placeholder="搜索课程或专辑" value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 230 }} />
        <Select allowClear placeholder="课程分类" value={category} onChange={setCategory} options={[...COURSE_CATEGORIES]} style={{ width: 140 }} />
        <Select allowClear placeholder="学习属性" value={requirement} onChange={setRequirement} options={[{ value: 'required', label: '必修' }, { value: 'elective', label: '选修' }]} style={{ width: 120 }} />
        <Select allowClear placeholder="发布状态" value={status} onChange={setStatus} options={[{ value: 'published', label: '已发布' }, { value: 'draft', label: '草稿' }]} style={{ width: 120 }} />
      </Space>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => view === 'albums' ? openAlbumEditor() : openLessonEditor()}>{view === 'albums' ? '新建专辑' : '新增课时'}</Button>
    </div>
    <Tabs activeKey={view} onChange={setView} items={[{ key: 'albums', label: '课程专辑' }, { key: 'lessons', label: '视频课时' }]} style={{ marginBottom: -16 }} />
    {view === 'albums'
      ? <Table rowKey="id" columns={albumColumns} dataSource={visibleAlbums} scroll={{ x: 963 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个专辑` }} />
      : <Table rowKey="id" columns={lessonColumns} dataSource={visibleLessons} scroll={{ x: 975 }} pagination={{ pageSize: 12, showTotal: (total) => `共 ${total} 节课时` }} />}

    <Modal title={editingAlbum ? '编辑课程专辑' : '新建课程专辑'} open={albumOpen} onCancel={() => setAlbumOpen(false)} onOk={() => void saveAlbum()} destroyOnHidden width={660}>
      <Form form={albumForm} layout="vertical">
        <Form.Item label="专辑名称" name="title" rules={[{ required: true, whitespace: true, message: '请输入专辑名称' }]}><Input maxLength={60} /></Form.Item>
        <Space wrap size={16} align="start">
          <Form.Item label="课程分类" name="category" rules={[{ required: true }]}><Select options={[...COURSE_CATEGORIES]} style={{ width: 195 }} /></Form.Item>
          <Form.Item label="学习属性" name="requirement" rules={[{ required: true }]}><Segmented options={[{ label: '必修课程', value: 'required' }, { label: '选修课程', value: 'elective' }]} /></Form.Item>
          <Form.Item label="展示顺序" name="sortOrder" rules={[{ required: true }]}><InputNumber min={1} precision={0} style={{ width: 100 }} /></Form.Item>
        </Space>
        <Form.Item label="课程简介" name="description" rules={[{ required: true, whitespace: true, message: '请输入课程简介' }]}><Input.TextArea rows={3} maxLength={240} showCount /></Form.Item>
        <Form.Item label="专辑封面" name="cover" rules={[{ required: true, message: '请上传专辑封面' }]}><ImageUpload label="专辑封面" maxMB={1} /></Form.Item>
      </Form>
    </Modal>

    <Drawer open={!!activeAlbum} onClose={() => setActiveAlbumId(undefined)} title={activeAlbum?.title ?? '课时管理'} size="min(900px, 96vw)" extra={activeAlbum && <Button type="primary" icon={<PlusOutlined />} onClick={() => openLessonEditor(activeAlbum.id)}>新增课时</Button>}>
      {activeAlbum && <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap><Tag>{CATEGORY_NAMES[activeAlbum.category]}</Tag><Tag color={activeAlbum.requirement === 'required' ? 'red' : 'blue'}>{REQUIREMENT_NAMES[activeAlbum.requirement]}</Tag><Typography.Text type="secondary">{activeAlbum.lessons.length} 节课时</Typography.Text></Space>
        <Table rowKey="id" size="small" pagination={false} dataSource={activeAlbum.lessons} scroll={{ x: 680 }} columns={[
          { title: '顺序', key: 'order', width: 64, render: (_: unknown, __: CourseLesson, index: number) => index + 1 },
          { title: '课时标题', dataIndex: 'title', ellipsis: true },
          { title: '时长', dataIndex: 'durationMinutes', width: 90, render: (value: number) => `${value} 分钟` },
          { title: '视频', dataIndex: 'videoUrl', width: 90, render: (value: string) => value ? '已配置' : '未配置' },
          { title: '状态', dataIndex: 'status', width: 90, render: (value: CourseStatus) => <Tag color={value === 'published' ? 'green' : 'default'}>{STATUS_NAMES[value]}</Tag> },
          { title: '操作', key: 'actions', width: 150, render: (_: unknown, lesson: CourseLesson, index: number) => <Space size={0} style={{ flexWrap: 'nowrap' }}><Button type="text" size="small" icon={<ArrowUpOutlined />} title="上移" aria-label={`上移${lesson.title}`} disabled={index === 0} onClick={() => moveLesson(activeAlbum, index, -1)} /><Button type="text" size="small" icon={<ArrowDownOutlined />} title="下移" aria-label={`下移${lesson.title}`} disabled={index === activeAlbum.lessons.length - 1} onClick={() => moveLesson(activeAlbum, index, 1)} /><Button type="link" size="small" onClick={() => openLessonEditor(activeAlbum.id, lesson)}>编辑</Button></Space> },
        ]} />
      </Space>}
    </Drawer>

    <Modal title={editingLesson ? '编辑视频课时' : '新增视频课时'} open={lessonOpen} onCancel={() => setLessonOpen(false)} onOk={() => void saveLesson()} destroyOnHidden width={580} zIndex={1100}>
      <Form form={lessonForm} layout="vertical">
        <Form.Item label="所属专辑" name="albumId" rules={[{ required: true, message: '请选择所属专辑' }]}><Select disabled={!!editingLesson} options={orderedAlbums.map((album) => ({ value: album.id, label: album.title }))} /></Form.Item>
        <Form.Item label="课时标题" name="title" rules={[{ required: true, whitespace: true, message: '请输入课时标题' }]}><Input maxLength={80} /></Form.Item>
        <Space wrap size={16} align="start">
          <Form.Item label="时长（分钟）" name="durationMinutes" rules={[{ required: true, message: '请输入时长' }]}><InputNumber min={1} max={600} precision={0} style={{ width: 160 }} /></Form.Item>
          <Form.Item label="课时状态" name="status"><Segmented options={[{ label: '草稿', value: 'draft' }, { label: '已发布', value: 'published' }]} /></Form.Item>
        </Space>
        <Form.Item label="视频地址" name="videoUrl" rules={[{ type: 'url', message: '请输入完整的视频 URL' }]}><Input placeholder="https://.../video.mp4" /></Form.Item>
      </Form>
    </Modal>

    <Modal title="视频预览" open={!!previewUrl} onCancel={() => setPreviewUrl('')} footer={null} destroyOnHidden width={760}>
      {previewUrl && <video controls src={previewUrl} style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', background: '#101828' }} />}
    </Modal>
  </Space>
}
