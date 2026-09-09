import { assertCanConfigureRegistrationForm, getCurrentAdmin } from './adminAccess'

export type RegistrationSite = 'US' | 'CA' | 'MX'
const INTERNAL_SITES: RegistrationSite[] = ['US', 'CA', 'MX']
export const ALL_SITES: RegistrationSite[] = [...INTERNAL_SITES]

export const SITE_OPTIONS: { value: RegistrationSite; label: string }[] = [
  { value: 'US', label: '美国站 US' },
  { value: 'CA', label: '加拿大站 CA' },
  { value: 'MX', label: '墨西哥站 MX' },
]
export const FIELD_TYPES: { value: string; label: string }[] = [
  { value: 'text', label: '文本' }, { value: 'select', label: '下拉选择' },
  { value: 'upload', label: '图片上传' }, { value: 'phone', label: '手机号' }, { value: 'email', label: '邮箱' },
]
export const VALIDATE_RULES: { value: string; label: string }[] = [
  { value: 'none', label: '无' }, { value: 'phone', label: '手机号' }, { value: 'email', label: '邮箱' },
  { value: 'uscc', label: '统一社会信用代码18位' }, { value: 'idcard', label: '身份证18位' },
]

export interface RegistrationField {
  key: string
  label: string
  en: string
  type: string
  required: boolean
  applicableSites: RegistrationSite[]
  sensitive?: boolean
  showIf?: string
  placeholder?: string
  validate?: string
  options?: string[]
}
export interface RegistrationStep { id: string; name: string; fields: RegistrationField[] }
interface RevisionMetadata { version: number; updatedAt: string | null; updatedBy: string }
export interface TemplateRevision extends RevisionMetadata { steps: RegistrationStep[] }
export interface RegistrationTemplateState {
  published: TemplateRevision
  draft?: TemplateRevision
  migrationNotice?: string
}
export type RegistrationTemplates = Record<RegistrationSite, RegistrationTemplateState>
type LegacyField = Omit<RegistrationField, 'applicableSites'>
interface LegacyStep { id: string; name: string; fields: LegacyField[] }
interface LegacyRevision extends RevisionMetadata { steps: LegacyStep[] }
interface LegacyState { site: RegistrationSite; published: LegacyRevision; draft?: LegacyRevision }

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }

const US_STEPS: LegacyStep[] = [
  { id: 'contact', name: '联系人信息', fields: [
    { key: 'contactName', label: '首要联系人姓名', en: 'Contact Name', type: 'text', required: true },
    { key: 'regionCode', label: '手机号国家/地区码', en: 'Phone Number Region Code', type: 'select', required: true },
    { key: 'phone', label: '首要联系人手机', en: 'Contact Phone Number', type: 'phone', required: true },
    { key: 'email', label: '首要联系人邮箱', en: 'Email', type: 'email', required: true },
  ] },
  { id: 'company', name: '企业信息', fields: [
    { key: 'companyName', label: '公司名称(中文)', en: 'Company Name(Chinese)', type: 'text', required: true },
    { key: 'operationLocation', label: '公司实际经营地', en: 'Company Operation Location', type: 'text', required: true },
    { key: 'regLocation', label: '公司注册地', en: 'Company Registration Location', type: 'select', required: true },
    { key: 'brand', label: '品牌名称', en: 'Brand Name', type: 'text', required: true },
  ] },
  { id: 'business', name: '经营信息', fields: [
    { key: 'category', label: '主要类目', en: 'Main Category', type: 'select', required: true },
    { key: 'subCategory', label: '细分品类', en: 'Sub Category', type: 'text', required: false },
    { key: 'annualGMV', label: '跨境年GMV', en: 'Cross-Border Annual GMV', type: 'select', required: true },
    { key: 'bdManager', label: '对接BD经理', en: 'Seller Contacted BD Manager', type: 'text', required: false },
    { key: 'otherPlatforms', label: '其他电商平台', en: 'Other E-commerce Platform Name', type: 'text', required: true },
    { key: 'storeLink', label: '店铺链接', en: 'Other Platform Shop URL', type: 'text', required: true },
    { key: 'sellerId', label: '卖家ID', en: 'Other Platform Seller ID', type: 'text', required: true },
    { key: 'gmvScreenshot', label: 'GMV后台截图', en: 'Other Platform GMV Screenshot', type: 'upload', required: false },
    { key: 'wfsSupport', label: '是否需要WFS', en: 'Do you need WFS Support', type: 'select', required: true },
  ] },
  { id: 'verification', name: '五要素5FA', fields: [
    { key: 'legalRepName', label: '法人姓名', en: 'Legal Rep Name', type: 'text', required: true },
    { key: 'legalRepPhone', label: '法人手机', en: 'Legal Rep Phone', type: 'phone', required: true },
    { key: 'legalCompanyName', label: '法定公司名', en: 'Legal Company Name', type: 'text', required: true },
    { key: 'legalCompanyTaxId', label: '公司税号', en: 'Legal Company Tax ID', type: 'text', required: true, sensitive: true },
    { key: 'legalRepIdNumber', label: '法人身份证号', en: 'Legal Rep National ID Number', type: 'text', required: true, sensitive: true },
  ] },
  { id: 'confirmation', name: '确认提交', fields: [] },
]

