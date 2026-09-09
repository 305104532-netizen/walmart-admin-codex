import { assertCanManageOwnRegistrationForms } from './adminAccess'
import type { PreviewUser } from './adminAccess'
import { loadRegistrationTemplate, validateRegistrationSteps } from './registrationTemplates'
import type { RegistrationStep, TemplateRevision } from './registrationTemplates'

export interface BDRegistrationForm {
  id: string
  ownerId: string
  ownerName: string
  name: string
  description?: string
  sourceStandardVersion: number
  createdAt: string
  updatedAt: string
  revision: number
  published?: TemplateRevision
  draft?: TemplateRevision
}

export interface BDRegistrationFormMeta { name: string; description?: string }

const STORAGE_PREFIX = 'walmart-admin-bd-registration-form:v1:'
const CHANGE_EVENT = 'walmart-admin:bd-registration-forms-changed'
const RECORD_KEYS = [
  'id', 'ownerId', 'ownerName', 'name', 'description', 'sourceStandardVersion',
  'createdAt', 'updatedAt', 'revision', 'published', 'draft',
]

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function isObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
function isText(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }
function isVersion(value: unknown): value is number { return Number.isSafeInteger(value) && (value as number) > 0 }
function isTimestamp(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function assertKeys(value: Record<string, unknown>, keys: string[]): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) throw new Error('专属表单包含无法识别的配置项。')
}

function currentBD(): PreviewUser {
  const user = assertCanManageOwnRegistrationForms()
  if (user.role !== 'bd' || !isText(user.id) || !isText(user.name)) throw new Error('仅 BD 可以管理本人的专属入驻表单。')
  return { ...user, permissions: [...user.permissions] }
}
function assertId(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('专属表单编号不正确。')
}
function ownerPrefix(ownerId: string): string { return STORAGE_PREFIX + encodeURIComponent(ownerId) + ':' }
function formKey(ownerId: string, id: string): string { return ownerPrefix(ownerId) + id }

function getStorage(): Storage {
  if (typeof localStorage === 'undefined') throw new Error('当前浏览器无法使用专属表单本地存储。')
  return localStorage
}
function readRaw(key: string): string | null {
  try { return getStorage().getItem(key) } catch { throw new Error('无法读取专属表单，请检查浏览器的本地存储权限。') }
}

function normalizeMeta(value: unknown): BDRegistrationFormMeta {
  if (!isObject(value)) throw new Error('请填写专属表单名称。')
  assertKeys(value, ['name', 'description'])
  if (!isText(value.name)) throw new Error('请填写专属表单名称。')
  if (value.description !== undefined && typeof value.description !== 'string') throw new Error('专属表单说明必须为文本。')
  return {
    name: value.name.trim(),
    ...(typeof value.description === 'string' && value.description.trim() ? { description: value.description.trim() } : {}),
  }
}

function validateRevision(value: unknown): asserts value is TemplateRevision {
  if (!isObject(value)) throw new Error('专属表单版本格式不正确。')
  assertKeys(value, ['steps', 'version', 'updatedAt', 'updatedBy'])
  if (!isVersion(value.version) || !isTimestamp(value.updatedAt) || !isText(value.updatedBy)) {
    throw new Error('专属表单版本、更新时间或更新人格式不正确。')
  }
  validateRegistrationSteps(value.steps as RegistrationStep[])
}

function validateRecord(value: unknown, owner: PreviewUser, id: string): asserts value is BDRegistrationForm {
  if (!isObject(value)) throw new Error('专属表单数据格式不正确。')
  assertKeys(value, RECORD_KEYS)
  if (value.ownerId !== owner.id) throw new Error('无权访问其他 BD 的专属表单。')
  if (value.id !== id || !isText(value.ownerName) || !isText(value.name)) throw new Error('专属表单编号、归属或名称格式不正确。')
  if (value.description !== undefined && typeof value.description !== 'string') throw new Error('专属表单说明格式不正确。')
  if (!isVersion(value.sourceStandardVersion) || !isVersion(value.revision) || !isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt)) {
    throw new Error('专属表单来源版本、修订号或时间格式不正确。')
  }
  if (value.published === undefined && value.draft === undefined) throw new Error('专属表单必须包含草稿或已发布版本。')
  if (value.published !== undefined) validateRevision(value.published)
  if (value.draft !== undefined) {
    validateRevision(value.draft)
    const nextVersion = value.published === undefined ? 1 : (value.published as TemplateRevision).version + 1
    if (value.draft.version !== nextVersion) throw new Error('专属表单草稿版本必须为已发布版本的下一版本。')
  }
}

function readRecord(owner: PreviewUser, id: string): BDRegistrationForm | undefined {
  const raw = readRaw(formKey(owner.id, id))
  if (raw === null) return undefined
  let envelope: unknown
  try { envelope = JSON.parse(raw) } catch { throw new Error('专属表单数据已损坏，原数据未被覆盖。') }
  if (!isObject(envelope)) throw new Error('专属表单存储格式不正确，原数据未被覆盖。')
  assertKeys(envelope, ['schemaVersion', 'form'])
  if (envelope.schemaVersion !== 1) throw new Error('专属表单存储版本不受支持，原数据未被覆盖。')
  validateRecord(envelope.form, owner, id)
  return envelope.form
}

