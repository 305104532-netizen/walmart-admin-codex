import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Image, Space, Typography, Upload } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'

type Props = {
  value?: string
  onChange?: (value: string) => void
  label?: string
  maxMB?: number
  id?: string
  onBusyChange?: (busy: boolean) => void
}

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
}
const canPreview = (value: string) => {
  if (/^data:image\/(?:png|jpeg|webp|gif)(?:;name=[^;,]*)?;base64,[A-Za-z0-9+/=]+$/.test(value)) return true
  try { return /^https?:$/.test(new URL(value).protocol) }
  catch { return false }
}

export default function ImageUpload({ value = '', onChange, label = '图片', maxMB = 2, id, onBusyChange }: Props) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const reader = useRef<FileReader | null>(null)
  const decoder = useRef<HTMLImageElement | null>(null)
  const busyCallback = useRef(onBusyChange)
  const limit = Number.isFinite(maxMB) && maxMB > 0 ? maxMB : 2

  useEffect(() => { busyCallback.current = onBusyChange })
  useEffect(() => () => {
    if (reader.current) {
      reader.current.onload = null
      reader.current.onerror = null
      reader.current.onabort = null
      if (reader.current.readyState === FileReader.LOADING) reader.current.abort()
    }
    if (decoder.current) { decoder.current.onload = null; decoder.current.onerror = null }
    if (pending.current) busyCallback.current?.(false)
    pending.current = false
  }, [])

  const setReading = (reading: boolean) => {
    pending.current = reading
    setBusy(reading)
    busyCallback.current?.(reading)
  }
  const readFile = (file: File) => {
    if (pending.current) return Upload.LIST_IGNORE
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const mime = IMAGE_TYPES[extension]
    if (!mime || (file.type && file.type.toLowerCase() !== mime)) {
      setError('请选择 PNG、JPG、JPEG、WEBP 或 GIF 格式的图片')
      return Upload.LIST_IGNORE
    }
    if (!file.size || file.size > limit * 1024 * 1024) {
      setError(!file.size ? '图片文件为空，请重新选择' : `图片大小不能超过 ${limit} MB`)
      return Upload.LIST_IGNORE
    }
    setError('')
    setReading(true)
    const nextReader = new FileReader()
    reader.current = nextReader
    const finish = (message = '') => {
      reader.current = null
      decoder.current = null
      setError(message)
      setReading(false)
    }
    nextReader.onload = () => {
      if (typeof nextReader.result !== 'string') { finish('图片读取失败，请重新选择'); return }
      const imageValue = nextReader.result.replace(/^data:[^,]*;base64,/, `data:${mime};name=${encodeURIComponent(file.name)};base64,`)
      const decoded = new window.Image()
      decoder.current = decoded
      decoded.onload = () => { onChange?.(imageValue); finish() }
      decoded.onerror = () => finish('无法读取这张图片，请选择有效的图片文件')
      decoded.src = imageValue
    }
    nextReader.onerror = () => finish('图片读取失败，请重新选择')
    nextReader.onabort = () => finish()
    try { nextReader.readAsDataURL(file) }
    catch { finish('图片读取失败，请重新选择') }
    return Upload.LIST_IGNORE
  }

  return <Space orientation="vertical" size={8} style={{ width: '100%' }}>
    {value && canPreview(value) && <Image src={value} alt={`${label}预览`} width={240} height={140} style={{ objectFit: 'contain', background: '#f5f7fb', borderRadius: 6 }} />}
    <Space wrap>
      <Upload accept=".png,.jpg,.jpeg,.webp,.gif" beforeUpload={readFile} showUploadList={false} multiple={false} disabled={busy}>
        <Button id={id} icon={<UploadOutlined />} loading={busy} aria-label={`${value ? '替换' : '上传'}${label}`}>{busy ? '正在读取图片' : value ? '替换图片' : '上传图片'}</Button>
      </Upload>
      {value && <Button icon={<DeleteOutlined />} disabled={busy} aria-label={`删除${label}`} onClick={() => { onChange?.(''); setError('') }}>删除</Button>}
    </Space>
    <Typography.Text type="secondary">支持 PNG、JPG、JPEG、WEBP、GIF，最大 {limit} MB</Typography.Text>
    {error && <div role="alert" aria-live="assertive"><Alert type="error" showIcon title={error} /></div>}
  </Space>
}
