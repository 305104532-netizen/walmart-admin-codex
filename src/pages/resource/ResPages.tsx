import { Fragment, useMemo, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import dayjs from 'dayjs'
import {
  Alert, Button, Card, Col, DatePicker, Descriptions, Divider, Drawer, Empty, Form, Image, Input,
  InputNumber, Modal, Popconfirm, QRCode, Row, Segmented, Select, Space, Statistic, Table, Tabs,
  Tag, Tooltip, Typography, Upload, message,
} from 'antd'
import {
  AimOutlined, ArrowDownOutlined, ArrowUpOutlined, CloudUploadOutlined, CopyOutlined,
  DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, FileImageOutlined, FontSizeOutlined,
  LinkOutlined, NotificationOutlined, PictureOutlined, PlayCircleOutlined, PlusOutlined,
  QrcodeOutlined, SearchOutlined, SettingOutlined, ShopOutlined, VideoCameraOutlined,
} from '@ant-design/icons'
import ImageUpload from '../../components/ImageUpload'
import { DEFAULT_MINI_PROGRAM_PAGES } from '../../models/tempPages'
import type { ChannelParam, MiniProgramPage, TempPageStatus } from '../../models/tempPages'
import './ResPages.css'

type BlockType = 'image' | 'video' | 'banner' | 'text' | 'hotspot' | 'subscribe'

const COMPONENT_DRAG_TYPE = 'application/x-walmart-page-component'
const BLOCK_DRAG_TYPE = 'application/x-walmart-page-block'

interface PageBlock {
  id: number
  type: BlockType
  label: string
  image?: string
  images?: string[]
  mediaName?: string
  mediaUrl?: string
  text?: string
  fontSize?: number
  align?: 'left' | 'center' | 'right'
  target?: string
  buttonText?: string
  template?: string
  hotspotX?: number
  hotspotY?: number
  hotspotWidth?: number
  hotspotHeight?: number
}

const STATUS_META: Record<TempPageStatus, { label: string; color: string }> = {
  online: { label: '已上线', color: 'success' },
  scheduled: { label: '待生效', color: 'processing' },
  expired: { label: '已失效', color: 'default' },
  draft: { label: '草稿', color: 'warning' },
}

const PALETTE: Array<{ type: BlockType; label: string; help: string; icon: ReactNode }> = [
  { type: 'image', label: '图片组件', help: '单张切图或长图', icon: <PictureOutlined /> },
  { type: 'video', label: '视频组件', help: '视频与封面配置', icon: <VideoCameraOutlined /> },
  { type: 'banner', label: 'Banner轮播', help: '多图轮播与跳转', icon: <FileImageOutlined /> },
  { type: 'text', label: '文本编辑', help: '标题、正文与说明', icon: <FontSizeOutlined /> },
  { type: 'hotspot', label: '热区组件', help: '在切图上添加跳转', icon: <AimOutlined /> },
  { type: 'subscribe', label: '订阅消息', help: '引导用户授权订阅', icon: <NotificationOutlined /> },
]

let blockUid = 100

function newBlock(type: BlockType, image?: string): PageBlock {
  const label = PALETTE.find((item) => item.type === type)?.label ?? '组件'
  const base = { id: ++blockUid, type, label }
  if (type === 'image') return { ...base, image }
  if (type === 'video') return { ...base, mediaName: '', text: '点击播放视频' }
  if (type === 'banner') return { ...base, images: [], text: '品牌活动轮播' }
  if (type === 'text') return { ...base, text: '在这里输入页面文案', fontSize: 16, align: 'left' }
  if (type === 'hotspot') return { ...base, text: '点击了解详情', target: '/pages/index/index', hotspotX: 10, hotspotY: 35, hotspotWidth: 80, hotspotHeight: 20 }
  return { ...base, text: '订阅活动提醒，不错过重要消息', buttonText: '立即订阅', template: '活动开始提醒' }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function readImage(file: File, done: (value: string) => void, fail: (text: string) => void) {
  if (!file.type.startsWith('image/')) {
    fail('请选择图片文件')
    return Upload.LIST_IGNORE
  }
  if (file.size > 8 * 1024 * 1024) {
    fail('单张图片不能超过 8MB')
    return Upload.LIST_IGNORE
  }
  const reader = new FileReader()
  reader.onload = () => typeof reader.result === 'string' && done(reader.result)
  reader.onerror = () => fail('图片读取失败，请重新选择')
  reader.readAsDataURL(file)
  return Upload.LIST_IGNORE
}

function PhoneBlock({ block }: { block: PageBlock }) {
  if (block.type === 'image') return block.image
    ? <img className="builder-content-image" src={block.image} alt="页面切图" />
    : <div className="builder-placeholder"><PictureOutlined /><span>请上传页面切图</span></div>
  if (block.type === 'video') return block.mediaUrl
    ? <video className="builder-video-player" src={block.mediaUrl} controls aria-label={block.mediaName || '页面视频'} />
    : <div className="builder-video"><PlayCircleOutlined /><span>{block.mediaName || '请上传视频文件'}</span></div>
  if (block.type === 'banner') return <div className="builder-banner" style={block.images?.[0] ? { backgroundImage: 'url(' + block.images[0] + ')' } : undefined}>
    {!block.images?.length && <><FileImageOutlined /><span>Banner 轮播</span></>}
    <div className="builder-dots"><i /><i /><i /></div>
  </div>
  if (block.type === 'text') return <div className="builder-text" style={{ fontSize: block.fontSize, textAlign: block.align }}>{block.text}</div>
  if (block.type === 'hotspot') return <div className="builder-hotspot"><AimOutlined /><span>{block.text}</span><small>{block.target}</small><em>X {block.hotspotX}% · Y {block.hotspotY}% · {block.hotspotWidth}% × {block.hotspotHeight}%</em></div>
  return <div className="builder-subscribe"><NotificationOutlined /><div><strong>订阅消息提醒</strong><p>{block.text}</p></div><button>{block.buttonText}</button></div>
}

export default function ResPages() {
  const [pages, setPages] = useState<MiniProgramPage[]>(DEFAULT_MINI_PROGRAM_PAGES)
  const [keyword, setKeyword] = useState('')
  const [kind, setKind] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [editing, setEditing] = useState<MiniProgramPage>()
  const [sunPage, setSunPage] = useState<MiniProgramPage>()
  const [sunChannel, setSunChannel] = useState('all')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [selectedId, setSelectedId] = useState<number>()
  const [draggingId, setDraggingId] = useState<number>()
  const [draggingType, setDraggingType] = useState<BlockType>()
  const [dropIndex, setDropIndex] = useState<number>()
  const [builderTab, setBuilderTab] = useState('page')
  const [editForm] = Form.useForm()
  const [builderForm] = Form.useForm()
  const [messageApi, messageContextHolder] = message.useMessage()
  const editValidityMode = Form.useWatch('validityMode', editForm)
  const builderTitle = Form.useWatch('title', builderForm) || '未命名临时页面'
  const builderShareTitle = Form.useWatch('shareTitle', builderForm) || builderTitle
  const builderShareCover = Form.useWatch('shareCover', builderForm)

  const filteredPages = useMemo(() => pages.filter((page) => {
    const q = keyword.trim().toLowerCase()
    return (!q || page.title.toLowerCase().includes(q) || page.path.toLowerCase().includes(q))
      && (kind === 'all' || page.kind === kind) && (status === 'all' || page.status === status)
  }), [kind, keyword, pages, status])

  const metrics = useMemo(() => ({
    total: pages.length,
    online: pages.filter((page) => page.status === 'online').length,
    temporary: pages.filter((page) => page.kind === 'temporary').length,
    pv: pages.reduce((sum, page) => sum + page.pv, 0),
  }), [pages])

  const selectedBlock = blocks.find((block) => block.id === selectedId)

  const copyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path)
      messageApi.success('页面路径已复制')
    } catch {
      messageApi.error('复制失败，请手动复制')
    }
  }

  const openEdit = (page: MiniProgramPage) => {
    setEditing(page)
    editForm.setFieldsValue({
      title: page.title,
      path: page.path,
      status: page.status,
      validityMode: page.validFrom ? 'range' : 'long',
      period: page.validFrom && page.validTo ? [dayjs(page.validFrom), dayjs(page.validTo)] : undefined,
      channels: page.channels,
      shareTitle: page.shareTitle,
      shareCover: page.shareCover,
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    const values = await editForm.validateFields()
    const next: MiniProgramPage = {
      ...editing,
      title: values.title,
      status: values.status,
      channels: (values.channels ?? []).filter((item: ChannelParam) => item?.key && item?.value),
      validFrom: values.validityMode === 'range' ? values.period?.[0]?.format('YYYY-MM-DD') : undefined,
      validTo: values.validityMode === 'range' ? values.period?.[1]?.format('YYYY-MM-DD') : undefined,
      shareTitle: values.shareTitle,
      shareCover: values.shareCover ?? '',
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    }
    setPages((current) => current.map((page) => page.id === next.id ? next : page))
    setEditing(undefined)
    messageApi.success('页面配置已更新')
  }

  const deletePage = (page: MiniProgramPage) => {
    setPages((current) => current.filter((item) => item.id !== page.id))
    messageApi.success('页面已删除')
  }

  const openBuilder = () => {
    const suffix = dayjs().format('MMDD-HHmm')
    builderForm.setFieldsValue({
      title: '', path: '/pages/temp/page-' + suffix, period: [dayjs(), dayjs().add(30, 'day')],
      shareTitle: '', shareCover: '',
    })
    setBlocks([])
    setSelectedId(undefined)
    setBuilderTab('page')
    setBuilderOpen(true)
  }

  const addBlock = (type: BlockType, image?: string) => {
    const block = newBlock(type, image)
    setBlocks((current) => [...current, block])
    setSelectedId(block.id)
    setBuilderTab('component')
  }

  const insertBlock = (type: BlockType, index: number, image?: string) => {
    const block = newBlock(type, image)
    setBlocks((current) => {
      const next = [...current]
      next.splice(Math.max(0, Math.min(index, next.length)), 0, block)
      return next
    })
    setSelectedId(block.id)
    setBuilderTab('component')
  }

  const updateBlock = (patch: Partial<PageBlock>) => {
    if (!selectedId) return
    setBlocks((current) => current.map((block) => block.id === selectedId ? { ...block, ...patch } : block))
  }

  const moveBlock = (id: number, direction: -1 | 1) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  const moveBlockTo = (id: number, insertionIndex: number) => {
    setBlocks((current) => {
      const sourceIndex = current.findIndex((block) => block.id === id)
      if (sourceIndex < 0) return current
      const next = [...current]
      const [moved] = next.splice(sourceIndex, 1)
      const targetIndex = sourceIndex < insertionIndex ? insertionIndex - 1 : insertionIndex
      next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, moved)
      return next
    })
    setSelectedId(id)
    setBuilderTab('component')
  }

  const finishDrag = () => {
    setDraggingId(undefined)
    setDraggingType(undefined)
    setDropIndex(undefined)
  }

  const dropOnCanvas = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault()
    event.stopPropagation()
    const blockId = Number(event.dataTransfer.getData(BLOCK_DRAG_TYPE))
    const componentType = event.dataTransfer.getData(COMPONENT_DRAG_TYPE) as BlockType
    if (Number.isFinite(blockId) && blockId > 0) {
      moveBlockTo(blockId, index)
      finishDrag()
      return
    }
    if (PALETTE.some((item) => item.type === componentType)) {
      insertBlock(componentType, index)
      finishDrag()
      return
    }
    const imageFiles = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length) {
      imageFiles.forEach((file, offset) => readImage(file, (value) => insertBlock('image', index + offset, value), messageApi.error))
      messageApi.success(`已拖入 ${imageFiles.length} 张切图`)
    }
    finishDrag()
  }

  const removeBlock = (id: number) => {
    setBlocks((current) => current.filter((block) => block.id !== id))
    if (selectedId === id) setSelectedId(undefined)
  }

  const saveNewPage = async (asDraft: boolean) => {
    const values = await builderForm.validateFields()
    if (!blocks.length) {
      messageApi.warning('请至少添加一个页面组件')
      return
    }
    const start = values.period?.[0]
    const end = values.period?.[1]
    const nextStatus: TempPageStatus = asDraft ? 'draft' : start?.isAfter(dayjs(), 'day') ? 'scheduled' : 'online'
    const next: MiniProgramPage = {
      id: 'temp-' + Date.now(), title: values.title, path: values.path, kind: 'temporary', pv: 0, uv: 0,
      channels: [], validFrom: start?.format('YYYY-MM-DD'), validTo: end?.format('YYYY-MM-DD'), status: nextStatus,
      shareTitle: values.shareTitle || values.title, shareCover: values.shareCover || '',
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm'), componentCount: blocks.length,
    }
    setPages((current) => [next, ...current])
    setBuilderOpen(false)
    messageApi.success(asDraft ? '草稿已保存' : '临时页面已创建并发布')
  }

  const sunCodeValue = useMemo(() => {
    if (!sunPage) return ''
    const params = sunChannel === 'all' ? sunPage.channels : sunPage.channels.filter((item) => item.key + '=' + item.value === sunChannel)
    const query = params.map((item) => encodeURIComponent(item.key) + '=' + encodeURIComponent(item.value)).join('&')
    return sunPage.path + (query ? '?' + query : '')
  }, [sunChannel, sunPage])

  const downloadSunCode = () => {
    const canvas = document.querySelector('#sun-code-preview canvas') as HTMLCanvasElement | null
    if (!canvas || !sunPage) {
      messageApi.error('太阳码生成失败，请稍后重试')
      return
    }
    const link = document.createElement('a')
    link.download = sunPage.title + '-小程序太阳码.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    messageApi.success('太阳码已下载')
  }

  const columns = [
    {
      title: '页面标题', key: 'title', fixed: 'left' as const, width: 240,
      render: (_: unknown, page: MiniProgramPage) => <Space><div className={'page-kind-icon ' + page.kind}><ShopOutlined /></div><div><Typography.Text strong>{page.title}</Typography.Text><br /><Space size={4}><Tag variant="filled" color={page.kind === 'temporary' ? 'blue' : 'default'}>{page.kind === 'temporary' ? '临时页面' : '系统页面'}</Tag><Typography.Text type="secondary" className="tiny-text">{page.componentCount} 个组件</Typography.Text></Space></div></Space>,
    },
    {
      title: '页面路径', dataIndex: 'path', width: 245,
      render: (path: string) => <Space size={6}><Typography.Text code ellipsis={{ tooltip: path }} style={{ maxWidth: 185 }}>{path}</Typography.Text><Tooltip title="复制路径"><Button type="text" size="small" icon={<CopyOutlined />} aria-label="复制页面路径" onClick={() => void copyPath(path)} /></Tooltip></Space>,
    },
    {
      title: '访问量', key: 'traffic', width: 145,
      render: (_: unknown, page: MiniProgramPage) => <div className="traffic-cell"><span><b>{formatNumber(page.pv)}</b> PV</span><span><b>{formatNumber(page.uv)}</b> UV</span></div>,
    },
    {
      title: '渠道参数', dataIndex: 'channels', width: 230,
      render: (channels: ChannelParam[]) => channels.length ? <Space size={[4, 4]} wrap>{channels.slice(0, 2).map((channel) => <Tooltip key={channel.key + channel.value} title={channel.note + '：' + channel.key + '=' + channel.value}><Tag color="geekblue">{channel.key}={channel.value}</Tag></Tooltip>)}{channels.length > 2 && <Tag>+{channels.length - 2}</Tag>}</Space> : <Typography.Text type="secondary">未配置</Typography.Text>,
    },
    {
      title: '有效期', key: 'period', width: 180,
      render: (_: unknown, page: MiniProgramPage) => !page.validFrom ? <Tag variant="filled">长期有效</Tag> : <div><Typography.Text>{page.validFrom}</Typography.Text><br /><Typography.Text type="secondary">至 {page.validTo}</Typography.Text>{page.status === 'online' && page.validTo && dayjs(page.validTo).diff(dayjs(), 'day') <= 30 && <Tag color="orange" variant="filled">即将到期</Tag>}</div>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (value: TempPageStatus) => <Tag color={STATUS_META[value].color}>{STATUS_META[value].label}</Tag>,
    },
    {
      title: '操作', key: 'actions', fixed: 'right' as const, width: 250,
      render: (_: unknown, page: MiniProgramPage) => <Space size={2}>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(page)}>编辑</Button>
        <Button type="link" size="small" icon={<QrcodeOutlined />} onClick={() => { setSunPage(page); setSunChannel('all') }}>太阳码</Button>
        <Popconfirm title="删除页面" description={'确认删除“' + page.title + '”吗？'} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => deletePage(page)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>,
    },
  ]

  const editShareTitle = Form.useWatch('shareTitle', editForm)
  const editShareCover = Form.useWatch('shareCover', editForm)

  return <>{messageContextHolder}<div className="temp-pages">
    <div className="temp-pages-header">
      <div><Typography.Title level={4}>小程序页面管理</Typography.Title><Typography.Text type="secondary">统一管理小程序系统页面和临时运营页面，查看流量、配置渠道与分享素材</Typography.Text></div>
      <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openBuilder}>新建临时页面</Button>
    </div>

    <Row gutter={[16, 16]} className="page-metrics">
      <Col xs={12} lg={6}><Card><Statistic title="全部页面" value={metrics.total} suffix="个" prefix={<FileImageOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="已上线" value={metrics.online} suffix="个" prefix={<EyeOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="临时页面" value={metrics.temporary} suffix="个" prefix={<SettingOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card><Statistic title="累计访问量" value={metrics.pv} formatter={(value) => formatNumber(Number(value))} suffix="PV" prefix={<ShopOutlined />} /></Card></Col>
    </Row>

    <Card className="page-list-card" title={<Space><span>全部小程序页面</span><Tag>{filteredPages.length}</Tag></Space>}>
      <div className="page-toolbar">
        <Input allowClear prefix={<SearchOutlined />} placeholder="搜索页面标题或路径" value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 280 }} />
        <Select value={kind} onChange={setKind} style={{ width: 140 }} options={[{ value: 'all', label: '全部类型' }, { value: 'system', label: '系统页面' }, { value: 'temporary', label: '临时页面' }]} />
        <Select value={status} onChange={setStatus} style={{ width: 140 }} options={[{ value: 'all', label: '全部状态' }, ...Object.entries(STATUS_META).map(([value, item]) => ({ value, label: item.label }))]} />
      </div>
      <Table rowKey="id" columns={columns} dataSource={filteredPages} scroll={{ x: 1390 }} pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 个页面' }} />
    </Card>

    <Drawer open={!!editing} onClose={() => setEditing(undefined)} title={editing ? '编辑页面 · ' + editing.title : '编辑页面'} size="min(720px, 94vw)"
      extra={<Space><Button onClick={() => setEditing(undefined)}>取消</Button><Button type="primary" onClick={() => void saveEdit()}>保存配置</Button></Space>}>
      <Alert type="info" showIcon title="修改后会同步影响该页面的新分享链接和太阳码，请确认渠道参数与分享素材无误。" style={{ marginBottom: 16 }} />
      <Form form={editForm} layout="vertical">
        <Tabs items={[
          { key: 'basic', label: '页面设置', children: <>
            <Form.Item label="小程序页面标题" name="title" rules={[{ required: true, message: '请输入页面标题' }]}><Input maxLength={30} showCount /></Form.Item>
            <Form.Item label="页面路径" name="path"><Input disabled prefix={<LinkOutlined />} /></Form.Item>
            <Row gutter={16}><Col span={12}><Form.Item label="页面状态" name="status"><Select options={Object.entries(STATUS_META).map(([value, item]) => ({ value, label: item.label }))} /></Form.Item></Col><Col span={12}><Form.Item label="有效期" name="validityMode"><Segmented block options={[{ label: '长期有效', value: 'long' }, { label: '指定日期', value: 'range' }]} /></Form.Item></Col></Row>
            {editValidityMode === 'range' && <Form.Item label="生效时间" name="period" rules={[{ required: true, message: '请选择有效期' }]}><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>}
          </> },
          { key: 'channel', label: '渠道参数', children: <>
            <Alert type="warning" showIcon title="渠道参数会追加在页面路径后，用于区分广告、BD经理或活动来源。支持 {channel}、{bd_code} 等动态参数。" style={{ marginBottom: 16 }} />
            <Form.List name="channels">{(fields, { add, remove }) => <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              {fields.map(({ key, name, ...rest }) => <Card key={key} size="small"><Row gutter={8} align="middle"><Col span={7}><Form.Item {...rest} name={[name, 'key']} label="参数名" rules={[{ required: true }]}><Input placeholder="source" /></Form.Item></Col><Col span={7}><Form.Item {...rest} name={[name, 'value']} label="参数值" rules={[{ required: true }]}><Input placeholder="wechat" /></Form.Item></Col><Col span={8}><Form.Item {...rest} name={[name, 'note']} label="渠道说明"><Input placeholder="公众号推文" /></Form.Item></Col><Col span={2}><Button danger type="text" icon={<DeleteOutlined />} aria-label="删除渠道参数" onClick={() => remove(name)} /></Col></Row></Card>)}
              <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: '', value: '', note: '' })}>添加渠道参数</Button>
            </Space>}</Form.List>
          </> },
          { key: 'share', label: '分享卡片', children: <Row gutter={[20, 20]}><Col xs={24} md={14}><Form.Item label="分享小程序卡片标题" name="shareTitle" rules={[{ required: true, message: '请输入分享标题' }]}><Input.TextArea rows={3} maxLength={45} showCount /></Form.Item><Form.Item label="卡片封面图" name="shareCover"><ImageUpload label="分享卡片封面" maxMB={5} /></Form.Item></Col><Col xs={24} md={10}><ShareCard title={editShareTitle || editing?.title || ''} cover={editShareCover} /></Col></Row> },
        ]} />
      </Form>
    </Drawer>

    <Modal open={!!sunPage} onCancel={() => setSunPage(undefined)} title="生成小程序太阳码" width={520} footer={<Space><Button onClick={() => setSunPage(undefined)}>关闭</Button><Button type="primary" icon={<DownloadOutlined />} onClick={downloadSunCode}>下载 PNG</Button></Space>}>
      {sunPage && <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions size="small" column={1} bordered items={[{ key: 'page', label: '页面', children: sunPage.title }, { key: 'path', label: '页面路径', children: <Typography.Text code>{sunPage.path}</Typography.Text> }]} />
        <div><Typography.Text strong>选择渠道参数</Typography.Text><Select value={sunChannel} onChange={setSunChannel} style={{ width: '100%', marginTop: 8 }} options={[{ value: 'all', label: '全部已配置参数' }, ...sunPage.channels.map((channel) => ({ value: channel.key + '=' + channel.value, label: channel.note + ' · ' + channel.key + '=' + channel.value }))]} /></div>
        <div id="sun-code-preview" className="sun-code-panel"><div className="sun-code-ring"><QRCode value={sunCodeValue} size={210} bordered={false} color="#0B57D0" /></div><Typography.Text strong>{sunPage.title}</Typography.Text><Typography.Text type="secondary" copyable>{sunCodeValue}</Typography.Text><Typography.Text type="secondary" className="tiny-text">扫码进入小程序页面，渠道参数将自动带入统计</Typography.Text></div>
      </Space>}
    </Modal>

    <Drawer open={builderOpen} onClose={() => setBuilderOpen(false)} title={<Space><span>新建临时页面</span><Tag color="blue">可视化搭建</Tag></Space>} size="min(1380px, 98vw)"
      extra={<Space><Button onClick={() => void saveNewPage(true)}>保存草稿</Button><Button type="primary" onClick={() => void saveNewPage(false)}>创建并发布</Button></Space>} styles={{ body: { padding: 0, background: '#F3F5F8' } }}>
      <div className="page-builder">
        <aside className="builder-palette">
          <div className="builder-panel-title"><div><strong>组件库</strong><span>拖拽组件到手机画布</span></div><Tag color="blue">拖拽创建</Tag></div>
          <Upload.Dragger accept="image/*" multiple showUploadList={false} beforeUpload={(file) => readImage(file, (value) => addBlock('image', value), messageApi.error)} className="slice-uploader">
            <p className="ant-upload-drag-icon"><CloudUploadOutlined /></p><p className="upload-main">上传切图生成页面</p><p className="upload-help">支持多选，每张切图自动生成图片组件</p>
          </Upload.Dragger>
          <Divider titlePlacement="start" plain>基础组件</Divider>
          <div className="palette-grid">{PALETTE.map((item) => <button key={item.type} type="button" draggable className={`palette-item${draggingType === item.type ? ' is-dragging' : ''}`}
            onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData(COMPONENT_DRAG_TYPE, item.type); setDraggingType(item.type); setDraggingId(undefined) }} onDragEnd={finishDrag}
            onClick={() => addBlock(item.type)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.help}</small><em>拖入画布</em></button>)}</div>
        </aside>

        <main className="builder-stage">
          <div className="builder-stage-head"><div><strong>手机实时预览</strong><span>{blocks.length} 个组件</span></div><Space><Tag color="green">自动保存</Tag><Button size="small" icon={<EyeOutlined />}>预览</Button></Space></div>
          <div className="phone-shell">
            <div className="phone-status"><span>9:41</span><span>··· ◉</span></div>
            <div className="phone-nav"><span>‹</span><strong>{builderTitle}</strong><span>•••</span></div>
            <div className={`phone-canvas${dropIndex !== undefined ? ' is-receiving' : ''}`}
              onDragEnter={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDropIndex(blocks.length) }}
              onDragOver={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDropIndex(blocks.length) }}
              onDrop={(event) => dropOnCanvas(event, blocks.length)}>
              <CanvasDropZone index={0} active={dropIndex === 0} onDragOver={setDropIndex} onDrop={dropOnCanvas} />
              {!blocks.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>将左侧组件或本地切图拖到这里<br />开始搭建临时页面</span>} />}
              {blocks.map((block, index) => <Fragment key={block.id}>
                <div className={`phone-block${selectedId === block.id ? ' selected' : ''}${draggingId === block.id ? ' is-dragging' : ''}`} draggable role="group" tabIndex={0} aria-label={`选择并拖动${block.label}`}
                  onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData(BLOCK_DRAG_TYPE, String(block.id)); setDraggingId(block.id); setDraggingType(undefined); setSelectedId(block.id) }} onDragEnd={finishDrag}
                  onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect(); setDropIndex(event.clientY < rect.top + rect.height / 2 ? index : index + 1) }}
                  onDrop={(event) => { const rect = event.currentTarget.getBoundingClientRect(); dropOnCanvas(event, event.clientY < rect.top + rect.height / 2 ? index : index + 1) }}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(block.id); setBuilderTab('component') } }} onClick={() => { setSelectedId(block.id); setBuilderTab('component') }}>
                  <div className="phone-block-label"><span className="drag-grip" aria-hidden="true">⠿</span>{index + 1} · {block.label}</div><PhoneBlock block={block} />
                  {selectedId === block.id && <div className="phone-block-actions"><Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} aria-label="上移组件" onClick={(event) => { event.stopPropagation(); moveBlock(block.id, -1) }} /><Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === blocks.length - 1} aria-label="下移组件" onClick={(event) => { event.stopPropagation(); moveBlock(block.id, 1) }} /><Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label="删除组件" onClick={(event) => { event.stopPropagation(); removeBlock(block.id) }} /></div>}
                </div>
                <CanvasDropZone index={index + 1} active={dropIndex === index + 1} onDragOver={setDropIndex} onDrop={dropOnCanvas} />
              </Fragment>)}
            </div>
          </div>
        </main>

        <aside className="builder-inspector">
          <Tabs activeKey={builderTab} onChange={setBuilderTab} items={[
            { key: 'page', label: '页面设置', children: <Form form={builderForm} layout="vertical">
              <Form.Item label="小程序页面标题" name="title" rules={[{ required: true, message: '请输入页面标题' }]}><Input placeholder="例如：新品发布专题" maxLength={30} showCount /></Form.Item>
              <Form.Item label="页面路径" name="path" rules={[{ required: true, message: '请输入页面路径' }, { pattern: /^\/pages\/temp\/[a-z0-9-]+$/, message: '路径格式：/pages/temp/英文或数字' }]}><Input prefix={<LinkOutlined />} /></Form.Item>
              <Form.Item label="有效期" name="period" rules={[{ required: true, message: '请选择有效期' }]}><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
              <Divider plain>分享卡片</Divider>
              <Form.Item label="分享小程序卡片标题" name="shareTitle"><Input.TextArea rows={3} maxLength={45} showCount placeholder="不填写则使用页面标题" /></Form.Item>
              <Form.Item label="卡片封面图" name="shareCover"><ImageUpload label="分享卡片封面" maxMB={5} /></Form.Item>
              <ShareCard title={builderShareTitle} cover={builderShareCover} />
            </Form> },
            { key: 'component', label: '组件配置', children: selectedBlock ? <BlockInspector block={selectedBlock} update={updateBlock} notify={messageApi.success} fail={messageApi.error} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请在画布中选择组件" /> },
          ]} />
        </aside>
      </div>
    </Drawer>
  </div></>
}