function writeRecord(owner: PreviewUser, record: BDRegistrationForm): BDRegistrationForm {
  const fresh = currentBD()
  if (fresh.id !== owner.id) throw new Error('当前账号已切换，专属表单未保存；请返回列表后重新操作。')
  validateRecord(record, fresh, record.id)
  try { getStorage().setItem(formKey(fresh.id, record.id), JSON.stringify({ schemaVersion: 1, form: record })) } catch {
    throw new Error('专属表单保存失败，请检查浏览器存储权限和可用空间；原配置未更新。')
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
  return clone(record)
}

async function withFormLock<T>(initiatorId: string, id: string, action: (owner: PreviewUser) => T): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks || typeof navigator.locks.request !== 'function') {
    throw new Error('当前浏览器不支持专属表单的并发保存，请使用新版浏览器访问本地后台。')
  }
  return navigator.locks.request(formKey(initiatorId, id), { mode: 'exclusive' }, () => {
    const owner = currentBD()
    if (owner.id !== initiatorId) throw new Error('等待保存期间账号已切换，专属表单未保存；请返回列表后重新操作。')
    return action(owner)
  })
}

function assertExpectedRevision(expectedRevision: unknown): asserts expectedRevision is number {
  if (!isVersion(expectedRevision)) throw new Error('专属表单修订号不正确，请刷新后重新打开。')
}

function nextRecord(owner: PreviewUser, id: string, expectedRevision: number): BDRegistrationForm {
  const record = readRecord(owner, id)
  if (!record) throw new Error('专属表单不存在或无权访问。')
  if (record.revision !== expectedRevision) {
    throw new Error('此专属表单已在其他页面更新，请重新打开最新版本后再保存；当前修改未覆盖已保存内容。')
  }
  const revision = record.revision + 1
  if (!isVersion(revision)) throw new Error('专属表单修订号超出支持范围，无法保存。')
  return { ...record, ownerName: owner.name, updatedAt: new Date().toISOString(), revision }
}

function makeRevision(steps: RegistrationStep[], version: number, owner: PreviewUser, updatedAt: string): TemplateRevision {
  return { steps: clone(steps), version, updatedAt, updatedBy: owner.name }
}

export function listBDRegistrationForms(): BDRegistrationForm[] {
  const owner = currentBD()
  const prefix = ownerPrefix(owner.id)
  const ids: string[] = []
  try {
    const storage = getStorage()
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key?.startsWith(prefix)) ids.push(key.slice(prefix.length))
    }
  } catch { throw new Error('无法读取专属表单列表，请检查浏览器的本地存储权限。') }
  const forms = ids.map((id) => {
    assertId(id)
    return readRecord(owner, id)
  }).filter((record): record is BDRegistrationForm => record !== undefined)
  return forms.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))
}

export function loadBDRegistrationForm(id: string): BDRegistrationForm | undefined {
  const owner = currentBD()
  assertId(id)
  return readRecord(owner, id)
}

export async function createBDRegistrationForm(name: string, description?: string): Promise<BDRegistrationForm> {
  const owner = currentBD()
  const meta = normalizeMeta({ name, description })
  const id = `bdform-${crypto.randomUUID()}`
  return withFormLock(owner.id, id, (fresh) => {
    if (readRaw(formKey(fresh.id, id)) !== null) throw new Error('专属表单编号已存在，请重试创建。')
    const standard = loadRegistrationTemplate().published
    validateRegistrationSteps(standard.steps)
    const now = new Date().toISOString()
    return writeRecord(fresh, {
      id, ownerId: fresh.id, ownerName: fresh.name, ...meta,
      sourceStandardVersion: standard.version, createdAt: now, updatedAt: now, revision: 1,
      draft: makeRevision(standard.steps, 1, fresh, now),
    })
  })
}

export async function saveBDRegistrationDraft(id: string, steps: RegistrationStep[], expectedRevision: number): Promise<BDRegistrationForm> {
  const owner = currentBD()
  assertId(id)
  assertExpectedRevision(expectedRevision)
  validateRegistrationSteps(steps)
  const snapshot = clone(steps)
  return withFormLock(owner.id, id, (fresh) => {
    const record = nextRecord(fresh, id, expectedRevision)
    return writeRecord(fresh, {
      ...record,
      draft: makeRevision(snapshot, (record.published?.version ?? 0) + 1, fresh, record.updatedAt),
    })
  })
}

export async function publishBDRegistrationForm(id: string, steps: RegistrationStep[], expectedRevision: number): Promise<BDRegistrationForm> {
  const owner = currentBD()
  assertId(id)
  assertExpectedRevision(expectedRevision)
  validateRegistrationSteps(steps)
  const snapshot = clone(steps)
  return withFormLock(owner.id, id, (fresh) => {
    const record = nextRecord(fresh, id, expectedRevision)
    const { draft: _draft, ...withoutDraft } = record
    return writeRecord(fresh, {
      ...withoutDraft,
      published: makeRevision(snapshot, (record.published?.version ?? 0) + 1, fresh, record.updatedAt),
    })
  })
}

export async function updateBDRegistrationFormMeta(id: string, meta: BDRegistrationFormMeta, expectedRevision: number): Promise<BDRegistrationForm> {
  const owner = currentBD()
  assertId(id)
  assertExpectedRevision(expectedRevision)
  const snapshot = normalizeMeta(meta)
  return withFormLock(owner.id, id, (fresh) => {
    const record = nextRecord(fresh, id, expectedRevision)
    const { description: _description, ...withoutDescription } = record
    return writeRecord(fresh, { ...withoutDescription, ...snapshot })
  })
}

export function subscribeBDRegistrationForms(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event: StorageEvent) => {
    let owner: PreviewUser
    try { owner = currentBD() } catch { return }
    if (event.key === null || event.key.startsWith(ownerPrefix(owner.id))) listener()
  }
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => { window.removeEventListener(CHANGE_EVENT, listener); window.removeEventListener('storage', onStorage) }
}
