export type SellerRegistrationStatus = 'unregistered' | 'pending' | 'online'
export type SellerSite = 'US' | 'CA' | 'MX'
export type SellerPersona = '基础培育' | '高意向待入驻' | '审核跟进' | '潜力成长' | '核心高质量'

export interface SellerBehaviorEvent {
  id: string
  time: string
  action: string
  object: string
  channel: string
}

export interface SellerTag {
  name: string
  type: 'auto' | 'custom'
  source: string
  updatedAt: string
}

export interface GrowthSeller {
  id: string
  name: string
  company: string
  email: string
  phone: string
  registrationStatus: SellerRegistrationStatus
  registrationProgress: number
  sites: SellerSite[]
  primarySite: SellerSite
  sellerId?: string
  category: string
  manager: string
  department: string
  source: string
  activity?: string
  bindDate: string
  submittedAt?: string
  onlineAt?: string
  fiveFaStatus: '未开始' | '审核中' | '已通过'
  legalEntity: string
  country: string
  formVersion: string
  lastActiveAt: string
  activeDays30: number
  pageViews30: number
  contentViews30: number
  courseHours: number
  courseCompletion: number
  activitiesJoined: number
  searches30: number
  favorites30: number
  persona: SellerPersona
  profileScore: number
  scores: {
    maturity: number
    activity: number
    learning: number
    registrationIntent: number
    growthValue: number
  }
  tags: SellerTag[]
  preferredCategories: string[]
  recommendation: string
  behaviors: SellerBehaviorEvent[]
}

const NAMES = ['王芳', '李强', '张明', '刘红', '陈静', '杨帆', '赵敏', '孙磊', '周涛', '吴婷', '郑凯', '何颖']
const COMPANIES = ['深圳创客科技', '广州跨境优选', '义乌小商品', '杭州智造', '东莞智能家居', '厦门优品', '宁波海贸', '上海选品汇', '苏州新消费', '泉州品牌出海']
const CATEGORIES = ['服饰鞋履', '消费电子', '家居与园艺', '母婴用品', '美容个护', '玩具和游戏', '汽车用品', '宠物用品']
const MANAGERS = [
  { name: '招商经理 A', department: '华东招商组' },
  { name: '招商经理 B', department: '华南招商组' },
  { name: '张招商', department: '卖家招商部' },
]
const ACTIVITIES = ['2026沃尔玛卖家峰会', '新手入门直播课', 'Q3选品趋势分享会']
const CONTENT = ['美国站入驻全流程', 'WFS 配送入门', '旺季选品趋势', '广告投放基础', '五要素审核指南']
function pad(value: number): string { return String(value).padStart(2, '0') }
function date(day: number, hour = 10, minute = 0): string { return `2026-08-${pad((day % 28) + 1)} ${pad(hour)}:${pad(minute)}` }

function statusFor(index: number): SellerRegistrationStatus {
  if (index % 5 === 0) return 'unregistered'
  if (index % 3 === 0) return 'pending'
  return 'online'
}

function sitesFor(index: number): SellerSite[] {
  const variants: SellerSite[][] = [['US'], ['US', 'CA'], ['US', 'MX'], ['CA'], ['MX'], ['US', 'CA', 'MX']]
  return variants[index % variants.length]
}

function personaFor(status: SellerRegistrationStatus, maturity: number, intent: number): SellerPersona {
  if (status === 'unregistered') return intent >= 65 ? '高意向待入驻' : '基础培育'
  if (status === 'pending') return '审核跟进'
  return maturity >= 72 ? '核心高质量' : '潜力成长'
}

function recommendationFor(persona: SellerPersona): string {
  return {
    基础培育: '推荐发送平台价值介绍和新卖家基础课程，观察内容浏览及入驻页访问变化。',
    高意向待入驻: '近期多次访问入驻页，建议招商经理在 24 小时内跟进并发送专属入驻表单。',
    审核跟进: '申请正在审核，优先核对五要素材料并提醒卖家补充缺失信息。',
    潜力成长: '已上线且保持学习活跃，推荐 WFS、广告投放和旺季选品进阶课程。',
    核心高质量: '高活跃高成熟卖家，建议纳入重点运营名单并邀请参加峰会及品牌增长项目。',
  }[persona]
}

