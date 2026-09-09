export interface SummitAgendaItem {
  id: string
  startTime: string
  endTime: string
  title: string
  speaker?: string
  venue?: string
  description?: string
}

export interface SummitGuest {
  id: string
  name: string
  title: string
  company?: string
  bio?: string
  avatar?: string
}

export interface SummitConfig {
  title: string
  shortTitle?: string
  slogan?: string
  topTitle: string
  start: string | null
  end: string | null
  registrationDeadline: string | null
  city: string
  venue: string
  address?: string
  capacity: number | null
  cover: string
  listCover?: string
  shareImage?: string
  detail: string
  agenda: SummitAgendaItem[]
  guests: SummitGuest[]
  allowRegister: boolean
  auditRequired: boolean
  needCheckin: boolean
  checkinStartMinutes: number
  checkinEndMinutes: number
  leadToRegister: boolean
  bindingDays: number
  needSurvey: boolean
  showInCalendar: boolean
  registrationFields: string[]
  signupSuccessText: string
  shareSummary?: string
  sourceTraceEnabled: boolean
}

export interface StoredSummit {
  id: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  values: SummitConfig
  signup: number
  checkin: number
}

const DATABASE_NAME = 'walmart-admin-summits'
const STORE_NAME = 'summits'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前浏览器不支持峰会本地存储，请使用新版浏览器。'))
      return
    }
    const request = indexedDB.open(DATABASE_NAME, 1)
    let blocked = false
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onerror = () => reject(request.error ?? new Error('无法打开峰会存储。'))
    request.onblocked = () => {
      blocked = true
      reject(new Error('峰会存储正在被其他页面占用，请关闭其他后台页面后重试。'))
    }
    request.onsuccess = () => {
      const database = request.result
      if (blocked) { database.close(); return }
      database.onversionchange = () => database.close()
      resolve(database)
    }
  })
}

function isText(value: unknown): value is string {
  return typeof value === 'string'
}

function isStoredSummit(value: unknown): value is StoredSummit {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Partial<StoredSummit>
  return isText(record.id) && !!record.id
    && (record.status === 'draft' || record.status === 'published')
    && isText(record.createdAt) && Number.isFinite(Date.parse(record.createdAt))
    && isText(record.updatedAt) && Number.isFinite(Date.parse(record.updatedAt))
    && !!record.values && typeof record.values === 'object' && !Array.isArray(record.values)
    && typeof record.signup === 'number' && record.signup >= 0
    && typeof record.checkin === 'number' && record.checkin >= 0
}

async function readRecords(id?: string): Promise<unknown> {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = id === undefined ? transaction.objectStore(STORE_NAME).getAll() : transaction.objectStore(STORE_NAME).get(id)
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error ?? new Error('读取峰会失败。'))
      transaction.onerror = () => reject(transaction.error ?? new Error('读取峰会失败。'))
    })
  } finally { database.close() }
}

export async function readSummits(): Promise<StoredSummit[]> {
  const records = await readRecords()
  if (!Array.isArray(records) || !records.every(isStoredSummit)) throw new Error('峰会数据格式异常，无法读取。')
  return records.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
}

export async function readSummit(id: string): Promise<StoredSummit | undefined> {
  if (!id.trim()) throw new Error('峰会编号不能为空。')
  const record = await readRecords(id)
  if (record === undefined) return undefined
  if (!isStoredSummit(record)) throw new Error('该峰会数据格式异常，无法读取。')
  return record
}

export async function saveSummit(values: SummitConfig, status: StoredSummit['status'], id?: string): Promise<StoredSummit> {
  const existing = id ? await readSummit(id) : undefined
  if (id && !existing) throw new Error('峰会不存在，请返回峰会列表重新选择。')
  const now = new Date().toISOString()
  const record: StoredSummit = {
    id: existing?.id ?? `summit-${crypto.randomUUID()}`,
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    values: structuredClone(values),
    signup: existing?.signup ?? 0,
    checkin: existing?.checkin ?? 0,
  }
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(record)
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error ?? new Error('峰会保存失败，请检查浏览器可用存储空间。'))
      transaction.onerror = () => reject(transaction.error ?? new Error('峰会保存失败，请检查浏览器可用存储空间。'))
    })
  } finally { database.close() }
  return structuredClone(record)
}

export function getSummitRuntimeStatus(record: StoredSummit): 'draft' | 'registration' | 'ongoing' | 'ended' {
  if (record.status === 'draft') return 'draft'
  const now = Date.now()
  const start = Date.parse(record.values.start ?? '')
  const end = Date.parse(record.values.end ?? '')
  if (Number.isFinite(end) && now >= end) return 'ended'
  if (Number.isFinite(start) && now >= start) return 'ongoing'
  return 'registration'
}
