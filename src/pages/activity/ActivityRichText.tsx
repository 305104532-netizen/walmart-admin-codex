import { useEffect, useRef, useState } from 'react'
import { Button, Input, Space, Typography } from 'antd'

const ALLOWED = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'a', 'span'])
const DISCARD = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template', 'noscript', 'head', 'link', 'meta'])
const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const safeLink = (value: string) => {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) && !!url.hostname ? url.href : '' }
  catch { return '' }
}

// These helpers are shared with the activity save and preview paths.
// eslint-disable-next-line react/only-export-components
export function sanitizeActivityHtml(html: string): string {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') return escapeText(html)
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const clean = parsed.createElement('div')
  const appendSafe = (source: Node, parent: Node) => {
    if (source.nodeType === 3) { parent.appendChild(parsed.createTextNode(source.textContent ?? '')); return }
    if (source.nodeType !== 1) return
    const element = source as HTMLElement
    const sourceTag = element.tagName.toLowerCase()
    if (DISCARD.has(sourceTag)) return
    const tag = sourceTag === 'div' ? 'p' : sourceTag
    let target = parent
    if (ALLOWED.has(tag)) {
      const safe = parsed.createElement(tag)
      if (tag === 'a') {
        const href = safeLink(element.getAttribute('href') ?? '')
        if (href) { safe.setAttribute('href', href); safe.setAttribute('target', '_blank'); safe.setAttribute('rel', 'noopener noreferrer') }
      }
      const color = element.style.color.trim()
      if (/^(?:#[0-9a-f]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(color)) safe.style.color = color
      if (/^(left|right|center|justify)$/.test(element.style.textAlign)) safe.style.textAlign = element.style.textAlign
      parent.appendChild(safe)
      target = safe
    }
    source.childNodes.forEach((child) => appendSafe(child, target))
  }
  parsed.body.childNodes.forEach((node) => appendSafe(node, clean))
  return clean.innerHTML
}

// eslint-disable-next-line react/only-export-components
export function getActivityText(html: string): string {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, ' ').trim()
  const safe = sanitizeActivityHtml(html).replace(/<br\s*\/?>|<\/(?:p|li|h[1-4]|blockquote)>/gi, '$&\n')
  return new DOMParser().parseFromString(safe, 'text/html').body.textContent?.replace(/\u00a0/g, ' ').trim() ?? ''
}

type Props = { value?: string; onChange?: (value: string) => void; id?: string }
export default function ActivityRichText({ value = '', onChange, id }: Props) {
  const editor = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef<string | null>(null)
  const selection = useRef<Range | null>(null)
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const element = editor.current
    if (element && value !== lastEmitted.current) {
      const safe = sanitizeActivityHtml(value)
      if (element.innerHTML !== safe) element.innerHTML = safe
    }
  }, [value])
  const remember = () => {
    const current = window.getSelection()
    if (current?.rangeCount && editor.current?.contains(current.getRangeAt(0).commonAncestorContainer)) selection.current = current.getRangeAt(0).cloneRange()
  }
  const emit = () => {
    const safe = sanitizeActivityHtml(editor.current?.innerHTML ?? '')
    lastEmitted.current = safe
    onChange?.(safe)
    remember()
  }
  const command = (name: string, argument?: string) => {
    editor.current?.focus()
    if (selection.current && editor.current?.contains(selection.current.commonAncestorContainer)) {
      const current = window.getSelection()
      current?.removeAllRanges()
      current?.addRange(selection.current)
    }
    document.execCommand(name, false, argument)
    emit()
  }
  return <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
    <Space role="toolbar" aria-label="活动详情格式工具" wrap size={4} style={{ padding: 8, background: '#fafafa', borderBottom: '1px solid #eee' }}>
      {[
        ['bold', '加粗'], ['italic', '斜体'], ['underline', '下划线'],
        ['insertUnorderedList', '无序列表'], ['insertOrderedList', '有序列表'], ['removeFormat', '清除格式'],
      ].map(([name, label]) => <Button key={name} size="small" aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => command(name)}>{label}</Button>)}
      <Input size="small" value={link} aria-label="活动详情链接地址" placeholder="链接地址 https://…" style={{ width: 190 }} onChange={(event) => setLink(event.target.value)} />
      <Button size="small" onMouseDown={(event) => event.preventDefault()} onClick={() => {
        const href = safeLink(link.trim())
        if (!href) { setError('链接仅支持完整的 http 或 https 地址'); return }
        setError(''); command('createLink', href); setLink('')
      }}>添加链接</Button>
    </Space>
    {error && <Typography.Text type="danger" role="alert" style={{ display: 'block', padding: '4px 12px' }}>{error}</Typography.Text>}
    <div id={id} ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="活动详情编辑器" aria-multiline="true" tabIndex={0}
      style={{ padding: 12, minHeight: 210, maxHeight: 520, overflowY: 'auto', overflowWrap: 'anywhere', outlineColor: '#0071ce' }}
      onInput={emit} onMouseUp={remember} onKeyUp={remember} onBlur={remember}
      onPaste={(event) => {
        event.preventDefault()
        const html = event.clipboardData.getData('text/html')
        const text = event.clipboardData.getData('text/plain')
        remember()
        command('insertHTML', html ? sanitizeActivityHtml(html) : escapeText(text).replace(/\r?\n/g, '<br>'))
      }}
      onDrop={(event) => event.preventDefault()} />
  </div>
}