const MX_STEPS: LegacyStep[] = [
  { id: 'contact', name: '联系人信息', fields: clone(US_STEPS[0].fields) },
  { id: 'company', name: '企业信息', fields: clone(US_STEPS[1].fields).concat([{ key: 'category', label: '主要类目', en: 'Main Category', type: 'select', required: true }]) },
  { id: 'expansion', name: '扩展信息', fields: [
    { key: 'hasUSAccount', label: '是否有美国站账号', en: 'Whether has a US marketplace account', type: 'select', required: true },
    { key: 'usPid', label: '美国站PID', en: 'US Account PID', type: 'text', required: true, showIf: 'hasUSAccount=是' },
    { key: 'mxExperience', label: '是否有墨西哥电商经验', en: 'Whether has Mexico E-Commerce Experience', type: 'select', required: true },
    { key: 'mxGmvScreenshot', label: '墨西哥GMV截图', en: 'Mexico GMV Screenshot', type: 'upload', required: false, showIf: 'mxExperience=是' },
    { key: 'mxPlatformName', label: '墨西哥平台名', en: 'Mexico Platform Name', type: 'text', required: false, showIf: 'mxExperience=是' },
    { key: 'mxPlatformUrl', label: '墨西哥店铺链接', en: 'Mexico Platform URL', type: 'text', required: false, showIf: 'mxExperience=是' },
    { key: 'mxSellerId', label: '墨西哥卖家ID', en: 'Mexico Platform Seller ID', type: 'text', required: false, showIf: 'mxExperience=是' },
    { key: 'rfcTax', label: '是否有RFC税号', en: 'Whether has Mexico RFC Tax Number', type: 'select', required: true },
  ] },
  { id: 'verification', name: '五要素5FA', fields: clone(US_STEPS[3].fields) },
  { id: 'confirmation', name: '确认提交', fields: [] },
]


const LEGACY_STANDARDS: Record<RegistrationSite, LegacyStep[]> = { US: US_STEPS, CA: clone(US_STEPS), MX: MX_STEPS }
const STORAGE_KEY = 'walmart-admin-registration-template:v2'
const LEGACY_STORAGE_PREFIX = 'walmart-admin-registration-templates:v1:'
const CHANGE_EVENT = 'walmart-admin:registration-templates-changed'
const FIELD_TYPE_VALUES = new Set(FIELD_TYPES.map(({ value }) => value))
const VALIDATION_VALUES = new Set(VALIDATE_RULES.map(({ value }) => value))
const LEGACY_FIELD_KEYS = ['key', 'label', 'en', 'type', 'required', 'sensitive', 'showIf', 'placeholder', 'validate', 'options']
const FIELD_KEYS = [...LEGACY_FIELD_KEYS, 'applicableSites']
const CANONICAL_GROUPS = new Map<string, string>()
for (const site of INTERNAL_SITES) {
  for (const step of LEGACY_STANDARDS[site]) {
    for (const field of step.fields) {
      if (!CANONICAL_GROUPS.has(field.key)) CANONICAL_GROUPS.set(field.key, step.id === 'expansion' ? 'business' : step.id)
    }
  }
}

