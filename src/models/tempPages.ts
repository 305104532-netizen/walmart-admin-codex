export type TempPageStatus = 'online' | 'scheduled' | 'expired' | 'draft'
export type TempPageKind = 'system' | 'temporary'

export interface ChannelParam {
  key: string
  value: string
  note: string
}

export interface MiniProgramPage {
  id: string
  title: string
  path: string
  kind: TempPageKind
  pv: number
  uv: number
  channels: ChannelParam[]
  validFrom?: string
  validTo?: string
  status: TempPageStatus
  shareTitle: string
  shareCover: string
  updatedAt: string
  componentCount: number
}

export const DEFAULT_MINI_PROGRAM_PAGES: MiniProgramPage[] = [
  {
    id: 'page-home', title: '首页', path: '/pages/index/index', kind: 'system', pv: 158230, uv: 48210,
    channels: [{ key: 'source', value: 'natural', note: '自然访问' }], status: 'online',
    shareTitle: '沃尔玛全球电商卖家服务中心', shareCover: '', updatedAt: '2026-09-08 18:32', componentCount: 8,
  },
  {
    id: 'page-growth', title: '成长中心', path: '/pages/growth/index', kind: 'system', pv: 82460, uv: 25340,
    channels: [{ key: 'source', value: 'home_nav', note: '首页导航' }], status: 'online',
    shareTitle: '沃尔玛卖家成长中心', shareCover: '', updatedAt: '2026-09-08 16:20', componentCount: 6,
  },
  {
    id: 'page-activity', title: '活动中心', path: '/pages/activity/index', kind: 'system', pv: 76490, uv: 21980,
    channels: [{ key: 'source', value: 'home_nav', note: '首页导航' }, { key: 'campaign', value: 'activity_center', note: '活动中心' }], status: 'online',
    shareTitle: '沃尔玛卖家活动中心', shareCover: '', updatedAt: '2026-09-07 15:46', componentCount: 5,
  },
  {
    id: 'page-register', title: '沃要开店', path: '/pages/register/index', kind: 'system', pv: 58960, uv: 17640,
    channels: [{ key: 'source', value: 'home_entry', note: '首页入口' }, { key: 'bd', value: '{bd_code}', note: 'BD经理动态参数' }], status: 'online',
    shareTitle: '加入沃尔玛全球电商', shareCover: '', updatedAt: '2026-09-06 12:08', componentCount: 4,
  },
  {
    id: 'page-course', title: '卖家大学', path: '/pages/course/index', kind: 'system', pv: 46780, uv: 13920,
    channels: [{ key: 'source', value: 'growth_center', note: '成长中心' }], status: 'online',
    shareTitle: '沃尔玛卖家大学精选课程', shareCover: '', updatedAt: '2026-09-05 10:24', componentCount: 7,
  },
  {
    id: 'temp-summit', title: '2026沃尔玛全球电商峰会', path: '/pages/temp/summit-2026', kind: 'temporary', pv: 12860, uv: 8230,
    channels: [{ key: 'campaign', value: 'summit2026', note: '峰会主活动' }, { key: 'source', value: '{channel}', note: '投放渠道动态参数' }],
    validFrom: '2026-07-01', validTo: '2026-09-30', status: 'online', shareTitle: '2026沃尔玛全球电商峰会，邀您共启增长新程', shareCover: '', updatedAt: '2026-09-08 09:14', componentCount: 9,
  },
  {
    id: 'temp-wfs', title: 'WFS旺季履约指南', path: '/pages/temp/wfs-peak-season', kind: 'temporary', pv: 5680, uv: 3760,
    channels: [{ key: 'campaign', value: 'wfs_peak', note: 'WFS旺季推广' }],
    validFrom: '2026-09-15', validTo: '2026-11-30', status: 'scheduled', shareTitle: 'WFS旺季履约指南', shareCover: '', updatedAt: '2026-09-08 14:06', componentCount: 5,
  },
  {
    id: 'temp-q4', title: 'Q4新卖家扶持计划', path: '/pages/temp/q4-new-seller', kind: 'temporary', pv: 0, uv: 0,
    channels: [{ key: 'campaign', value: 'q4_new_seller', note: 'Q4招募' }, { key: 'bd', value: '{bd_code}', note: 'BD经理动态参数' }],
    validFrom: '2026-10-01', validTo: '2026-12-31', status: 'draft', shareTitle: '沃尔玛Q4新卖家扶持计划', shareCover: '', updatedAt: '2026-09-08 17:52', componentCount: 3,
  },
  {
    id: 'temp-mx', title: '墨西哥站点入驻季', path: '/pages/temp/mx-onboarding', kind: 'temporary', pv: 9320, uv: 6010,
    channels: [{ key: 'campaign', value: 'mx_onboarding', note: '墨西哥站入驻' }],
    validFrom: '2026-05-01', validTo: '2026-08-31', status: 'expired', shareTitle: '抢先布局沃尔玛墨西哥站', shareCover: '', updatedAt: '2026-08-31 23:59', componentCount: 6,
  },
]
