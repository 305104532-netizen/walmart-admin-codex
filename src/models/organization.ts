export type OrganizationSite = 'US' | 'CA' | 'MX'
export type OrganizationUnitType = 'center' | 'business' | 'region' | 'function' | 'team'
export type OrganizationStatus = 'enabled' | 'disabled'
export type OrganizationMemberRole = 'superadmin' | 'admin' | 'operator' | 'bd'

export interface OrganizationUnit {
  id: string
  parentId: string | null
  name: string
  code: string
  type: OrganizationUnitType
  sites: OrganizationSite[]
  leaderId?: string
  description?: string
  status: OrganizationStatus
}

export interface OrganizationMember {
  id: string
  employeeNo: string
  name: string
  email: string
  role: OrganizationMemberRole
  departmentId: string
  sites: OrganizationSite[]
  status: OrganizationStatus
}

export interface OrganizationState {
  version: 1
  units: OrganizationUnit[]
  members: OrganizationMember[]
}

const STORAGE_KEY = 'walmart-admin-organization-v1'

const DEFAULT_STATE: OrganizationState = {
  version: 1,
  units: [
    { id: 'seller-growth-center', parentId: null, name: '沃尔玛跨境电商卖家增长中心', code: 'SGC', type: 'center', sites: ['US', 'CA', 'MX'], leaderId: 'member-admin', status: 'enabled', description: '统一负责卖家招募、入驻、成长、内容活动及数据系统运营。' },
    { id: 'seller-acquisition', parentId: 'seller-growth-center', name: '卖家招商部', code: 'BD', type: 'business', sites: ['US', 'CA', 'MX'], leaderId: 'member-bd-lead', status: 'enabled', description: '负责活动获客、线索分配、卖家邀约与入驻转化。' },
    { id: 'bd-east', parentId: 'seller-acquisition', name: '华东招商组', code: 'BD-EAST', type: 'region', sites: ['US', 'CA', 'MX'], leaderId: 'member-bd-a', status: 'enabled' },
    { id: 'bd-south', parentId: 'seller-acquisition', name: '华南招商组', code: 'BD-SOUTH', type: 'region', sites: ['US', 'CA', 'MX'], leaderId: 'member-bd-b', status: 'enabled' },
    { id: 'onboarding-operations', parentId: 'seller-growth-center', name: '入驻运营部', code: 'ONBOARDING', type: 'business', sites: ['US', 'CA', 'MX'], leaderId: 'member-onboarding', status: 'enabled', description: '负责标准入驻表单、五要素预审、审核进度及学习提醒。' },
    { id: 'seller-growth', parentId: 'seller-growth-center', name: '卖家成长运营部', code: 'GROWTH', type: 'business', sites: ['US', 'CA', 'MX'], leaderId: 'member-growth', status: 'enabled', description: '负责卖家画像、评分、课程分发与成长效果。' },
    { id: 'content-event', parentId: 'seller-growth-center', name: '内容与活动运营部', code: 'CONTENT-EVENT', type: 'function', sites: ['US', 'CA', 'MX'], leaderId: 'member-event', status: 'enabled', description: '负责内容、线上活动及沃尔玛峰会的统一运营。' },
    { id: 'data-system', parentId: 'seller-growth-center', name: '数据与系统管理组', code: 'DATA-SYSTEM', type: 'function', sites: ['US', 'CA', 'MX'], leaderId: 'member-admin', status: 'enabled', description: '负责数据看板、账号权限、组织架构和操作审计。' },
  ],
  members: [
    { id: 'member-admin', employeeNo: 'WM0001', name: '系统管理员', email: 'admin@walmart-demo.com', role: 'admin', departmentId: 'data-system', sites: ['US', 'CA', 'MX'], status: 'enabled' },
    { id: 'member-bd-lead', employeeNo: 'WM1001', name: '张招商', email: 'bd.lead@walmart-demo.com', role: 'bd', departmentId: 'seller-acquisition', sites: ['US', 'CA', 'MX'], status: 'enabled' },
    { id: 'member-bd-a', employeeNo: 'WM1101', name: '招商经理 A', email: 'bd.a@walmart-demo.com', role: 'bd', departmentId: 'bd-east', sites: ['US', 'CA'], status: 'enabled' },
    { id: 'member-bd-b', employeeNo: 'WM1201', name: '招商经理 B', email: 'bd.b@walmart-demo.com', role: 'bd', departmentId: 'bd-south', sites: ['US', 'MX'], status: 'enabled' },
    { id: 'member-onboarding', employeeNo: 'WM2001', name: '李入驻', email: 'onboarding@walmart-demo.com', role: 'operator', departmentId: 'onboarding-operations', sites: ['US', 'CA', 'MX'], status: 'enabled' },
    { id: 'member-growth', employeeNo: 'WM3001', name: '王成长', email: 'growth@walmart-demo.com', role: 'operator', departmentId: 'seller-growth', sites: ['US', 'CA', 'MX'], status: 'enabled' },
    { id: 'member-event', employeeNo: 'WM4001', name: '陈活动', email: 'event@walmart-demo.com', role: 'operator', departmentId: 'content-event', sites: ['US', 'CA', 'MX'], status: 'enabled' },
  ],
}