function emptySteps(): RegistrationStep[] {
  return US_STEPS.map(({ id, name }) => ({ id, name, fields: [] }))
}

function buildStandardUnion(): RegistrationStep[] {
  const steps = emptySteps()
  const keys = new Set<string>()
  for (const site of INTERNAL_SITES) {
    for (const step of LEGACY_STANDARDS[site]) {
      for (const field of step.fields) {
        if (keys.has(field.key)) continue
        keys.add(field.key)
        const target = steps.find(({ id }) => id === CANONICAL_GROUPS.get(field.key))!
        target.fields.push({ ...clone(field), applicableSites: [...INTERNAL_SITES] })
      }
    }
  }
  return steps
}
const STANDARD_STEPS = buildStandardUnion()

function assertSite(site: unknown): asserts site is RegistrationSite {
  if (typeof site !== 'string' || !INTERNAL_SITES.includes(site as RegistrationSite)) throw new Error('不支持的入驻站点。')
}

function isObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function assertKnownKeys(value: Record<string, unknown>, keys: string[], context: string): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) {
    throw new Error(`${context}包含无法识别的配置项。`)
  }
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validateStepData(steps: unknown, legacySite?: RegistrationSite): void {
  const standard = legacySite ? LEGACY_STANDARDS[legacySite] : STANDARD_STEPS
  if (!Array.isArray(steps) || steps.length !== standard.length) {
    throw new Error('入驻表单必须保留固定的 5 个步骤，不能新增或删除步骤。')
  }
  const fieldKeys = new Set<string>()
  steps.forEach((step: unknown, index) => {
    if (!isObject(step)) throw new Error('步骤配置格式不正确。')
    assertKnownKeys(step, ['id', 'name', 'fields'], '步骤')
    if (step.id !== standard[index].id || step.name !== standard[index].name) {
      throw new Error('步骤编号、名称和顺序必须与标准模板一致。')
    }
    if (!Array.isArray(step.fields)) throw new Error('步骤字段必须为数组。')
    if (step.id === 'confirmation' && step.fields.length !== 0) {
      throw new Error('确认提交步骤不支持新增字段。')
    }
    step.fields.forEach((field: unknown) => {
      if (!isObject(field)) throw new Error('字段配置格式不正确。')
      assertKnownKeys(field, legacySite ? LEGACY_FIELD_KEYS : FIELD_KEYS, '字段')
      if (!isNonemptyString(field.key) || !isNonemptyString(field.label)) {
        throw new Error('每个字段必须填写字段 Key 和字段名称。')
      }
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field.key)) {
        throw new Error('字段 Key 必须以字母开头，且只能包含字母、数字和下划线。')
      }
      if (!legacySite) {
        if (!Array.isArray(field.applicableSites) || field.applicableSites.length === 0
          || field.applicableSites.some((site: unknown) => typeof site !== 'string' || !INTERNAL_SITES.includes(site as RegistrationSite))
          || new Set(field.applicableSites).size !== field.applicableSites.length) {
          throw new Error(`字段「${field.label}」必须选择至少一个有效且不重复的适用站点。`)
        }
      }
      const key = field.key.trim()
      if (fieldKeys.has(key)) throw new Error(`字段 Key「${key}」重复，请使用唯一 Key。`)
      fieldKeys.add(key)
      if (!isNonemptyString(field.en) || typeof field.required !== 'boolean') {
        throw new Error(`字段「${field.label}」的英文名称或必填配置格式不正确。`)
      }
      if (typeof field.type !== 'string' || !FIELD_TYPE_VALUES.has(field.type)) {
        throw new Error(`字段「${field.label}」使用了不支持的字段类型。`)
      }
      if (field.sensitive !== undefined && typeof field.sensitive !== 'boolean') {
        throw new Error(`字段「${field.label}」的敏感标记必须为布尔值。`)
      }
      for (const optional of ['showIf', 'placeholder']) {
        if (field[optional] !== undefined && typeof field[optional] !== 'string') {
          throw new Error(`字段「${field.label}」的提示或显示条件格式不正确。`)
        }
      }
      if (field.validate !== undefined && (typeof field.validate !== 'string' || !VALIDATION_VALUES.has(field.validate))) {
        throw new Error(`字段「${field.label}」使用了不支持的校验规则。`)
      }
      if (field.options !== undefined && (!Array.isArray(field.options) || field.options.some((option: unknown) => !isNonemptyString(option)))) {
        throw new Error(`字段「${field.label}」的选项必须为非空文字组成的数组。`)
      }
    })
  })
  const allFields = (steps as RegistrationStep[]).flatMap((step) => step.fields)
  const fieldsByKey = new Map(allFields.map((field) => [field.key, field]))
  const dependencies = new Map<string, string>()
  for (const step of steps as RegistrationStep[]) {
    for (const field of step.fields) {
      if (!field.showIf?.trim()) continue
      const condition = /^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/.exec(field.showIf.trim())
      if (!condition || !condition[2].trim()) {
        throw new Error(`字段「${field.label}」的显示条件必须使用 Key=值 格式。`)
      }
      if (condition[1] === field.key || !fieldKeys.has(condition[1])) {
        throw new Error(`字段「${field.label}」的显示条件必须引用表单中存在的其他字段。`)
      }
      if (!legacySite) {
        const parent = fieldsByKey.get(condition[1])!
        const missingSites = field.applicableSites.filter((site) => !parent.applicableSites.includes(site))
        if (missingSites.length > 0) {
          throw new Error(`字段「${field.label}」依赖「${parent.label}」，父字段还需适用于 ${missingSites.join('、')} 站点。`)
        }
      }
      dependencies.set(field.key, condition[1])
    }
  }
  const checked = new Set<string>()
  for (const fieldKey of dependencies.keys()) {
    const path = new Set<string>()
    let current = fieldKey
    while (dependencies.has(current) && !checked.has(current)) {
      if (path.has(current)) {
        throw new Error(`字段显示条件存在循环引用（${current}），请移除循环条件。`)
      }
      path.add(current)
      current = dependencies.get(current)!
    }
    path.forEach((key) => checked.add(key))
  }
}

