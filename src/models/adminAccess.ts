import { useEffect, useState } from 'react'

export type PreviewRole = 'superadmin' | 'admin' | 'operator' | 'bd'
export interface PreviewUser { id: string; name: string; role: PreviewRole; permissions: string[] }
export type RolePermissions = Record<PreviewRole, string[]>

export const FORM_CONFIG_PERMISSION = 'register.form.configure'
export const SETTINGS_PERMISSION_MANAGE = 'settings.permission.manage'
export const FORM_VIEW_PERMISSION = 'register.form.view'

const STORAGE_KEY = 'walmart-admin-role-permissions-v1'
const PREVIEW_USER_KEY = 'walmart-admin-preview-user-v1'
const CHANGE_EVENT = 'walmart-admin-access-change'
const DEVELOPMENT_PREVIEW = import.meta.env.DEV
type PreviewIdentity = Readonly<Pick<PreviewUser, 'id' | 'name' | 'role'>>
export const PREVIEW_USERS: readonly PreviewIdentity[] = Object.freeze([
  Object.freeze({ id: 'preview-admin', name: '管理员', role: 'admin' as const }),
  Object.freeze({ id: 'preview-bd-1', name: '招商经理 A', role: 'bd' as const }),
  Object.freeze({ id: 'preview-bd-2', name: '招商经理 B', role: 'bd' as const }),
  Object.freeze({ id: 'preview-operator', name: '运营', role: 'operator' as const }),
])
const ROLES: PreviewRole[] = ['superadmin', 'admin', 'operator', 'bd']
const BUSINESS_PERMISSIONS = ['r1', 'r2', FORM_VIEW_PERMISSION, FORM_CONFIG_PERMISSION, 'r4', 'g1', 'g2', 'g3', 'c1', 'c2', 'a1', 'a2']
const KNOWN_PERMISSIONS = new Set([...BUSINESS_PERMISSIONS, 's1', SETTINGS_PERMISSION_MANAGE])
const DEFAULT_PERMISSIONS: RolePermissions = {
  superadmin: [...BUSINESS_PERMISSIONS, 's1', SETTINGS_PERMISSION_MANAGE],
  admin: [...BUSINESS_PERMISSIONS, 's1', SETTINGS_PERMISSION_MANAGE],
  operator: ['g1', 'g2', 'g3', 'c1', 'c2', 'a1', 'a2'],
  bd: ['r1', 'r2', FORM_VIEW_PERMISSION],
}

function normalizePermissions(role: PreviewRole, permissions: string[]): string[] {
  const administrator = role === 'admin' || role === 'superadmin'
  const result = [...new Set(permissions)].filter((permission) => KNOWN_PERMISSIONS.has(permission)
    && (administrator || (permission !== FORM_CONFIG_PERMISSION && permission !== SETTINGS_PERMISSION_MANAGE)))
  // 本地预览没有登录流程，保留管理员管理授权的入口，避免撤销表单权限后无法恢复。
  if (administrator && !result.includes(SETTINGS_PERMISSION_MANAGE)) result.push(SETTINGS_PERMISSION_MANAGE)
  return result
}

export function canConfigureRegistrationForm(user: PreviewUser | null | undefined): boolean {
  return !!user && typeof user.id === 'string' && !!user.id.trim()
    && (user.role === 'admin' || user.role === 'superadmin')
    && Array.isArray(user.permissions) && user.permissions.includes(FORM_CONFIG_PERMISSION)
}

export function canManageOwnRegistrationForms(user: PreviewUser | null | undefined): boolean {
  return !!user && user.role === 'bd' && typeof user.id === 'string' && !!user.id.trim()
}

