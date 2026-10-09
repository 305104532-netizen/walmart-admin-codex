export type CourseCategory = string
export type CourseRequirement = 'required' | 'elective'
export type CourseStatus = 'draft' | 'published'

export interface CourseLesson {
  id: string
  title: string
  durationMinutes: number
  videoUrl: string
  status: CourseStatus
}

export interface CourseAlbum {
  id: string
  title: string
  category: CourseCategory
  requirement: CourseRequirement
  description: string
  cover: string
  learners: number
  sortOrder: number
  status: CourseStatus
  lessons: CourseLesson[]
}

const STORAGE_KEY = 'walmart-admin-course-catalog-v1'
const cover = (name: string) => `${import.meta.env.BASE_URL}course-covers/${name}`
const lessons = (prefix: string, entries: Array<[string, number]>): CourseLesson[] => entries.map(([title, durationMinutes], index) => ({
  id: `${prefix}${index + 1}`, title, durationMinutes, videoUrl: '', status: 'published',
}))

export const DEFAULT_COURSE_ALBUMS: CourseAlbum[] = [
  {
    id: 'a1', title: '新手入驻全攻略', category: 'entry', requirement: 'required',
    description: '从资质准备到首批商品上架，完整掌握开店流程。', cover: cover('course1.jpg'),
    learners: 12000, sortOrder: 1, status: 'published',
    lessons: lessons('r', [
      ['入驻准备：资料清单与资质要求', 12], ['账号注册与业务验证', 18], ['店铺信息与品牌设置', 15],
      ['物流方式与运费模板', 20], ['首批商品上架实操', 25], ['提交激活申请与审核要点', 10],
    ]),
  },
  {
    id: 'a2', title: '爆款打造实战营', category: 'operation', requirement: 'elective',
    description: '从选品到运营的全链路方法，提升店铺转化。', cover: cover('course3.jpg'),
    learners: 8623, sortOrder: 2, status: 'published',
    lessons: lessons('o', [
      ['数据选品：趋势洞察与机会挖掘', 22], ['Listing 优化与转化提升', 18], ['定价策略与 Buy Box', 16],
      ['广告投放基础与进阶', 28], ['大促节奏与流量承接', 20], ['评价管理与复购运营', 14],
      ['数据复盘与增长迭代', 17], ['爆款案例全拆解', 30],
    ]),
  },
  {
    id: 'a3', title: '物流成本优化课', category: 'logistics', requirement: 'elective',
    description: '掌握 WFS 与头程服务，系统降低跨境物流成本。', cover: cover('course4.jpg'),
    learners: 6540, sortOrder: 3, status: 'published',
    lessons: lessons('l', [
      ['WFS 费用结构全解析', 15], ['自发货 vs WFS 成本对比', 12], ['头程运输方式与选择', 18],
      ['库存周转与仓储费优化', 16], ['退货物流与逆向成本', 10],
    ]),
  },
  {
    id: 'a4', title: '广告投放训练营', category: 'ads', requirement: 'elective',
    description: '从广告后台入门到 ROI 优化，建立投放方法论。', cover: cover('course5.jpg'),
    learners: 7218, sortOrder: 4, status: 'published',
    lessons: lessons('g', [
      ['广告后台与术语入门', 14], ['SP 广告搭建与优化', 22], ['SB/SV 品牌广告打法', 20],
      ['关键词策略与竞价', 18], ['广告数据分析与调优', 24], ['大促广告节奏规划', 16], ['ACOS 优化实战', 19],
    ]),
  },
]

export function loadCourseAlbums(): CourseAlbum[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COURSE_ALBUMS
    const stored: unknown = JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null || !('version' in stored) || stored.version !== 1 || !('albums' in stored) || !Array.isArray(stored.albums)) return DEFAULT_COURSE_ALBUMS
    return stored.albums as CourseAlbum[]
  } catch {
    return DEFAULT_COURSE_ALBUMS
  }
}

export function saveCourseAlbums(albums: CourseAlbum[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, albums }))
}
