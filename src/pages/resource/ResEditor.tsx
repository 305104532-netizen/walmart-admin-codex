import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AppstoreOutlined, BellOutlined, CheckCircleFilled, DeleteOutlined, DragOutlined,
  EyeInvisibleOutlined, HomeOutlined, MenuOutlined, PictureOutlined, PlusOutlined,
  ReadOutlined, SaveOutlined, SearchOutlined, SoundOutlined, UploadOutlined, UserOutlined,
  BlockOutlined, LinkOutlined,
} from '@ant-design/icons'
import {
  Button, Collapse, Divider, Empty, Input, InputNumber, Select, Slider, Space,
  Switch, Tag, Tooltip, Typography, Upload, message,
} from 'antd'
import ImageUpload from '../../components/ImageUpload'
import './ResEditor.css'

type ModuleType = 'search' | 'banner' | 'quickNav' | 'content' | 'custom' | 'notice' | 'activity' | 'course'
type JumpType = 'internal' | 'external' | 'miniProgram'
type SubscriptionConfig = { enabled: boolean; templateName?: string; templateId?: string; popupLimit: number }
type JumpTarget = { jumpType: JumpType; pageTitle?: string; url?: string; pagePath?: string; appId?: string; miniPath?: string; subscription?: SubscriptionConfig }
type BannerItem = JumpTarget & { id: number; image: string; name: string }
type ContentItem = JumpTarget & { id: number; title: string; subtitle: string; icon: string; enabled: boolean }
type HomeModule = {
  id: number; type: ModuleType; name: string; height: number; visible: boolean
  background: string; title?: string; text?: string; image?: string; buttonText?: string
  banners?: BannerItem[]; interval?: number; contentItems?: ContentItem[]; layout?: 'grid' | 'list'; jump?: JumpTarget; subscription?: SubscriptionConfig
}
type NavItem = {
  id: number; name: string; path: string; icon: string; activeIcon?: string; enabled: boolean; subscription?: SubscriptionConfig
}
type ModuleDefinition = {
  type: ModuleType; name: string; description: string; icon: ReactNode; defaultHeight: number
}

