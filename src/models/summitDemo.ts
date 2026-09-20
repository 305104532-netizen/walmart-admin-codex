import type { StoredSummit, SummitAgendaItem, SummitConfig, SummitGuest } from './summit'

const GUESTS: SummitGuest[] = [
  { id: 'guest-platform', name: '刘晨', title: '平台招商负责人', company: '沃尔玛全球电商', bio: '负责跨境卖家招募与平台招商策略。' },
  { id: 'guest-growth', name: '陈嘉', title: '卖家增长负责人', company: '沃尔玛全球电商', bio: '专注卖家成长、履约与经营效率提升。' },
]

const AGENDA: SummitAgendaItem[] = [
  { id: 'agenda-opening', startTime: '09:30', endTime: '10:00', title: '峰会开幕与平台招商趋势', speaker: '刘晨', venue: '主会场' },
  { id: 'agenda-growth', startTime: '10:00', endTime: '11:20', title: '卖家增长与重点项目解读', speaker: '陈嘉', venue: '主会场' },
  { id: 'agenda-match', startTime: '14:00', endTime: '16:30', title: '平台招商对接与圆桌交流', venue: '分会场' },
]

interface DemoDefinition {
  id: string
  title: string
  slogan: string
  start: string
  end: string
  city: string
  venue: string
  capacity: number
  signup: number
  checkin: number
  status?: StoredSummit['status']
}

const DEFINITIONS: DemoDefinition[] = [
  { id: 'summit-demo-global', title: '2026沃尔玛全球电商卖家峰会', slogan: '链接全球，共启增长新程', start: '2026-08-28T09:00:00+08:00', end: '2026-08-28T17:30:00+08:00', city: '上海', venue: '上海国际会议中心', capacity: 800, signup: 726, checkin: 648 },
  { id: 'summit-demo-new-seller', title: '沃尔玛新卖家成长峰会', slogan: '从入驻到首单，快速开启全球生意', start: '2026-09-10T09:30:00+08:00', end: '2026-09-10T17:00:00+08:00', city: '深圳', venue: '深圳会展中心', capacity: 500, signup: 438, checkin: 382 },
  { id: 'summit-demo-wfs', title: 'WFS跨境履约生态峰会', slogan: '稳定履约，让增长更简单', start: '2026-09-18T09:30:00+08:00', end: '2026-09-18T16:30:00+08:00', city: '广州', venue: '广州国际采购中心', capacity: 360, signup: 315, checkin: 276 },
  { id: 'summit-demo-category', title: '美妆与个护品类增长峰会', slogan: '洞察品类机会，打造出海新品', start: '2026-09-26T10:00:00+08:00', end: '2026-09-26T16:00:00+08:00', city: '杭州', venue: '杭州国际博览中心', capacity: 300, signup: 226, checkin: 0 },
  { id: 'summit-demo-ca', title: '加拿大站平台招商峰会', slogan: '拓展北美增量市场', start: '2026-10-18T09:30:00+08:00', end: '2026-10-18T16:30:00+08:00', city: '北京', venue: '北京国家会议中心', capacity: 420, signup: 268, checkin: 0 },
  { id: 'summit-demo-mx', title: '墨西哥站跨境增长峰会', slogan: '解锁拉美市场新增长', start: '2026-11-15T09:30:00+08:00', end: '2026-11-15T17:00:00+08:00', city: '厦门', venue: '厦门国际会议中心', capacity: 380, signup: 186, checkin: 0 },
  { id: 'summit-demo-2027', title: '2027沃尔玛卖家战略峰会', slogan: '预见下一程增长', start: '2026-12-12T09:30:00+08:00', end: '2026-12-12T17:30:00+08:00', city: '上海', venue: '上海世博中心', capacity: 1000, signup: 0, checkin: 0, status: 'draft' },
]

function summitValues(definition: DemoDefinition): SummitConfig {
  return {
    title: definition.title,
    shortTitle: definition.title.replace('沃尔玛', ''),
    slogan: definition.slogan,
    topTitle: '沃尔玛峰会',
    start: definition.start,
    end: definition.end,
    registrationDeadline: new Date(Date.parse(definition.start) - 24 * 60 * 60 * 1000).toISOString(),
    city: definition.city,
    venue: definition.venue,
    address: `${definition.city}市会议中心路88号（演示）`,
    capacity: definition.capacity,
    cover: '',
    listCover: '',
    shareImage: '',
    detail: `<h2>${definition.title}</h2><p>${definition.slogan}。本场峰会聚焦平台招商、卖家成长、跨境履约与经营实战，为卖家提供政策解读、案例分享和现场对接机会。</p><h3>峰会亮点</h3><ul><li>平台招商趋势与重点项目解读</li><li>优秀卖家经营案例分享</li><li>平台招商经理现场咨询与对接</li></ul>`,
    agenda: AGENDA.map((item) => ({ ...item, id: `${definition.id}-${item.id}` })),
    guests: GUESTS.map((guest) => ({ ...guest, id: `${definition.id}-${guest.id}` })),
    allowRegister: true,
    auditRequired: true,
    needCheckin: true,
    checkinStartMinutes: 90,
    checkinEndMinutes: 120,
    leadToRegister: true,
    bindingDays: 30,
    needSurvey: true,
    showInCalendar: true,
    registrationFields: ['姓名', '手机号', '公司名称', '主营类目', '意向站点'],
    signupSuccessText: '报名成功，峰会开始前将发送参会提醒。',
    shareSummary: definition.slogan,
    sourceTraceEnabled: true,
  }
}

export const DEMO_SUMMITS: StoredSummit[] = DEFINITIONS.map((definition, index) => ({
  id: definition.id,
  status: definition.status ?? 'published',
  createdAt: `2026-07-${String(index + 2).padStart(2, '0')}T02:00:00.000Z`,
  updatedAt: `2026-09-${String(index + 1).padStart(2, '0')}T03:00:00.000Z`,
  values: summitValues(definition),
  signup: definition.signup,
  checkin: definition.checkin,
}))

export function findDemoSummit(id: string): StoredSummit | undefined {
  return DEMO_SUMMITS.find((summit) => summit.id === id)
}