export function readRolePermissions(): RolePermissions {
  let stored: string | null
  try {
    if (typeof window === 'undefined') throw new Error('Browser unavailable')
    stored = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    throw new Error('无法读取本地角色权限，入驻表单已切换为只读。请检查浏览器的站点存储设置后重试。')
  }
  if (stored === null) {
    return Object.fromEntries(ROLES.map((role) => [role, [...DEFAULT_PERMISSIONS[role]]])) as RolePermissions
  }
  try {
    const data: unknown = JSON.parse(stored)
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid permissions')
    const record = data as { version?: unknown; roles?: unknown }
    if (record.version !== 1 || !record.roles || typeof record.roles !== 'object' || Array.isArray(record.roles)) throw new Error('Invalid permissions')
    const roles = record.roles as Record<string, unknown>
    const entries = ROLES.map((role) => {
      const permissions = roles[role]
      if (!Array.isArray(permissions) || !permissions.every((permission) => typeof permission === 'string')) throw new Error('Invalid permissions')
      return [role, normalizePermissions(role, permissions)]
    })
    return Object.fromEntries(entries) as RolePermissions
  } catch {
    throw new Error('本地角色权限数据格式异常，入驻表单已切换为只读。请检查本地授权数据后重试。')
  }
}

export function getCurrentAdmin(): PreviewUser {
  try {
    // 当前项目仅有本地演示身份。生产构建忽略开发预览选择，不接管真实登录。
    const selectedId = DEVELOPMENT_PREVIEW ? window.sessionStorage.getItem(PREVIEW_USER_KEY) : null
    const identity = PREVIEW_USERS.find((user) => user.id === (selectedId ?? 'preview-admin'))
    if (!identity) throw new Error('Unknown preview identity')
    const permissions = readRolePermissions()[identity.role]
    return { ...identity, permissions }
  } catch {
    // 无效身份或损坏授权均不可修改标准表单、专属表单或角色权限。
    return { id: '', name: '只读预览（身份或授权不可用）', role: 'operator', permissions: [] }
  }
}

export function setPreviewUser(id: string): void {
  if (!DEVELOPMENT_PREVIEW) throw new Error('身份切换仅用于本地开发预览。')
  if (typeof id !== 'string' || !PREVIEW_USERS.some((user) => user.id === id)) {
    throw new Error('请选择预设的本地演示账户。')
  }
  try {
    window.sessionStorage.setItem(PREVIEW_USER_KEY, id)
  } catch {
    throw new Error('预览身份切换失败，请检查当前标签页的站点存储设置。')
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function assertCanConfigureRegistrationForm(): void {
  if (!canConfigureRegistrationForm(getCurrentAdmin())) {
    throw new Error('仅具备“修改标准入驻表单”权限的管理员或超级管理员可以修改入驻表单。')
  }
}

export function assertCanManageOwnRegistrationForms(): PreviewUser {
  const user = getCurrentAdmin()
  if (!canManageOwnRegistrationForms(user)) {
    throw new Error('仅招商经理（BD）可以创建和修改自己名下的专属入驻表单。')
  }
  return user
}

export function saveRolePermissions(role: PreviewRole, permissions: string[]): void {
  if (!getCurrentAdmin().permissions.includes(SETTINGS_PERMISSION_MANAGE)) {
    throw new Error('当前账号没有管理角色权限的权限。')
  }
  if (!ROLES.includes(role) || !Array.isArray(permissions) || !permissions.every((permission) => typeof permission === 'string')) {
    throw new Error('角色授权数据格式不正确。')
  }
  const roles = readRolePermissions()
  roles[role] = normalizePermissions(role, permissions)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, roles }))
  } catch {
    throw new Error('角色权限保存失败。请检查浏览器可用存储空间和站点存储设置，当前勾选已保留。')
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeAdminAccess(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null || (DEVELOPMENT_PREVIEW && event.key === PREVIEW_USER_KEY)) listener()
  }
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useCurrentAdmin(): PreviewUser {
  const [user, setUser] = useState<PreviewUser>(getCurrentAdmin)
  useEffect(() => {
    const update = () => setUser(getCurrentAdmin())
    const unsubscribe = subscribeAdminAccess(update)
    update()
    return unsubscribe
  }, [])
  return user
}