const MODULE_LIBRARY: ModuleDefinition[] = [
  { type: 'search', name: '搜索栏', description: '搜索课程、活动与政策', icon: <SearchOutlined />, defaultHeight: 56 },
  { type: 'banner', name: 'Banner 轮播', description: '首页焦点内容轮播', icon: <PictureOutlined />, defaultHeight: 180 },
  { type: 'quickNav', name: '八大金刚', description: '8 个核心业务入口', icon: <AppstoreOutlined />, defaultHeight: 184 },
  { type: 'content', name: '内容配置', description: '配置卡片内容与跳转', icon: <ReadOutlined />, defaultHeight: 240 },
  { type: 'custom', name: '自定义模块', description: '自由配置图片与文案', icon: <BlockOutlined />, defaultHeight: 160 },
  { type: 'notice', name: '公告栏', description: '运营通知与政策提醒', icon: <SoundOutlined />, defaultHeight: 52 },
  { type: 'activity', name: '热门活动', description: '展示近期重点活动', icon: <BellOutlined />, defaultHeight: 210 },
  { type: 'course', name: '成长课程', description: '卖家学习内容推荐', icon: <ReadOutlined />, defaultHeight: 196 },
]
const QUICK_NAV_DEFAULTS: NavItem[] = [
  ['沃要开店', '/pages/register/index'], ['活动中心', '/pages/activity/index'],
  ['成长中心', '/pages/growth/index'], ['卖家大学', '/pages/course/index'],
  ['佣金计算', '/pages/tools/commission'], ['政策中心', '/pages/policy/index'],
  ['招商经理', '/pages/bd/index'], ['更多服务', '/pages/service/index'],
].map(([name, path], index) => ({ id: index + 1, name, path, icon: '', enabled: true }))
const TAB_DEFAULTS: NavItem[] = [
  { id: 1, name: '首页', path: '/pages/home/index', icon: '', activeIcon: '', enabled: true },
  { id: 2, name: '卖家大学', path: '/pages/course/index', icon: '', activeIcon: '', enabled: true },
  { id: 3, name: '活动中心', path: '/pages/activity/index', icon: '', activeIcon: '', enabled: true },
  { id: 4, name: '我的', path: '/pages/mine/index', icon: '', activeIcon: '', enabled: true },
]
const DEFAULT_BANNERS: BannerItem[] = [
  { id: 1, name: '首页主视觉', image: '', jumpType: 'internal', pageTitle: '活动中心', pagePath: '/pages/activity/index' },
  { id: 2, name: '卖家成长专区', image: '', jumpType: 'internal', pageTitle: '成长中心', pagePath: '/pages/growth/index' },
]
const DEFAULT_CONTENT: ContentItem[] = [
  { id: 1, title: '品类洞察', subtitle: '趋势与选品', icon: '', enabled: true, jumpType: 'internal', pageTitle: '品类洞察', pagePath: '/pages/content/category' },
  { id: 2, title: '卖家案例', subtitle: '成功经验', icon: '', enabled: true, jumpType: 'internal', pageTitle: '卖家案例', pagePath: '/pages/content/case' },
  { id: 3, title: '物流方案', subtitle: 'WFS/头程', icon: '', enabled: true, jumpType: 'internal', pageTitle: '物流方案', pagePath: '/pages/content/logistics' },
  { id: 4, title: '运营干货', subtitle: '实战技巧', icon: '', enabled: true, jumpType: 'internal', pageTitle: '运营干货', pagePath: '/pages/content/operation' },
]
const cloneBanners = () => DEFAULT_BANNERS.map((item) => ({ ...item }))
const cloneContent = () => DEFAULT_CONTENT.map((item) => ({ ...item }))
const DEFAULT_MODULES: HomeModule[] = [
  { id: 1, type: 'search', name: '搜索栏', height: 56, visible: true, background: '#ffffff', text: '搜索课程、活动、政策' },
  { id: 2, type: 'banner', name: 'Banner 轮播', height: 180, visible: true, background: '#ffffff', title: '首页焦点图', banners: cloneBanners(), interval: 3 },
  { id: 3, type: 'quickNav', name: '八大金刚', height: 184, visible: true, background: '#ffffff', title: '常用服务' },
  { id: 4, type: 'content', name: '内容配置', height: 240, visible: true, background: '#f5f6f8', title: '精选内容', contentItems: cloneContent(), layout: 'grid' },
  { id: 5, type: 'notice', name: '公告栏', height: 52, visible: true, background: '#fff8e8', text: '沃尔玛 2026 卖家扶持政策已上线' },
  { id: 6, type: 'activity', name: '热门活动', height: 210, visible: true, background: '#ffffff', title: '近期活动' },
  { id: 7, type: 'course', name: '成长课程', height: 196, visible: true, background: '#ffffff', title: '卖家成长课程' },
]
const QUICK_FALLBACKS = ['店', '活', '学', '课', '算', '策', 'BD', '服']
function tabFallback(index: number) {
  if (index === 0) return <HomeOutlined />
  if (index === 1) return <ReadOutlined />
  if (index === 2) return <AppstoreOutlined />
  return <UserOutlined />
}

function IconUploadField({ value, onChange, label }: { value: string; onChange: (next: string) => void; label: string }) {
  const readFile = (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      message.error('请上传 PNG、JPG、WEBP 或 SVG 格式图标')
      return Upload.LIST_IGNORE
    }
    if (file.size > 1024 * 1024) {
      message.error('图标大小不能超过 1 MB')
      return Upload.LIST_IGNORE
    }
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result || ''))
    reader.onerror = () => message.error('图标读取失败，请重新上传')
    reader.readAsDataURL(file)
    return Upload.LIST_IGNORE
  }
  return <div className="mini-icon-upload">
    <div className="mini-icon-preview">{value ? <img src={value} alt={`${label}预览`} /> : <PictureOutlined />}</div>
    <Space size={6} wrap>
      <Upload accept=".png,.jpg,.jpeg,.webp,.svg" showUploadList={false} beforeUpload={(file) => readFile(file)}>
        <Button size="small" icon={<UploadOutlined />}>{value ? '替换图标' : '上传图标'}</Button>
      </Upload>
      {value && <Button size="small" type="text" danger onClick={() => onChange('')}>删除</Button>}
    </Space>
  </div>
}

function QuickIcon({ item, index }: { item: NavItem; index: number }) {
  return item.icon ? <img src={item.icon} alt="" /> : <span>{QUICK_FALLBACKS[index] || '服'}</span>
}

