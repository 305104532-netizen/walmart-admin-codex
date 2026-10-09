import { lastNDates } from './util'

export type AnalyticsPeriod = 7 | 30

export interface DailyAnalytics {
  date: string
  pv: number
  uv: number
  newVisitors: number
  leads: number
  registrations: number
  learners: number
  completions: number
}

export const SOURCE_MIX = [
  { name: '经理转发', share: 36, color: '#0071ce' },
  { name: '活动渠道', share: 28, color: '#25864a' },
  { name: '自然访问', share: 21, color: '#d6a20a' },
  { name: '二级转发', share: 15, color: '#6d7787' },
]

const DAYS: DailyAnalytics[] = lastNDates(60).map((date, index) => {
  const pv = Math.round(1420 + index * 4 + Math.sin(index * .68) * 190 + Math.cos(index * .23) * 95)
  const uv = Math.round(pv * (.43 + Math.sin(index * .31) * .012))
  const leads = Math.round(uv * (.118 + Math.sin(index * .43) * .008))
  const learners = Math.round(uv * (.23 + Math.cos(index * .39) * .015))
  return {
    date, pv, uv,
    newVisitors: Math.round(uv * (.29 + Math.sin(index * .47) * .02)),
    leads,
    registrations: Math.round(leads * (.181 + Math.cos(index * .37) * .018)),
    learners,
    completions: Math.round(learners * (.61 + Math.sin(index * .34) * .03)),
  }
})

export function analyticsWindow(period: AnalyticsPeriod) {
  return { current: DAYS.slice(-period), previous: DAYS.slice(-period * 2, -period) }
}

export function totalOf(days: DailyAnalytics[], key: Exclude<keyof DailyAnalytics, 'date'>) {
  return days.reduce((sum, day) => sum + day[key], 0)
}

export function changeFrom(current: number, previous: number) {
  return previous ? (current - previous) / previous * 100 : 0
}

export function rate(part: number, whole: number) {
  return whole ? part / whole * 100 : 0
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('zh-CN').format(Math.round(value))
}
