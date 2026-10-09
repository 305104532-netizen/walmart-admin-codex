export const MAX_CATEGORY_DEPTH = 5

export type CategoryDomain = 'content' | 'course'

export interface TaxonomyCategory {
  id: string
  name: string
  parentId: string | null
  sortOrder: number
}

export interface CategoryOption {
  value: string
  label: string
  children?: CategoryOption[]
}

export const DEFAULT_CONTENT_CATEGORIES: TaxonomyCategory[] = [
  { id: 'traffic', name: '流量秘籍', parentId: null, sortOrder: 1 },
  { id: 'traffic-1', name: '报告分析', parentId: 'traffic', sortOrder: 1 },
  { id: 'traffic-2', name: '快速入门', parentId: 'traffic', sortOrder: 2 },
  { id: 'tools', name: '平台工具', parentId: null, sortOrder: 2 },
  { id: 'tools-1', name: '最新资讯', parentId: 'tools', sortOrder: 1 },
  { id: 'logistics', name: '物流指南', parentId: null, sortOrder: 3 },
  { id: 'logistics-1', name: 'WFS', parentId: 'logistics', sortOrder: 1 },
  { id: 'policy', name: '政策条款', parentId: null, sortOrder: 4 },
  { id: 'policy-1', name: '政策条款', parentId: 'policy', sortOrder: 1 },
  { id: 'policy-2', name: '入驻指导', parentId: 'policy', sortOrder: 2 },
  { id: 'policy-3', name: '快速入门', parentId: 'policy', sortOrder: 3 },
  { id: 'operation', name: '运营干货', parentId: null, sortOrder: 5 },
  { id: 'op-1', name: '快速入门', parentId: 'operation', sortOrder: 1 },
  { id: 'op-2', name: 'WFS', parentId: 'operation', sortOrder: 2 },
  { id: 'op-3', name: 'SWW', parentId: 'operation', sortOrder: 3 },
  { id: 'op-4', name: '自发货', parentId: 'operation', sortOrder: 4 },
  { id: 'op-5', name: '运营宝典', parentId: 'operation', sortOrder: 5 },
  { id: 'op-6', name: '成功卖家', parentId: 'operation', sortOrder: 6 },
  { id: 'op-7', name: '全渠道卖家', parentId: 'operation', sortOrder: 7 },
]

export const DEFAULT_COURSE_CATEGORIES: TaxonomyCategory[] = [
  { id: 'entry', name: '入驻必修', parentId: null, sortOrder: 1 },
  { id: 'operation', name: '运营进阶', parentId: null, sortOrder: 2 },
  { id: 'logistics', name: '物流专题', parentId: null, sortOrder: 3 },
  { id: 'ads', name: '广告专题', parentId: null, sortOrder: 4 },
]

const STORAGE_KEYS: Record<CategoryDomain, string> = {
  content: 'walmart-admin-content-categories-v1',
  course: 'walmart-admin-course-categories-v1',
}

export function categoryPath(categories: TaxonomyCategory[], id: string): TaxonomyCategory[] {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const seen = new Set<string>()
  const path: TaxonomyCategory[] = []
  let current = byId.get(id)
  while (current && !seen.has(current.id)) {
    path.unshift(current)
    seen.add(current.id)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return path
}

export function categoryOptions(categories: TaxonomyCategory[]): CategoryOption[] {
  const childrenOf = (parentId: string | null): CategoryOption[] => categories
    .filter((category) => category.parentId === parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .map((category) => {
      const children = childrenOf(category.id)
      return { value: category.id, label: category.name, ...(children.length ? { children } : {}) }
    })
  return childrenOf(null)
}

export function categoryBranchHeight(categories: TaxonomyCategory[], id: string): number {
  const children = categories.filter((category) => category.parentId === id)
  return 1 + Math.max(0, ...children.map((child) => categoryBranchHeight(categories, child.id)))
}

export function isCategoryOrDescendant(categories: TaxonomyCategory[], id: string, ancestorId: string): boolean {
  return categoryPath(categories, id).some((category) => category.id === ancestorId)
}

function validCategories(value: unknown): value is TaxonomyCategory[] {
  if (!Array.isArray(value) || value.length > 500) return false
  const ids = new Set<string>()
  for (const category of value) {
    if (!category || typeof category !== 'object' || typeof category.id !== 'string' || !category.id
      || typeof category.name !== 'string' || !category.name.trim()
      || (category.parentId !== null && typeof category.parentId !== 'string')
      || !Number.isInteger(category.sortOrder) || category.sortOrder < 1 || ids.has(category.id)) return false
    ids.add(category.id)
  }
  return value.every((category) => {
    const path = categoryPath(value, category.id)
    return path.length <= MAX_CATEGORY_DEPTH && path[0]?.parentId === null
      && (!category.parentId || ids.has(category.parentId))
      && new Set(path.map((item) => item.id)).size === path.length
  })
}

export function loadCategories(domain: CategoryDomain): TaxonomyCategory[] {
  const defaults = domain === 'content' ? DEFAULT_CONTENT_CATEGORIES : DEFAULT_COURSE_CATEGORIES
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[domain])
    if (!raw) return defaults
    const stored: unknown = JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null || !('version' in stored) || stored.version !== 1
      || !('categories' in stored) || !validCategories(stored.categories)) return defaults
    return stored.categories
  } catch {
    return defaults
  }
}

export function saveCategories(domain: CategoryDomain, categories: TaxonomyCategory[]): void {
  if (!validCategories(categories)) throw new Error('Invalid category tree')
  window.localStorage.setItem(STORAGE_KEYS[domain], JSON.stringify({ version: 1, categories }))
}
