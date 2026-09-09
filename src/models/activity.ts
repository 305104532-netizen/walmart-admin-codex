export interface ActivityConfig {
  title?: string
  topTitle?: string
  mode?: 'online' | 'offline' | 'hybrid'
  kind?: string
  start?: string | null
  end?: string | null
  registrationDeadline?: string | null
  city?: string
  capacity?: number | null
  location?: string
  cover?: string
  listCover?: string
  detail?: string
  needCheckin?: boolean
  needSurvey?: boolean
  allowRegister?: boolean
  leadToRegister?: boolean
  cpManager?: string
  bindingDays?: number
  [key: string]: unknown
}

export interface StoredActivity {
  id: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  values: ActivityConfig
  signup: number
}

const DATABASE_NAME = 'walmart-admin-activities'
const STORE_NAME = 'activities'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前浏览器不支持活动本地存储，请使用支持 IndexedDB 的浏览器。'))
      return
    }
    const request = indexedDB.open(DATABASE_NAME, 1)
    let blocked = false
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onerror = () => reject(request.error ?? new Error('无法打开活动存储。'))
    request.onblocked = () => {
      blocked = true
      reject(new Error('活动存储正在被其他页面占用，请关闭其他管理后台页面后重试。'))
    }
    request.onsuccess = () => {
      const database = request.result
      if (blocked) {
        database.close()
        return
      }
      database.onversionchange = () => database.close()
      resolve(database)
    }
  })
}

function isStoredActivity(value: unknown): value is StoredActivity {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Partial<StoredActivity>
  return typeof record.id === 'string' && record.id.length > 0
    && (record.status === 'draft' || record.status === 'published')
    && typeof record.createdAt === 'string' && Number.isFinite(Date.parse(record.createdAt))
    && typeof record.updatedAt === 'string' && Number.isFinite(Date.parse(record.updatedAt))
    && typeof record.values === 'object' && record.values !== null && !Array.isArray(record.values)
    && typeof record.signup === 'number' && Number.isFinite(record.signup) && record.signup >= 0
}

async function readRecords(id?: string): Promise<unknown> {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = id === undefined ? store.getAll() : store.get(id)
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error ?? new Error('读取活动失败。'))
      transaction.onerror = () => reject(transaction.error ?? new Error('读取活动失败。'))
    })
  } finally {
    database.close()
  }
}

export async function readSavedActivities(): Promise<StoredActivity[]> {
  const records = await readRecords()
  if (!Array.isArray(records) || !records.every(isStoredActivity)) {
    throw new Error('已保存的活动数据格式异常，无法读取。')
  }
  return records.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
}

export async function readSavedActivity(id: string): Promise<StoredActivity | undefined> {
  const record = await readRecords(id)
  if (record === undefined) return undefined
  if (!isStoredActivity(record)) throw new Error('该活动数据格式异常，无法读取。')
  return record
}

export async function saveActivity(
  values: ActivityConfig,
  status: StoredActivity['status'],
  id?: string,
): Promise<StoredActivity> {
  const existing = id ? await readSavedActivity(id) : undefined
  if (id && !existing) throw new Error('活动不存在，请返回活动列表重新选择。')
  const now = new Date().toISOString()
  const activity: StoredActivity = {
    id: existing?.id ?? `activity-${crypto.randomUUID()}`,
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    values,
    signup: existing?.signup ?? 0,
  }
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error ?? new Error('保存活动失败，请检查浏览器可用存储空间。'))
      transaction.onerror = () => reject(transaction.error ?? new Error('保存活动失败，请检查浏览器可用存储空间。'))
      transaction.objectStore(STORE_NAME).put(activity)
    })
  } finally {
    database.close()
  }
  return activity
}

export function getActivityStatus(record: StoredActivity): 'draft' | 'upcoming' | 'ongoing' | 'ended' {
  if (record.status === 'draft') return 'draft'
  const now = Date.now()
  const end = Date.parse(record.values.end ?? '')
  const start = Date.parse(record.values.start ?? '')
  if (Number.isFinite(end) && end <= now) return 'ended'
  if (Number.isFinite(start) && start <= now) return 'ongoing'
  return 'upcoming'
}
