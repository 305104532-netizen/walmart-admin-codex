import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Input, Space, Typography, Upload } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import ImageUpload from '../../components/ImageUpload'

type MediaKind = 'image' | 'audio' | 'document'
type Props = {
  value?: string
  onChange?: (value: string) => void
  kind?: MediaKind
  label?: string
  maxMB?: number
  id?: string
  onBusyChange?: (busy: boolean) => void
}
const FORMATS: Record<Exclude<MediaKind, 'image'>, { extensions: string[]; mime: string[]; maxMB: number }> = {
  audio: { extensions: ['mp3'], mime: ['audio/mpeg', 'audio/mp3', 'audio/x-mpeg'], maxMB: 5 },
  document: { extensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip'], mime: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream'], maxMB: 10 },
}
const isHttp = (value: string) => {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) && !!url.hostname }
  catch { return false }
}
const mediaName = (value: string) => {
  try {
    const embedded = value.match(/;name=([^;]+);base64,/)
    if (embedded) return decodeURIComponent(embedded[1])
    return isHttp(value) ? decodeURIComponent(new URL(value).pathname.split('/').pop() || '链接附件') : '本地附件'
  } catch { return '已选择附件' }
}

export default function ActivityMediaField({ kind = 'image', ...props }: Props) {
  return kind === 'image' ? <ImageUpload {...props} /> : <FileMediaField {...props} kind={kind} />
}

function FileMediaField({ value = '', onChange, kind, label = '活动素材', maxMB, id, onBusyChange }: Omit<Props, 'kind'> & { kind: 'audio' | 'document' }) {
  const [urlDraft, setUrlDraft] = useState({ value, text: isHttp(value) ? value : '' })
  const url = urlDraft.value === value ? urlDraft.text : isHttp(value) ? value : ''
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const reader = useRef<FileReader | null>(null)
  const busyCallback = useRef(onBusyChange)
  useEffect(() => { busyCallback.current = onBusyChange })
  const format = FORMATS[kind]
  const limit = Math.min(maxMB && maxMB > 0 ? maxMB : format.maxMB, format.maxMB)
  const safePreview = isHttp(value) || (kind === 'audio' && /^data:audio\/(?:mpeg|mp3|x-mpeg)(?:;name=[^;,]*)?;base64,[A-Za-z0-9+/=]+$/.test(value))

  useEffect(() => () => {
    if (reader.current?.readyState === FileReader.LOADING) {
      reader.current.onload = null
      reader.current.onabort = null
      reader.current.abort()
      busyCallback.current?.(false)
    }
  }, [])
  const setReading = (reading: boolean) => { setBusy(reading); busyCallback.current?.(reading) }
  const applyUrl = () => {
    const next = url.trim()
    if (!isHttp(next)) { setError('请输入完整的 http 或 https 链接'); return }
    setError(''); onChange?.(next)
  }
  const readFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!format.extensions.includes(extension) || (file.type && !format.mime.includes(file.type.toLowerCase()))) {
      setError(`请选择 ${format.extensions.join(' / ').toUpperCase()} 格式文件`)
      return Upload.LIST_IGNORE
    }
    if (!file.size || file.size > limit * 1024 * 1024) {
      setError(!file.size ? '文件为空，请重新选择' : `文件大小不能超过 ${limit} MB`)
      return Upload.LIST_IGNORE
    }
    setError(''); setReading(true)
    const nextReader = new FileReader()
    reader.current = nextReader
    nextReader.onload = () => {
      const result = nextReader.result
      if (typeof result === 'string') {
        const mime = kind === 'audio' ? 'audio/mpeg' : (file.type || 'application/octet-stream')
        onChange?.(result.replace(/^data:[^,]*;base64,/, `data:${mime};name=${encodeURIComponent(file.name)};base64,`))
      } else setError('文件读取失败，请重新选择')
      setReading(false)
    }
    nextReader.onerror = () => { setError('文件读取失败，请重新选择'); setReading(false) }
    nextReader.onabort = () => setReading(false)
    try { nextReader.readAsDataURL(file) }
    catch { setError('文件读取失败，请重新选择'); setReading(false) }
    return Upload.LIST_IGNORE
  }
  return <Space orientation="vertical" size={8} style={{ width: '100%' }}>
    <Input.Search id={id} aria-label={`${label}链接`} value={url} disabled={busy} placeholder="https://…" enterButton="使用链接" onChange={(event) => setUrlDraft({ value, text: event.target.value })} onSearch={applyUrl} />
    <Space wrap>
      <Upload accept={format.extensions.map((extension) => `.${extension}`).join(',')} beforeUpload={readFile} showUploadList={false} disabled={busy}>
        <Button icon={<UploadOutlined />} loading={busy} aria-label={`选择${label}文件`}>{busy ? '正在读取文件' : '选择本地文件'}</Button>
      </Upload>
      {value && <Button icon={<DeleteOutlined />} disabled={busy} aria-label={`清除${label}`} onClick={() => { onChange?.(''); setUrlDraft({ value: '', text: '' }); setError('') }}>清除</Button>}
      <Typography.Text type="secondary">最大 {limit} MB</Typography.Text>
    </Space>
    {error && <div role="alert" aria-live="assertive"><Alert type="error" showIcon title={error} /></div>}
    {safePreview && kind === 'audio' && <audio src={value} controls preload="none" aria-label={`${label}试听`} style={{ width: '100%' }} onError={() => setError('音频无法播放，请检查链接或重新选择文件')} />}
    {value && kind === 'document' && <Typography.Text style={{ overflowWrap: 'anywhere' }}>{mediaName(value)}</Typography.Text>}
  </Space>
}