function JumpTargetFields({ target, onChange }: { target: JumpTarget; onChange: (patch: Partial<JumpTarget>) => void }) {
  return <Space orientation="vertical" size={10} style={{ width: '100%' }}>
    <div><label>跳转类型</label><Select value={target.jumpType} style={{ width: '100%' }} onChange={(jumpType) => onChange({ jumpType })} options={[
      { value: 'internal', label: '小程序内部页面' },
      { value: 'external', label: '外部链接' },
      { value: 'miniProgram', label: '外部小程序' },
    ]} /></div>
    {target.jumpType === 'internal' && <>
      <div><label>小程序页面标题</label><Input value={target.pageTitle} placeholder="例如：活动中心" maxLength={20} showCount onChange={(event) => onChange({ pageTitle: event.target.value })} /></div>
      <div><label>小程序页面路径</label><Input value={target.pagePath} placeholder="例如：/pages/activity/index" onChange={(event) => onChange({ pagePath: event.target.value })} /></div>
    </>}
    {target.jumpType === 'external' && <div><label>外部链接</label><Input value={target.url} placeholder="https://" onChange={(event) => onChange({ url: event.target.value })} /></div>}
    {target.jumpType === 'miniProgram' && <>
      <div><label>外部小程序 AppID</label><Input value={target.appId} placeholder="wx..." onChange={(event) => onChange({ appId: event.target.value })} /></div>
      <div><label>外部小程序页面路径</label><Input value={target.miniPath} placeholder="pages/index/index" onChange={(event) => onChange({ miniPath: event.target.value })} /></div>
    </>}
  </Space>
}

function SubscriptionFields({ value, onChange, triggerLabel = '点击此元素时' }: { value?: SubscriptionConfig; onChange: (next: SubscriptionConfig) => void; triggerLabel?: string }) {
  const current = value || { enabled: false, popupLimit: 1 }
  return <div className={`subscription-config${current.enabled ? ' enabled' : ''}`}>
    <div className="subscription-head">
      <span><BellOutlined /><b>小程序订阅消息</b><em>{triggerLabel}</em></span>
      <Switch size="small" checked={current.enabled} checkedChildren="启用" unCheckedChildren="关闭" onChange={(enabled) => onChange({ ...current, enabled })} />
    </div>
    {current.enabled && <Space orientation="vertical" size={10} className="subscription-fields">
      <div><label>订阅消息模板名称</label><Input value={current.templateName} placeholder="例如：活动开始提醒" maxLength={30} showCount onChange={(event) => onChange({ ...current, templateName: event.target.value })} /></div>
      <div><label>订阅消息模板 ID</label><Input value={current.templateId} placeholder="填写微信公众平台模板 ID" onChange={(event) => onChange({ ...current, templateId: event.target.value })} /></div>
      <div><label>订阅消息弹出次数</label><Space.Compact block><InputNumber min={1} max={99} value={current.popupLimit} onChange={(popupLimit) => onChange({ ...current, popupLimit: popupLimit || 1 })} style={{ width: '100%' }} /><Button disabled>次/用户</Button></Space.Compact></div>
      <Typography.Text type="secondary">达到设置次数后，不再向同一用户弹出订阅授权。</Typography.Text>
    </Space>}
  </div>
}

function BannerPreview({ module }: { module: HomeModule }) {
  const banners = module.banners || []
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (banners.length < 2) return
    const timer = window.setInterval(() => setActive((index) => (index + 1) % banners.length), Math.max(1, module.interval || 3) * 1000)
    return () => window.clearInterval(timer)
  }, [banners.length, module.interval])
  const safeActive = active % Math.max(1, banners.length)
  const current = banners[safeActive]
  return <div className="preview-banner" style={current?.image ? { backgroundImage: `url(${current.image})` } : undefined}>
    {!current?.image && <><b>{current?.name || 'Walmart Marketplace'}</b><span>连接全球增长新机会</span></>}
    <div className="preview-dots">{banners.map((item, index) => <i key={item.id} className={index === safeActive ? 'active' : ''} />)}</div>
  </div>
}

