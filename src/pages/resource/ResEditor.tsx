import { useState, useRef } from 'react'
import { Card, Row, Col, Button, Space, Modal, Form, Input, message, Empty, Tag, Segmented } from 'antd'
import {
  PictureOutlined, AppstoreOutlined, SoundOutlined, ReadOutlined, CalendarOutlined,
  FileTextOutlined, DeleteOutlined, EditOutlined, DragOutlined, MobileOutlined,
} from '@ant-design/icons'

// ===== 组件库（可拖入画布的物料） =====
interface BlockType { type: string; label: string; icon: React.ReactNode }
const PALETTE: BlockType[] = [
  { type: 'banner', label: '轮播图', icon: <PictureOutlined /> },
  { type: 'nav', label: '金刚位导航', icon: <AppstoreOutlined /> },
  { type: 'notice', label: '公告栏', icon: <SoundOutlined /> },
  { type: 'course', label: '课程推荐', icon: <ReadOutlined /> },
  { type: 'activity', label: '活动列表', icon: <CalendarOutlined /> },
  { type: 'news', label: '资讯列表', icon: <FileTextOutlined /> },
  { type: 'search', label: '搜索框', icon: <FileTextOutlined /> },
  { type: 'notice-bar', label: '通知条', icon: <SoundOutlined /> },
]

interface Block {
  id: number
  type: string
  label: string
  props: Record<string, string>
}

let uid = 100

// 默认属性
function defaultProps(type: string): Record<string, string> {
  switch (type) {
    case 'banner': return { title: '首页轮播', count: '3', height: '160' }
    case 'nav': return { title: '金刚位', cols: '4', count: '8' }
    case 'notice': return { title: '公告栏', text: '沃尔玛2026卖家扶持政策已上线' }
    case 'course': return { title: '课程推荐', count: '3' }
    case 'activity': return { title: '近期活动', count: '2' }
    case 'news': return { title: '资讯', count: '3' }
    case 'search': return { placeholder: '搜索课程、活动、政策' }
    case 'notice-bar': return { text: '欢迎入驻沃尔玛全球电商' }
    default: return {}
  }
}