function validateRevisionMetadata(value: unknown): asserts value is Record<string, unknown> & RevisionMetadata {
  if (!isObject(value)) throw new Error('模板版本格式不正确。')
  assertKnownKeys(value, ['steps', 'version', 'updatedAt', 'updatedBy'], '模板版本')
  if (!Number.isSafeInteger(value.version) || (value.version as number) < 1 || !isNonemptyString(value.updatedBy)) {
    throw new Error('模板版本号或更新人格式不正确。')
  }
  if (value.updatedAt !== null && (typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt)))) {
    throw new Error('模板更新时间格式不正确。')
  }
}

function validateRevision(value: unknown): asserts value is TemplateRevision {
  validateRevisionMetadata(value)
  validateStepData(value.steps)
}

function validateState(value: unknown): asserts value is RegistrationTemplateState {
  if (!isObject(value)) throw new Error('统一表单配置格式不正确。')
  assertKnownKeys(value, ['published', 'draft'], '统一表单配置')
  validateRevision(value.published)
  if (value.draft !== undefined) {
    validateRevision(value.draft)
    if (value.draft.version !== value.published.version + 1) throw new Error('草稿版本必须为已发布模板的下一版本。')
  }
}

function validateLegacyState(site: RegistrationSite, value: unknown): asserts value is LegacyState {
  if (!isObject(value)) throw new Error(`${site} 旧站点模板格式不正确。`)
  assertKnownKeys(value, ['site', 'published', 'draft'], '旧站点模板')
  if (value.site !== site) throw new Error('旧模板所属站点与存储站点不一致。')
  validateRevisionMetadata(value.published)
  validateStepData(value.published.steps, site)
  if (value.draft !== undefined) {
    validateRevisionMetadata(value.draft)
    validateStepData(value.draft.steps, site)
    if (value.draft.version !== value.published.version + 1) throw new Error('旧草稿版本必须为已发布模板的下一版本。')
  }
}