function ModulePreview({ module, quickNav }: { module: HomeModule; quickNav: NavItem[] }) {
  const style = { height: Math.max(42, Math.round(module.height * .68)), background: module.background }
  if (module.type === 'search') return <div className="preview-search" style={style}><SearchOutlined /><span>{module.text}</span></div>
  if (module.type === 'banner') return <div className="preview-banner-wrap" style={style}><BannerPreview module={module} /></div>
  if (module.type === 'quickNav') return <div className="preview-quick-nav" style={style}>
    {quickNav.filter((item) => item.enabled).map((item, index) => <div key={item.id} className="preview-quick-item">
      <div className="preview-quick-icon"><QuickIcon item={item} index={index} /></div><span>{item.name}</span>
    </div>)}
  </div>
  if (module.type === 'content') return <div className={`preview-config-content ${module.layout || 'grid'}`} style={style}>
    {module.title && <div className="preview-section-title"><b>{module.title}</b><span>更多 ›</span></div>}
    <div className="preview-config-grid">{(module.contentItems || []).filter((item) => item.enabled).map((item) => <div className="preview-config-card" key={item.id}>
      <i>{item.icon ? <img src={item.icon} alt="" /> : <LinkOutlined />}</i><p><b>{item.title}</b><span>{item.subtitle}</span></p><em>›</em>
    </div>)}</div>
  </div>
  if (module.type === 'custom') return <div className="preview-custom-module" style={{ ...style, backgroundImage: module.image ? `linear-gradient(90deg,rgba(11,87,208,.9),rgba(79,70,229,.72)),url(${module.image})` : undefined }}>
    <div><b>{module.title || '自定义模块标题'}</b><span>{module.text || '添加模块说明文案'}</span></div><em>{module.buttonText || '查看详情'} ›</em>
  </div>
  if (module.type === 'notice') return <div className="preview-notice" style={style}><SoundOutlined /><span>{module.text}</span><b>›</b></div>
  if (module.type === 'activity') return <div className="preview-content-section" style={style}>
    <div className="preview-section-title"><b>{module.title}</b><span>更多 ›</span></div>
    {['跨境电商增长峰会', '沃尔玛新卖家训练营'].map((title, index) => <div className="preview-activity-card" key={title}>
      <div /><p><b>{title}</b><span>{index ? '线上直播 · 10月12日' : '上海 · 09月28日'}</span>{!index && <em>报名中</em>}</p>
    </div>)}
  </div>
  return <div className="preview-content-section" style={style}>
    <div className="preview-section-title"><b>{module.title}</b><span>更多 ›</span></div>
    <div className="preview-course-row">{[1, 2, 3].map((item) => <div key={item}><i /><span>出海实战课程 {item}</span></div>)}</div>
  </div>
}