function ShareCard({ title, cover }: { title: string; cover?: string }) {
  return <div className="share-card-preview"><div className="share-card-user"><span className="share-card-avatar">W</span><Typography.Text type="secondary">沃尔玛卖家服务</Typography.Text></div><Typography.Paragraph className="share-card-title" strong ellipsis={{ rows: 2, tooltip: title }}>{title || '分享卡片标题'}</Typography.Paragraph>{cover ? <Image src={cover} alt="分享卡片封面" preview={false} /> : <div className="share-cover-empty"><PictureOutlined /><span>卡片封面预览</span></div>}<div className="share-card-footer"><ShopOutlined /> 小程序</div></div>
}

function CanvasDropZone({ index, active, onDragOver, onDrop }: { index: number; active: boolean; onDragOver: (index: number) => void; onDrop: (event: DragEvent<HTMLDivElement>, index: number) => void }) {
  return <div className={`canvas-drop-zone${active ? ' is-active' : ''}`} aria-hidden="true"
    onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); onDragOver(index) }}
    onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = event.dataTransfer.types.includes(BLOCK_DRAG_TYPE) ? 'move' : 'copy'; onDragOver(index) }}
    onDrop={(event) => onDrop(event, index)}><span>放置到这里</span></div>
}

function BlockInspector({ block, update, notify, fail }: { block: PageBlock; update: (patch: Partial<PageBlock>) => void; notify: (text: string) => void; fail: (text: string) => void }) {
  return <Space orientation="vertical" size={14} style={{ width: '100%' }}>
    <Alert type="info" showIcon title={block.label} description="修改内容后，手机画布会实时更新。" />
    {block.type === 'image' && <div><Typography.Text strong>组件图片</Typography.Text><div style={{ marginTop: 8 }}><ImageUpload value={block.image} onChange={(image) => update({ image })} label="页面切图" maxMB={8} /></div></div>}
    {block.type === 'video' && <><div><Typography.Text strong>视频文件</Typography.Text><div style={{ marginTop: 8 }}><Upload accept="video/mp4,video/quicktime" showUploadList={false} beforeUpload={(file) => { if (file.size > 100 * 1024 * 1024) { fail('视频不能超过 100MB'); return Upload.LIST_IGNORE }; update({ mediaName: file.name, mediaUrl: URL.createObjectURL(file) }); notify('视频已载入'); return Upload.LIST_IGNORE }}><Button icon={<CloudUploadOutlined />}>上传视频</Button></Upload>{block.mediaName && <Tag style={{ marginLeft: 8 }}>{block.mediaName}</Tag>}</div></div><label>视频说明</label><Input value={block.text} onChange={(event) => update({ text: event.target.value })} /></>}
    {block.type === 'banner' && <><div><Typography.Text strong>轮播图片</Typography.Text><Upload accept="image/*" multiple showUploadList={false} beforeUpload={(file) => readImage(file, (value) => update({ images: [...(block.images ?? []), value] }), fail)}><Button icon={<CloudUploadOutlined />} style={{ marginTop: 8 }}>上传轮播图片</Button></Upload></div><div className="banner-thumbs">{block.images?.map((image, index) => <div key={image.slice(-30) + index}><Image src={image} width={76} height={52} style={{ objectFit: 'cover' }} /><Button danger type="text" size="small" icon={<DeleteOutlined />} aria-label="删除轮播图片" onClick={() => update({ images: block.images?.filter((_, itemIndex) => itemIndex !== index) })} /></div>)}</div><Typography.Text type="secondary">建议上传 3–5 张，尺寸 750×320px</Typography.Text></>}
    {block.type === 'text' && <><label>文本内容</label><Input.TextArea rows={6} value={block.text} onChange={(event) => update({ text: event.target.value })} /><Row gutter={12}><Col span={10}><label>字号</label><div className="number-field"><InputNumber min={12} max={32} value={block.fontSize} style={{ width: '100%' }} onChange={(value) => update({ fontSize: value ?? 16 })} /><span>px</span></div></Col><Col span={14}><label>对齐方式</label><Segmented block style={{ marginTop: 8 }} value={block.align} options={[{ label: '左', value: 'left' }, { label: '中', value: 'center' }, { label: '右', value: 'right' }]} onChange={(value) => update({ align: value as PageBlock['align'] })} /></Col></Row></>}
    {block.type === 'hotspot' && <><label>热区文案</label><Input value={block.text} onChange={(event) => update({ text: event.target.value })} /><label>点击跳转页面</label><Input prefix={<LinkOutlined />} value={block.target} onChange={(event) => update({ target: event.target.value })} /><label>热区位置与尺寸（相对画布百分比）</label><Row gutter={[8, 8]}>{[
      ['X', 'hotspotX', block.hotspotX], ['Y', 'hotspotY', block.hotspotY], ['宽度', 'hotspotWidth', block.hotspotWidth], ['高度', 'hotspotHeight', block.hotspotHeight],
    ].map(([label, key, value]) => <Col span={12} key={String(key)}><div className="number-field hotspot-number"><span>{label}</span><InputNumber aria-label={String(label)} min={0} max={100} value={Number(value)} style={{ width: '100%' }} onChange={(next) => update({ [String(key)]: next ?? 0 })} /><span>%</span></div></Col>)}</Row><Alert type="info" showIcon title="位置与尺寸按页面切图宽高的百分比计算，可直接交付小程序渲染。" /></>}
    {block.type === 'subscribe' && <><label>订阅消息模板</label><Select value={block.template} onChange={(template) => update({ template })} options={[{ value: '活动开始提醒' }, { value: '报名成功通知' }, { value: '课程更新提醒' }, { value: '审核进度通知' }]} /><label>引导说明</label><Input.TextArea rows={3} value={block.text} onChange={(event) => update({ text: event.target.value })} /><label>按钮文案</label><Input value={block.buttonText} onChange={(event) => update({ buttonText: event.target.value })} /></>}
  </Space>
}