function assertState(value: unknown): asserts value is OrganizationState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('组织架构数据格式不正确。')
  const state = value as Partial<OrganizationState>
  if (state.version !== 1 || !Array.isArray(state.units) || !Array.isArray(state.members)) throw new Error('组织架构数据版本不受支持。')
  const unitIds = new Set<string>()
  for (const unit of state.units) {
    if (!unit || typeof unit !== 'object' || typeof unit.id !== 'string' || !unit.id || typeof unit.name !== 'string' || !unit.name
      || typeof unit.code !== 'string' || !unit.code || !['center', 'business', 'region', 'function', 'team'].includes(unit.type)
      || !Array.isArray(unit.sites) || !unit.sites.every((site) => ['US', 'CA', 'MX'].includes(site))
      || !['enabled', 'disabled'].includes(unit.status) || unitIds.has(unit.id)) throw new Error('组织架构中存在无效部门。')
    unitIds.add(unit.id)
  }
  if (state.units.filter((unit) => unit.parentId === null).length !== 1
    || state.units.some((unit) => unit.parentId !== null && !unitIds.has(unit.parentId))) throw new Error('组织架构上下级关系不完整。')
  const memberIds = new Set<string>()
  for (const member of state.members) {
    if (!member || typeof member !== 'object' || typeof member.id !== 'string' || !member.id || memberIds.has(member.id)
      || typeof member.name !== 'string' || !member.name || typeof member.employeeNo !== 'string' || !member.employeeNo
      || typeof member.email !== 'string' || !member.email || !['superadmin', 'admin', 'operator', 'bd'].includes(member.role)
      || !unitIds.has(member.departmentId) || !Array.isArray(member.sites) || !member.sites.every((site) => ['US', 'CA', 'MX'].includes(site))
      || !['enabled', 'disabled'].includes(member.status)) throw new Error('组织架构中存在无效成员。')
    memberIds.add(member.id)
  }
}

export function readOrganization(): OrganizationState {
  let raw: string | null
  try { raw = window.localStorage.getItem(STORAGE_KEY) }
  catch { throw new Error('无法读取组织架构，请检查浏览器站点存储设置。') }
  if (raw === null) return structuredClone(DEFAULT_STATE)
  try {
    const state: unknown = JSON.parse(raw)
    assertState(state)
    return structuredClone(state)
  } catch (cause) {
    throw new Error(cause instanceof Error ? cause.message : '组织架构数据格式不正确。')
  }
}

export function saveOrganization(state: OrganizationState): OrganizationState {
  assertState(state)
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }
  catch { throw new Error('组织架构保存失败，请检查浏览器可用存储空间。') }
  return structuredClone(state)
}

export function resetOrganization(): OrganizationState {
  const state = structuredClone(DEFAULT_STATE)
  return saveOrganization(state)
}