export default function ResEditor() {
  const [modules, setModules] = useState<HomeModule[]>(DEFAULT_MODULES)
  const [quickNav, setQuickNav] = useState<NavItem[]>(QUICK_NAV_DEFAULTS)
  const [tabs, setTabs] = useState<NavItem[]>(TAB_DEFAULTS)
  const [tabHeight, setTabHeight] = useState(68)
  const [tabVisible, setTabVisible] = useState(true)
  const [selected, setSelected] = useState('module:2')
  const [saved, setSaved] = useState(true)
  const dragType = useRef<ModuleType | null>(null)
  const dragIndex = useRef<number | null>(null)
  const nextId = useRef(20)

  const selectedModule = useMemo(() => selected.startsWith('module:')
    ? modules.find((item) => item.id === Number(selected.replace('module:', ''))) : undefined, [modules, selected])
  const touch = () => setSaved(false)
  const updateModule = (patch: Partial<HomeModule>) => {
    if (!selectedModule) return
    setModules((items) => items.map((item) => item.id === selectedModule.id ? { ...item, ...patch } : item)); touch()
  }
  const updateQuick = (id: number, patch: Partial<NavItem>) => {
    setQuickNav((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item)); touch()
  }
  const updateTab = (id: number, patch: Partial<NavItem>) => {
    setTabs((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item)); touch()
  }
  const updateBanner = (id: number, patch: Partial<BannerItem>) => {
    if (!selectedModule) return
    updateModule({ banners: (selectedModule.banners || []).map((item) => item.id === id ? { ...item, ...patch } : item) })
  }
  const updateContent = (id: number, patch: Partial<ContentItem>) => {
    if (!selectedModule) return
    updateModule({ contentItems: (selectedModule.contentItems || []).map((item) => item.id === id ? { ...item, ...patch } : item) })
  }
  const addModule = (type: ModuleType, at = modules.length) => {
    const definition = MODULE_LIBRARY.find((item) => item.type === type)!
    const item: HomeModule = {
      id: ++nextId.current, type, name: definition.name, height: definition.defaultHeight,
      visible: true, background: type === 'notice' ? '#fff8e8' : '#ffffff', title: definition.name,
      text: type === 'search' ? '搜索课程、活动、政策' : type === 'notice' ? '请输入公告内容' : '',
      ...(type === 'banner' ? { banners: cloneBanners(), interval: 3 } : {}),
      ...(type === 'content' ? { contentItems: cloneContent(), layout: 'grid' as const, background: '#f5f6f8' } : {}),
      ...(type === 'custom' ? { title: '自定义模块标题', text: '添加模块说明文案', buttonText: '查看详情', jump: { jumpType: 'internal' as const, pageTitle: '小程序首页', pagePath: '/pages/index/index' } } : {}),
    }
    setModules((items) => { const next = [...items]; next.splice(at, 0, item); return next })
    setSelected(`module:${item.id}`); touch()
  }
  const dropAt = (target: number) => {
    if (dragType.current) { addModule(dragType.current, target); dragType.current = null; return }
    if (dragIndex.current === null) return
    const source = dragIndex.current
    setModules((items) => {
      const next = [...items]; const [moved] = next.splice(source, 1)
      next.splice(source < target ? target - 1 : target, 0, moved); return next
    })
    dragIndex.current = null; touch()
  }
  const removeModule = (id: number) => {
    setModules((items) => items.filter((item) => item.id !== id))
    if (selected === `module:${id}`) setSelected('tabbar')
    touch()
  }
  const save = (publish: boolean) => { setSaved(true); message.success(publish ? '首页配置已发布' : '草稿已保存') }

  const heightEditor = (height: number, onChange: (value: number) => void, min = 40, max = 500) => <div className="height-editor">
    <div className="editor-field-head"><label>模块高度</label><Typography.Text type="secondary">小程序实际像素</Typography.Text></div>
    <Space.Compact block><InputNumber min={min} max={max} value={height} onChange={(value) => onChange(value || min)} style={{ width: '100%' }} /><Button disabled>px</Button></Space.Compact>
    <Slider min={min} max={max} value={height} onChange={onChange} tooltip={{ formatter: (value) => `${value}px` }} />
  </div>

  const quickItems = quickNav.map((item, index) => ({
    key: item.id,
    label: <Space><span className="collapse-icon-dot"><QuickIcon item={item} index={index} /></span><span>{index + 1}. {item.name || '未命名入口'}</span></Space>,
    extra: <Tag color={item.enabled ? 'blue' : 'default'}>{item.enabled ? '展示' : '隐藏'}</Tag>,
    children: <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <div><label>入口名称</label><Input value={item.name} maxLength={8} showCount onChange={(event) => updateQuick(item.id, { name: event.target.value })} /></div>
      <div><label>跳转页面</label><Input value={item.path} onChange={(event) => updateQuick(item.id, { path: event.target.value })} /></div>
      <div><label>入口图标</label><IconUploadField value={item.icon} label={`${item.name}图标`} onChange={(icon) => updateQuick(item.id, { icon })} /></div>
      <SubscriptionFields value={item.subscription} triggerLabel="点击此入口时" onChange={(subscription) => updateQuick(item.id, { subscription })} />
      <div className="switch-field"><label>展示入口</label><Switch checked={item.enabled} onChange={(enabled) => updateQuick(item.id, { enabled })} /></div>
    </Space>,
  }))
  const tabItems = tabs.map((item, index) => ({
    key: item.id,
    label: <Space><span className="collapse-icon-dot">{item.icon ? <img src={item.icon} alt="" /> : tabFallback(index)}</span><span>{item.name || '未命名菜单'}</span></Space>,
    extra: <Tag color={item.enabled ? 'green' : 'default'}>{item.enabled ? '展示' : '隐藏'}</Tag>,
    children: <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <div><label>菜单名称</label><Input value={item.name} maxLength={6} showCount onChange={(event) => updateTab(item.id, { name: event.target.value })} /></div>
      <div><label>页面路径</label><Input value={item.path} onChange={(event) => updateTab(item.id, { path: event.target.value })} /></div>
      <div><label>默认图标</label><IconUploadField value={item.icon} label={`${item.name}默认图标`} onChange={(icon) => updateTab(item.id, { icon })} /></div>
      <div><label>选中图标</label><IconUploadField value={item.activeIcon || ''} label={`${item.name}选中图标`} onChange={(activeIcon) => updateTab(item.id, { activeIcon })} /></div>
      <SubscriptionFields value={item.subscription} triggerLabel="点击此菜单时" onChange={(subscription) => updateTab(item.id, { subscription })} />
      <div className="switch-field"><label>展示菜单</label><Switch checked={item.enabled} onChange={(enabled) => updateTab(item.id, { enabled })} /></div>
    </Space>,
  }))
  const bannerItems = (selectedModule?.banners || []).map((item, index) => ({
    key: item.id,
    label: <Space><PictureOutlined /><span>{index + 1}. {item.name || '未命名轮播图'}</span></Space>,
    extra: <Tag>{item.jumpType === 'internal' ? '内部页面' : item.jumpType === 'external' ? '外部链接' : '外部小程序'}</Tag>,
    children: <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <div><label>轮播图名称</label><Input value={item.name} maxLength={20} showCount onChange={(event) => updateBanner(item.id, { name: event.target.value })} /></div>
      <div><label>轮播图片</label><ImageUpload value={item.image} label={`第 ${index + 1} 张轮播图片`} maxMB={5} onChange={(image) => updateBanner(item.id, { image })} /></div>
      <JumpTargetFields target={item} onChange={(patch) => updateBanner(item.id, patch)} />
      <SubscriptionFields value={item.subscription} triggerLabel="点击该 Banner 图片时" onChange={(subscription) => updateBanner(item.id, { subscription })} />
      {(selectedModule?.banners?.length || 0) > 1 && <Button danger block icon={<DeleteOutlined />} onClick={() => updateModule({ banners: selectedModule?.banners?.filter((banner) => banner.id !== item.id) })}>删除此轮播图</Button>}
    </Space>,
  }))
  const contentItems = (selectedModule?.contentItems || []).map((item, index) => ({
    key: item.id,
    label: <Space><span className="collapse-icon-dot">{item.icon ? <img src={item.icon} alt="" /> : <LinkOutlined />}</span><span>{index + 1}. {item.title || '未命名内容'}</span></Space>,
    extra: <Tag color={item.enabled ? 'blue' : 'default'}>{item.enabled ? '展示' : '隐藏'}</Tag>,
    children: <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <div><label>内容标题</label><Input value={item.title} maxLength={8} showCount onChange={(event) => updateContent(item.id, { title: event.target.value })} /></div>
      <div><label>辅助说明</label><Input value={item.subtitle} maxLength={10} showCount onChange={(event) => updateContent(item.id, { subtitle: event.target.value })} /></div>
      <div><label>内容图标</label><IconUploadField value={item.icon} label={`${item.title}图标`} onChange={(icon) => updateContent(item.id, { icon })} /></div>
      <JumpTargetFields target={item} onChange={(patch) => updateContent(item.id, patch)} />
      <SubscriptionFields value={item.subscription} triggerLabel="点击此内容卡片时" onChange={(subscription) => updateContent(item.id, { subscription })} />
      <div className="switch-field"><label>展示此内容</label><Switch checked={item.enabled} onChange={(enabled) => updateContent(item.id, { enabled })} /></div>
      <Button danger block icon={<DeleteOutlined />} onClick={() => updateModule({ contentItems: selectedModule?.contentItems?.filter((content) => content.id !== item.id) })}>删除此内容</Button>
    </Space>,
  }))

  return <div className="mini-home-page">
    <div className="mini-home-header">
      <div><Space align="center"><Typography.Title level={4}>小程序首页编辑器</Typography.Title><Tag color="blue">首页</Tag></Space>
        <Typography.Text type="secondary">像开发者工具一样搭建首页，拖拽排序并实时查看小程序效果</Typography.Text></div>
      <Space wrap>
        <span className={saved ? 'save-state saved' : 'save-state'}>{saved ? <CheckCircleFilled /> : '●'} {saved ? '已保存' : '有未保存修改'}</span>
        <Button icon={<SaveOutlined />} onClick={() => save(false)}>保存草稿</Button><Button type="primary" onClick={() => save(true)}>保存并发布</Button>
      </Space>
    </div>

    <div className="mini-home-editor">
      <aside className="mini-editor-panel mini-library-panel">
        <div className="panel-heading"><div><b>首页组件</b><span>拖入中间画布，或点击添加</span></div><Tag>{MODULE_LIBRARY.length} 种</Tag></div>
        <div className="module-library">{MODULE_LIBRARY.map((item) => <button key={item.type} type="button" className="module-library-item" draggable
          onDragStart={() => { dragType.current = item.type; dragIndex.current = null }} onClick={() => addModule(item.type)}>
          <span className="module-library-icon">{item.icon}</span><span><b>{item.name}</b><small>{item.description}</small></span><PlusOutlined className="module-add-icon" />
        </button>)}</div>
        <Divider />
        <div className="panel-heading compact"><div><b>页面固定区域</b><span>不参与内容流排序</span></div></div>
        <button type="button" className={`fixed-area-item${selected === 'tabbar' ? ' selected' : ''}`} onClick={() => setSelected('tabbar')}>
          <span className="module-library-icon"><MenuOutlined /></span><span><b>底部菜单</b><small>{tabs.filter((item) => item.enabled).length} 个菜单 · {tabHeight}px</small></span>
        </button>
        <Divider />
        <div className="panel-heading compact"><div><b>页面结构</b><span>点击定位并编辑模块</span></div></div>
        <div className="module-outline">{modules.map((item, index) => <button key={item.id} type="button" className={selected === `module:${item.id}` ? 'selected' : ''} onClick={() => setSelected(`module:${item.id}`)}>
          <span>{index + 1}</span><b>{item.name}</b><small>{item.height}px</small>{!item.visible && <EyeInvisibleOutlined />}
        </button>)}</div>
      </aside>

      <section className="mini-canvas-stage">
        <div className="canvas-toolbar"><div><b>实时预览</b><span>蓝色边框表示当前编辑模块</span></div></div>
        <div className="mini-phone">
          <div className="mini-phone-status"><span>9:41</span><b>沃尔玛卖家服务中心</b><span>••• ◉</span></div>
          <div className="mini-phone-page" onDragOver={(event) => event.preventDefault()} onDrop={() => dropAt(modules.length)}>
            {!modules.length && <Empty description="从左侧添加首页组件" />}
            {modules.map((module, index) => <div key={module.id}>
              <div className="module-drop-line" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); dropAt(index) }}><span>放置到这里</span></div>
              <div className={`mini-preview-module${selected === `module:${module.id}` ? ' selected' : ''}${module.visible ? '' : ' hidden-module'}`}
                draggable onDragStart={() => { dragIndex.current = index; dragType.current = null }} onClick={() => setSelected(`module:${module.id}`)}>
                <div className="preview-module-toolbar"><span><DragOutlined /> {module.name}</span><em>{module.height}px</em>
                  <Tooltip title="删除模块"><Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={(event) => { event.stopPropagation(); removeModule(module.id) }} /></Tooltip>
                </div>
                {module.visible ? <ModulePreview module={module} quickNav={quickNav} /> : <div className="hidden-module-tip"><EyeInvisibleOutlined /> 当前模块已隐藏</div>}
              </div>
            </div>)}
            <div className="module-drop-line last" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); dropAt(modules.length) }}><span>放置到页面底部</span></div>
          </div>
          {tabVisible && <button type="button" className={`mini-tabbar${selected === 'tabbar' ? ' selected' : ''}`} style={{ height: Math.max(48, Math.round(tabHeight * .78)) }} onClick={() => setSelected('tabbar')}>
            {tabs.filter((item) => item.enabled).map((item, index) => <span key={item.id} className={index === 0 ? 'active' : ''}>
              <i>{(index === 0 ? item.activeIcon : item.icon) ? <img src={(index === 0 ? item.activeIcon : item.icon) || item.icon} alt="" /> : tabFallback(index)}</i><em>{item.name}</em>
            </span>)}
          </button>}
        </div>
        <Typography.Text type="secondary" className="canvas-hint"><DragOutlined /> 拖动页面模块调整顺序；预览按比例显示，保存值为小程序实际像素。</Typography.Text>
      </section>

      <aside className="mini-editor-panel mini-inspector-panel">
        {selectedModule ? <>
          <div className="panel-heading"><div><b>{selectedModule.name}设置</b><span>模块 #{modules.findIndex((item) => item.id === selectedModule.id) + 1}</span></div>
            <Switch checked={selectedModule.visible} checkedChildren="展示" unCheckedChildren="隐藏" onChange={(visible) => updateModule({ visible })} /></div>
          <Divider />
          {heightEditor(selectedModule.height, (height) => updateModule({ height }))}
          {selectedModule.type === 'search' && <div className="inspector-field"><label>搜索提示文案</label><Input value={selectedModule.text} maxLength={20} showCount onChange={(event) => updateModule({ text: event.target.value })} /></div>}
          {selectedModule.type === 'notice' && <div className="inspector-field"><label>公告内容</label><Input.TextArea value={selectedModule.text} maxLength={40} showCount autoSize={{ minRows: 2, maxRows: 4 }} onChange={(event) => updateModule({ text: event.target.value })} /></div>}
          {['activity', 'course'].includes(selectedModule.type) && <div className="inspector-field"><label>模块标题</label><Input value={selectedModule.title} maxLength={12} showCount onChange={(event) => updateModule({ title: event.target.value })} /></div>}
          {['search', 'notice', 'activity', 'course'].includes(selectedModule.type) && <><Divider>点击订阅消息</Divider><SubscriptionFields value={selectedModule.subscription} triggerLabel="点击此组件内容时" onChange={(subscription) => updateModule({ subscription })} /></>}
          {selectedModule.type === 'banner' && <>
            <Divider>轮播设置</Divider>
            <div className="inspector-field"><label>轮播间隔</label><Space.Compact block><InputNumber min={1} max={30} value={selectedModule.interval || 3} onChange={(interval) => updateModule({ interval: interval || 3 })} style={{ width: '100%' }} /><Button disabled>秒</Button></Space.Compact></div>
            <div className="inspector-tip"><PictureOutlined /><span>每张图片可分别跳转到外部链接、小程序内部页面或外部小程序，最多添加 10 张。</span></div>
            <Collapse size="small" accordion defaultActiveKey={[selectedModule.banners?.[0]?.id || 1]} items={bannerItems} className="config-collapse" />
            {(selectedModule.banners?.length || 0) < 10 && <Button block icon={<PlusOutlined />} onClick={() => { const id = Math.max(0, ...(selectedModule.banners || []).map((item) => item.id)) + 1; updateModule({ banners: [...(selectedModule.banners || []), { id, name: `轮播图 ${id}`, image: '', jumpType: 'internal', pageTitle: '小程序首页', pagePath: '/pages/index/index' }] }) }}>添加轮播图</Button>}
          </>}
          {selectedModule.type === 'quickNav' && <><Divider>八大金刚入口</Divider><div className="inspector-tip"><AppstoreOutlined /><span>系统预置 8 个入口，可逐个修改名称、跳转页面与图标。</span></div><Collapse size="small" accordion items={quickItems} className="config-collapse" /></>}
          {selectedModule.type === 'content' && <>
            <div className="inspector-field"><label>模块标题</label><Input value={selectedModule.title} maxLength={12} showCount onChange={(event) => updateModule({ title: event.target.value })} /></div>
            <div className="inspector-field"><label>内容布局</label><Select value={selectedModule.layout || 'grid'} style={{ width: '100%' }} onChange={(layout) => updateModule({ layout })} options={[{ value: 'grid', label: '双列卡片' }, { value: 'list', label: '单列列表' }]} /></div>
            <Divider>内容卡片</Divider>
            <div className="inspector-tip"><ReadOutlined /><span>配置内容标题、说明、图标和跳转目标，可按需控制单项展示。</span></div>
            <Collapse size="small" accordion items={contentItems} className="config-collapse" />
            {(selectedModule.contentItems?.length || 0) < 8 && <Button block icon={<PlusOutlined />} onClick={() => { const id = Math.max(0, ...(selectedModule.contentItems || []).map((item) => item.id)) + 1; updateModule({ contentItems: [...(selectedModule.contentItems || []), { id, title: '新内容', subtitle: '内容说明', icon: '', enabled: true, jumpType: 'internal', pageTitle: '小程序首页', pagePath: '/pages/index/index' }] }) }}>添加内容卡片</Button>}
          </>}
          {selectedModule.type === 'custom' && <>
            <div className="inspector-field"><label>模块标题</label><Input value={selectedModule.title} maxLength={18} showCount onChange={(event) => updateModule({ title: event.target.value })} /></div>
            <div className="inspector-field"><label>说明文案</label><Input.TextArea value={selectedModule.text} maxLength={40} showCount autoSize={{ minRows: 2, maxRows: 4 }} onChange={(event) => updateModule({ text: event.target.value })} /></div>
            <div className="inspector-field"><label>按钮文案</label><Input value={selectedModule.buttonText} maxLength={8} showCount onChange={(event) => updateModule({ buttonText: event.target.value })} /></div>
            <div className="inspector-field"><label>模块图片</label><ImageUpload value={selectedModule.image} label="自定义模块图片" maxMB={5} onChange={(image) => updateModule({ image })} /></div>
            <Divider>点击跳转</Divider><JumpTargetFields target={selectedModule.jump || { jumpType: 'internal', pageTitle: '小程序首页', pagePath: '/pages/index/index' }} onChange={(patch) => updateModule({ jump: { ...(selectedModule.jump || { jumpType: 'internal', pageTitle: '小程序首页' }), ...patch } })} />
            <SubscriptionFields value={selectedModule.jump?.subscription} triggerLabel="点击模块按钮时" onChange={(subscription) => updateModule({ jump: { ...(selectedModule.jump || { jumpType: 'internal', pageTitle: '小程序首页' }), subscription } })} />
          </>}
        </> : selected === 'tabbar' ? <>
          <div className="panel-heading"><div><b>底部菜单设置</b><span>固定显示在小程序页面底部</span></div>
            <Switch checked={tabVisible} checkedChildren="展示" unCheckedChildren="隐藏" onChange={(visible) => { setTabVisible(visible); touch() }} /></div>
          <Divider />
          {heightEditor(tabHeight, (height) => { setTabHeight(height); touch() }, 48, 120)}
          <Divider>菜单与图标</Divider><div className="inspector-tip"><MenuOutlined /><span>支持 2–5 个菜单，每项分别配置默认图标、选中图标和页面路径。</span></div>
          <Collapse size="small" accordion defaultActiveKey={[1]} items={tabItems} className="config-collapse" />
          {tabs.length < 5 && <Button block icon={<PlusOutlined />} onClick={() => { const id = Math.max(...tabs.map((item) => item.id)) + 1; setTabs((items) => [...items, { id, name: '新菜单', path: '/pages/index', icon: '', activeIcon: '', enabled: true }]); touch() }}>新增菜单</Button>}
        </> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请在画布中选择一个模块" />}
      </aside>
    </div>
  </div>
}
