import type { ActivityConfig, StoredActivity } from './activity'

const templates: Pick<ActivityConfig, 'title' | 'mode' | 'kind' | 'city' | 'location'>[] = [
  { title: '2026沃尔玛卖家峰会', mode: 'offline', kind: '线下峰会', city: '上海', location: '上海国际会议中心 · 卖家交流厅（演示）' },
  { title: '新手入门直播课', mode: 'online', kind: '线上直播', city: '线上', location: '线上直播间（演示）' },
  { title: 'Q3选品趋势分享会', mode: 'offline', kind: '分享会', city: '深圳', location: '深圳会展中心 · 跨境电商交流厅（演示）' },
  { title: '广告投放工作坊', mode: 'offline', kind: '工作坊', city: '广州', location: '广州跨境电商服务中心 · 培训室（演示）' },
  { title: 'WFS政策解读会', mode: 'online', kind: '分享会', city: '线上', location: '线上政策解读直播间（演示）' },
]

// 列表与详情共用固定的演示记录；不写入浏览器的活动存储。
export const DEMO_ACTIVITIES: StoredActivity[] = Array.from({ length: 20 }, (_, index) => {
  const template = templates[index % templates.length]
  const number = index + 1
  const title = `${template.title} #${number}`
  const start = Date.UTC(2026, 8, 4 + index * 3, 6)
  const capacity = 150 + (index % 5) * 50
  const createdAt = new Date(Date.UTC(2026, 7, 1 + index, 2)).toISOString()

  return {
    id: String(number),
    status: 'published',
    createdAt,
    updatedAt: createdAt,
    signup: Math.floor(capacity * (0.35 + (index % 4) * 0.13)),
    values: {
      ...template,
      title,
      topTitle: '活动详情',
      start: new Date(start).toISOString(),
      end: new Date(start + 3 * 60 * 60 * 1000).toISOString(),
      deadlineEnabled: true,
      registrationDeadline: new Date(start - 24 * 60 * 60 * 1000).toISOString(),
      showInList: true,
      dateOnly: false,
      showCountdown: true,
      speaker: '沃尔玛卖家运营讲师（演示）',
      livePlatform: template.mode === 'online' ? '其他平台' : undefined,
      earlyEntryMinutes: 15,
      capacityLimited: true,
      capacity,
      detail: `<h2>${template.title}</h2><p>本场活动围绕卖家经营与入驻成长展开，提供政策介绍、实操分享和交流答疑。</p><h3>活动议程</h3><ul><li>14:00–14:30 活动开场与政策介绍</li><li>14:30–16:00 主题分享与实操案例</li><li>16:00–17:00 卖家交流及问题答疑</li></ul><p>此记录为管理后台演示活动，第 ${number} 场；页面中的报名人数和活动安排均为演示数据。</p>`,
      allowRegister: true,
      needCheckin: template.mode === 'offline',
      needSurvey: template.kind === '工作坊',
      leadToRegister: template.mode === 'offline',
      leadCapture: true,
      bindingDays: 30,
      cpManager: '活动运营组（演示）',
      audience: ['member'],
      memberScope: 'all',
      recommendedIdentity: 'member',
      memberFields: [
        { label: '姓名', type: 'text', required: true },
        { label: '手机号', type: 'mobile', required: true },
        { label: '公司名称', type: 'text', required: true },
      ],
      auditEnabled: template.kind === '工作坊',
      source: '卖家社群（演示）',
      campaignCodes: [`DEMO-2026-${String(number).padStart(2, '0')}`],
      promotionChannels: ['微信公众号', '企业微信'],
      wechatShare: true,
      shareSummary: '政策解读、经营实操与卖家交流，帮助卖家了解平台活动。',
      signupSuccessText: '报名成功，请按活动安排准时参与。',
      redirectEnabled: false,
      buttonMode: 'default',
    },
  }
})

export function findDemoActivity(id: string): StoredActivity | undefined {
  return DEMO_ACTIVITIES.find((activity) => activity.id === id)
}