// ===== 手机预览：把区块渲染成小程序视觉 =====
function PhoneBlock({ block }: { block: Block }) {
  const p = block.props
  switch (block.type) {
    case 'search':
      return (
        <div style={{ padding: '8px 12px' }}>
          <div style={{ background: '#F3F4F6', borderRadius: 16, padding: '7px 14px', color: '#9CA3AF', fontSize: 12 }}>🔍 {p.placeholder}</div>
        </div>
      )
    case 'notice-bar':
      return (
        <div style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, padding: '6px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
          📢 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.text}</span>
        </div>
      )
    case 'banner':
      return (
        <div style={{ padding: 10 }}>
          <div style={{ height: Number(p.height || 140) * 0.7, background: 'linear-gradient(135deg,#1A56DB,#3B82F6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, position: 'relative' }}>
            Banner 轮播图
            <div style={{ position: 'absolute', bottom: 8, display: 'flex', gap: 4 }}>
              {Array.from({ length: Number(p.count || 3) }).map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i === 0 ? '#fff' : 'rgba(255,255,255,.5)' }} />
              ))}
            </div>
          </div>
        </div>
      )
    case 'nav': {
      const cols = Number(p.cols || 4)
      const count = Number(p.count || 8)
      const names = ['沃要开店', '活动中心', '成长中心', 'AI助手', '佣金计算', '卖家大学', '敬请期待', '敬请期待']
      return (
        <div style={{ padding: 10, background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A56DB', fontSize: 14 }}>◈</div>
                <span style={{ fontSize: 9, color: '#374151' }}>{names[i % names.length]}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'notice':
      return (
        <div style={{ margin: 10, background: '#EFF6FF', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#1E40AF', display: 'flex', gap: 6 }}>
          📣 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.text}</span>
        </div>
      )
    case 'course':
      return (
        <div style={{ padding: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{p.title}</div>
          <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
            {Array.from({ length: Number(p.count || 3) }).map((_, i) => (
              <div key={i} style={{ flex: '0 0 88px' }}>
                <div style={{ height: 54, background: '#E5E7EB', borderRadius: 8 }} />
                <div style={{ fontSize: 9, marginTop: 4, color: '#374151' }}>课程标题{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'activity':
      return (
        <div style={{ padding: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{p.title}</div>
          {Array.from({ length: Number(p.count || 2) }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 64, height: 44, background: '#E5E7EB', borderRadius: 6 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 500 }}>活动标题 {i + 1}</div>
                <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>2026-07-20 · 线上</div>
                <span style={{ fontSize: 8, color: '#059669' }}>报名中</span>
              </div>
            </div>
          ))}
        </div>
      )
    case 'news':
      return (
        <div style={{ padding: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{p.title}</div>
          {Array.from({ length: Number(p.count || 3) }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 10, color: '#374151' }}>资讯标题 {i + 1}······</span>
              <span style={{ fontSize: 8, color: '#9CA3AF' }}>{i + 1}天前</span>
            </div>
          ))}
        </div>
      )
    default:
      return <div style={{ padding: 12, textAlign: 'center', color: '#9CA3AF' }}>{block.label}</div>
  }
}

export default function ResEditor() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, type: 'banner', label: '轮播图', props: defaultProps('banner') },
    { id: 2, type: 'nav', label: '金刚位导航', props: defaultProps('nav') },
    { id: 3, type: 'notice', label: '公告栏', props: defaultProps('notice') },
    { id: 4, type: 'course', label: '课程推荐', props: defaultProps('course') },
  ])
  const [selected, setSelected] = useState<number | null>(null)
  const [editBlock, setEditBlock] = useState<Block | null>(null)
  const [device, setDevice] = useState<string>('iPhone')
  const [form] = Form.useForm()

  const dragType = useRef<string | null>(null)   // 从物料拖入的类型
  const dragIndex = useRef<number | null>(null)   // 画布内部拖拽排序的起始索引

  // 物料拖动开始
  const onPaletteDragStart = (type: string) => { dragType.current = type; dragIndex.current = null }
  // 画布区块拖动开始
  const onBlockDragStart = (idx: number) => { dragIndex.current = idx; dragType.current = null }

  // 放到某位置
  const onDropAt = (targetIdx: number) => {
    if (dragType.current) {
      const t = PALETTE.find((x) => x.type === dragType.current)!
      const nb: Block = { id: ++uid, type: t.type, label: t.label, props: defaultProps(t.type) }
      setBlocks((bs) => { const next = [...bs]; next.splice(targetIdx, 0, nb); return next })
      dragType.current = null
    } else if (dragIndex.current !== null) {
      const from = dragIndex.current
      setBlocks((bs) => {
        const next = [...bs]
        const [moved] = next.splice(from, 1)
        next.splice(from < targetIdx ? targetIdx - 1 : targetIdx, 0, moved)
        return next
      })
      dragIndex.current = null
    }
  }

  const onDropCanvasEnd = () => onDropAt(blocks.length)

  const remove = (id: number) => { setBlocks((bs) => bs.filter((b) => b.id !== id)); if (selected === id) setSelected(null) }

  const openEdit = (b: Block) => { setEditBlock(b); form.setFieldsValue(b.props) }
  const saveEdit = () => {
    const vals = form.getFieldsValue()
    setBlocks((bs) => bs.map((b) => (b.id === editBlock!.id ? { ...b, props: { ...b.props, ...vals } } : b)))
    setEditBlock(null); message.success('区块已更新')
  }

  const phoneWidth = device === 'iPhone' ? 300 : 320

  return (
    <div>
      <Row gutter={16}>
        {/* 左：组件库 */}
        <Col span={5}>
          <Card title="组件库" size="small" styles={{ body: { padding: 12 } }}>
            <div style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 10 }}>拖拽组件到中间画布</div>
            {PALETTE.map((p) => (
              <div key={p.type} draggable onDragStart={() => onPaletteDragStart(p.type)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 8, border: '1px dashed #D1D5DB', borderRadius: 8, cursor: 'grab', background: '#fff', fontSize: 13 }}>
                <span style={{ color: '#1A56DB' }}>{p.icon}</span>{p.label}
              </div>
            ))}
          </Card>
        </Col>

        {/* 中：画布 */}
        <Col span={11}>
          <Card
            title="首页版面画布"
            size="small"
            extra={<Button type="primary" size="small" onClick={() => message.success('版面已发布（mock）')}>保存并发布</Button>}
          >
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropCanvasEnd}
              style={{ minHeight: 420, background: '#F9FAFB', borderRadius: 8, padding: 10 }}
            >
              {blocks.length === 0 && <Empty description="从左侧拖拽组件到此处" style={{ paddingTop: 120 }} />}
              {blocks.map((b, i) => (
                <div
                  key={b.id}
                  draggable
                  onDragStart={() => onBlockDragStart(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.stopPropagation(); onDropAt(i) }}
                  onClick={() => setSelected(b.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', marginBottom: 8, borderRadius: 8, cursor: 'grab',
                    background: '#fff', border: selected === b.id ? '2px solid #1A56DB' : '1px solid #E5E7EB',
                  }}
                >
                  <Space><DragOutlined style={{ color: '#9CA3AF' }} /><b style={{ fontSize: 13 }}>{b.label}</b><Tag>{b.type}</Tag></Space>
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit(b) }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); remove(b.id) }} />
                  </Space>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 右：手机预览 */}
        <Col span={8}>
          <Card
            title={<Space><MobileOutlined />手机预览（小程序）</Space>}
            size="small"
            extra={<Segmented size="small" value={device} onChange={(v) => setDevice(v as string)} options={['iPhone', 'Android']} />}
            styles={{ body: { display: 'flex', justifyContent: 'center', background: '#F3F4F6', padding: 16 } }}
          >
            {/* 手机外壳 */}
            <div style={{ width: phoneWidth, background: '#111827', borderRadius: 28, padding: 8, boxShadow: '0 8px 30px rgba(0,0,0,.2)' }}>
              <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden' }}>
                {/* 状态栏 */}
                <div style={{ height: 28, background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', color: '#fff', fontSize: 10 }}>
                  <span>9:41</span><span>Walmart卖家服务中心</span><span>●●●</span>
                </div>
                {/* 内容区 */}
                <div style={{ height: 520, overflowY: 'auto', background: '#F7F8FA' }}>
                  {blocks.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>暂无内容</div>
                    : blocks.map((b) => <PhoneBlock key={b.id} block={b} />)}
                </div>
                {/* 底部 tabBar */}
                <div style={{ height: 44, borderTop: '1px solid #E5E7EB', display: 'flex', background: '#fff' }}>
                  {['首页', '卖家大学', '活动中心', '我的'].map((t, i) => (
                    <div key={t} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: i === 0 ? '#1A56DB' : '#9CA3AF', paddingTop: 6 }}>
                      <div style={{ width: 16, height: 16, margin: '0 auto 2px', borderRadius: 4, background: i === 0 ? '#1A56DB' : '#D1D5DB' }} />{t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 区块属性编辑 */}
      <Modal title={`编辑区块 - ${editBlock?.label}`} open={!!editBlock} onCancel={() => setEditBlock(null)} onOk={saveEdit}>
        {editBlock && (
          <Form form={form} layout="vertical">
            {Object.keys(editBlock.props).map((k) => (
              <Form.Item key={k} label={FIELD_LABEL[k] || k} name={k}>
                <Input />
              </Form.Item>
            ))}
          </Form>
        )}
      </Modal>
    </div>
  )
}

const FIELD_LABEL: Record<string, string> = {
  title: '标题', count: '数量', height: '高度(px)', cols: '每行列数', text: '文案', placeholder: '占位提示',
}