function buildTags(index: number, status: SellerRegistrationStatus, activeDays: number, courseCompletion: number): SellerTag[] {
  const updatedAt = `2026-09-${pad((index % 8) + 1)}`
  const result: SellerTag[] = [
    { name: status === 'online' ? '已入驻' : status === 'pending' ? '审核中' : '未入驻', type: 'auto', source: '入驻状态', updatedAt },
    { name: activeDays >= 12 ? '高活跃' : activeDays >= 5 ? '中活跃' : '低活跃', type: 'auto', source: '近30天行为', updatedAt },
    { name: courseCompletion >= 70 ? '学习达人' : '课程待完成', type: 'auto', source: '学习行为', updatedAt },
  ]
  if (index % 2 === 0) result.push({ name: '未采用WFS服务', type: 'custom', source: '运营标记', updatedAt })
  if (index % 4 === 0) result.push({ name: '未投放广告', type: 'custom', source: '运营标记', updatedAt })
  if (index % 7 === 0) result.push({ name: '峰会邀约人群', type: 'custom', source: '活动运营', updatedAt })
  return result
}

function buildBehaviors(index: number, status: SellerRegistrationStatus): SellerBehaviorEvent[] {
  const actions = [
    ['浏览内容', CONTENT[index % CONTENT.length], '卖家大学'],
    ['搜索', CATEGORIES[(index + 2) % CATEGORIES.length], '小程序'],
    [status === 'unregistered' ? '访问入驻页' : '查看入驻进度', status === 'unregistered' ? '沃要开店' : '申请进度', '小程序'],
    ['报名活动', ACTIVITIES[index % ACTIVITIES.length], '活动中心'],
    ['完成课程', CONTENT[(index + 1) % CONTENT.length], '卖家大学'],
  ]
  return actions.map(([action, object, channel], offset) => ({ id: `${index}-${offset}`, time: `2026-09-${pad(8 - offset)} ${pad(9 + ((index + offset) % 9))}:${pad((index * 7 + offset * 11) % 60)}`, action, object, channel }))
}

export const GROWTH_SELLERS: GrowthSeller[] = Array.from({ length: 60 }, (_, index) => {
  const status = statusFor(index)
  const sites = sitesFor(index)
  const manager = MANAGERS[index % MANAGERS.length]
  const maturity = status === 'online' ? 55 + (index * 7) % 44 : 20 + (index * 5) % 50
  const activityScore = 28 + (index * 11) % 70
  const learning = 15 + (index * 13) % 84
  const registrationIntent = status === 'online' ? 100 : 30 + (index * 17) % 69
  const growthValue = 25 + (index * 19) % 74
  const activeDays30 = 1 + (index * 7) % 26
  const courseCompletion = status === 'online' ? 25 + (index * 9) % 76 : (index * 9) % 55
  const persona = personaFor(status, maturity, registrationIntent)
  const progress = status === 'online' ? 100 : status === 'pending' ? 65 + (index % 4) * 8 : 10 + (index % 5) * 9
  const activity = index % 2 === 0 && status !== 'unregistered' ? ACTIVITIES[index % ACTIVITIES.length] : undefined
  return {
    id: `seller-${pad(index + 1)}`,
    name: NAMES[index % NAMES.length],
    company: `${COMPANIES[index % COMPANIES.length]}有限公司`,
    email: `seller${pad(index + 1)}@example.com`,
    phone: `138****${String(1200 + index).slice(-4)}`,
    registrationStatus: status,
    registrationProgress: progress,
    sites,
    primarySite: sites[0],
    sellerId: status === 'online' ? `10${String(100000 + index * 137).slice(-6)}` : undefined,
    category: CATEGORIES[index % CATEGORIES.length],
    manager: manager.name,
    department: manager.department,
    source: activity ? '活动签到入驻' : ['经理分享', '自然访问', '活动二维码'][index % 3],
    activity,
    bindDate: date(index + 1).slice(0, 10),
    submittedAt: status === 'unregistered' ? undefined : date(index + 3),
    onlineAt: status === 'online' ? date(index + 8) : undefined,
    fiveFaStatus: status === 'online' ? '已通过' : status === 'pending' ? '审核中' : '未开始',
    legalEntity: `${COMPANIES[index % COMPANIES.length]}有限公司`,
    country: '中国',
    formVersion: '标准表单 v15',
    lastActiveAt: `2026-09-08 ${pad(8 + index % 12)}:${pad(index * 7 % 60)}`,
    activeDays30,
    pageViews30: 20 + (index * 23) % 280,
    contentViews30: 3 + (index * 5) % 45,
    courseHours: Number((0.8 + (index * 0.7) % 24).toFixed(1)),
    courseCompletion,
    activitiesJoined: index % 6,
    searches30: 2 + (index * 3) % 34,
    favorites30: index % 12,
    persona,
    profileScore: Math.round((maturity + activityScore + learning + registrationIntent + growthValue) / 5),
    scores: { maturity, activity: activityScore, learning, registrationIntent, growthValue },
    tags: buildTags(index, status, activeDays30, courseCompletion),
    preferredCategories: [CATEGORIES[index % CATEGORIES.length], CATEGORIES[(index + 3) % CATEGORIES.length]],
    recommendation: recommendationFor(persona),
    behaviors: buildBehaviors(index, status),
  }
})