function getStorage(): Storage {
  if (typeof localStorage === 'undefined') throw new Error('当前环境无法使用本地存储，入驻表单配置未保存。')
  return localStorage
}

function readRaw(key: string): string | null {
  try { return getStorage().getItem(key) } catch {
    throw new Error('无法读取入驻表单配置，请检查浏览器的本地存储权限。')
  }
}

function parseEnvelope(raw: string, schemaVersion: number, context: string): Record<string, unknown> {
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new Error(`${context}已损坏，无法读取；原数据未被覆盖。`) }
  if (!isObject(value)) throw new Error(`${context}存储格式不正确，原数据未被覆盖。`)
  assertKnownKeys(value, ['schemaVersion', 'template'], context)
  if (value.schemaVersion !== schemaVersion) throw new Error(`${context}存储版本不受支持，原数据未被覆盖。`)
  return value
}

interface MergeResult { revision: TemplateRevision; conflicts: Set<string>; tied: Set<string> }
interface FieldCandidate { field: RegistrationField; group: string; timestamp: number }
function timestamp(revision: RevisionMetadata): number { return revision.updatedAt === null ? Number.NEGATIVE_INFINITY : Date.parse(revision.updatedAt) }

function definitionKey(candidate: FieldCandidate): string {
  return JSON.stringify([candidate.group, ...FIELD_KEYS.map((key) => candidate.field[key as keyof RegistrationField] ?? null)])
}

function mergeLegacyRevisions(revisions: LegacyRevision[], version: number): MergeResult {
  const fields = new Map<string, FieldCandidate>()
  const conflicts = new Set<string>()
  const tied = new Set<string>()
  let latest = revisions[0]
  for (const revision of revisions) {
    if (timestamp(revision) > timestamp(latest)) latest = revision
    for (const step of revision.steps) {
      for (const field of step.fields) {
        const candidate: FieldCandidate = {
          field: { ...clone(field), applicableSites: [...INTERNAL_SITES] },
          group: CANONICAL_GROUPS.get(field.key) ?? (step.id === 'expansion' ? 'business' : step.id),
          timestamp: timestamp(revision),
        }
        const previous = fields.get(field.key)
        if (previous && definitionKey(previous) !== definitionKey(candidate)) {
          conflicts.add(field.key)
          if (previous.timestamp === candidate.timestamp) tied.add(field.key)
        }
        // 相同更新时间按 US、CA、MX 的固定输入顺序保留先出现的定义。
        if (!previous || candidate.timestamp > previous.timestamp) fields.set(field.key, candidate)
      }
    }
  }
  const steps = emptySteps()
  for (const { field, group } of fields.values()) {
    const target = steps.find(({ id }) => id === group)
    if (!target) throw new Error(`旧字段「${field.label}」无法归入固定步骤，原数据未被覆盖。`)
    target.fields.push(field)
  }
  const revision: TemplateRevision = { steps, version, updatedAt: latest.updatedAt, updatedBy: latest.updatedBy }
  return { revision, conflicts, tied }
}

function migrateLegacy(): RegistrationTemplateState {
  let storedCount = 0
  const states = INTERNAL_SITES.map((site): LegacyState => {
    const raw = readRaw(LEGACY_STORAGE_PREFIX + site)
    if (raw === null) return { site, published: { steps: clone(LEGACY_STANDARDS[site]), version: 1, updatedAt: null, updatedBy: '系统预设' } }
    storedCount++
    const envelope = parseEnvelope(raw, 1, `${site} 旧站点表单配置`)
    validateLegacyState(site, envelope.template)
    return envelope.template
  })
  if (storedCount === 0) return { published: { steps: getStandardTemplate(), version: 1, updatedAt: null, updatedBy: '系统预设' } }
  const publishedVersion = Math.max(...states.map(({ published }) => published.version))
  const merged = mergeLegacyRevisions(states.map(({ published }) => published), publishedVersion)
  const state: RegistrationTemplateState = { published: merged.revision }
  const conflictKeys = new Set(merged.conflicts)
  const tiedKeys = new Set(merged.tied)
  if (states.some(({ draft }) => draft !== undefined)) {
    const draft = mergeLegacyRevisions(states.map((item) => item.draft ?? item.published), publishedVersion + 1)
    state.draft = draft.revision
    draft.conflicts.forEach((key) => conflictKeys.add(key))
    draft.tied.forEach((key) => tiedKeys.add(key))
  }
  try { validateState(state) } catch (error) {
    throw new Error(`旧三站配置合并后需要检查：${error instanceof Error ? error.message : '配置不兼容'} 旧配置已保留，尚未写入统一配置。`)
  }
  const keys = [...conflictKeys]
  const conflictNotice = keys.length ? ` ${keys.length} 个同 Key 字段定义不一致，已按最近更新时间合并（${keys.slice(0, 8).join('、')}${keys.length > 8 ? '等' : ''}）。` : ''
  const tieNotice = tiedKeys.size ? ' 更新时间相同的冲突按 US→CA→MX 顺序优先。' : ''
  state.migrationNotice = `已合并旧三站配置并按固定五步骤归组；字段默认适用于全部站点。旧配置已保留，保存后启用统一配置。${conflictNotice}${tieNotice}`
  return state
}

function writeState(state: RegistrationTemplateState): RegistrationTemplateState {
  const stored: RegistrationTemplateState = {
    published: clone(state.published),
    ...(state.draft ? { draft: clone(state.draft) } : {}),
  }
  validateState(stored)
  try { getStorage().setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, template: stored })) } catch {
    throw new Error('入驻表单配置保存失败，请检查浏览器的存储权限和可用空间；原配置未更新。')
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
  return clone(stored)
}

export function getStandardTemplate(): RegistrationStep[] { return clone(STANDARD_STEPS) }

export function validateRegistrationSteps(steps: RegistrationStep[]): void { validateStepData(steps) }

export function filterRegistrationSteps(steps: RegistrationStep[], site: RegistrationSite): RegistrationStep[] {
  assertSite(site)
  validateRegistrationSteps(steps)
  return steps.map((step) => ({ ...step, fields: step.fields.filter((field) => field.applicableSites.includes(site)).map((field) => clone(field)) }))
}

export function loadRegistrationTemplate(): RegistrationTemplateState {
  const raw = readRaw(STORAGE_KEY)
  if (raw === null) return migrateLegacy()
  const envelope = parseEnvelope(raw, 2, '统一入驻表单配置')
  validateState(envelope.template)
  return envelope.template
}

function makeRevision(steps: RegistrationStep[], version: number): TemplateRevision {
  return { steps: clone(steps), version, updatedAt: new Date().toISOString(), updatedBy: getCurrentAdmin().name }
}

export function saveRegistrationDraft(steps: RegistrationStep[]): RegistrationTemplateState {
  assertCanConfigureRegistrationForm()
  validateRegistrationSteps(steps)
  const state = loadRegistrationTemplate()
  return writeState({ published: state.published, draft: makeRevision(steps, state.published.version + 1) })
}

export function publishRegistrationTemplate(steps: RegistrationStep[]): RegistrationTemplateState {
  assertCanConfigureRegistrationForm()
  validateRegistrationSteps(steps)
  const state = loadRegistrationTemplate()
  return writeState({ published: makeRevision(steps, state.published.version + 1) })
}

export function discardRegistrationDraft(): RegistrationTemplateState {
  assertCanConfigureRegistrationForm()
  const state = loadRegistrationTemplate()
  return writeState({ published: state.published })
}

export function subscribeRegistrationTemplates(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY || INTERNAL_SITES.some((site) => event.key === LEGACY_STORAGE_PREFIX + site)) listener()
  }
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => { window.removeEventListener(CHANGE_EVENT, listener); window.removeEventListener('storage', onStorage) }
}
