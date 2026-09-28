import type { MiniProgramPage } from './tempPages'

export interface GuideSchedule {
  enabled: boolean
  validFrom?: string
  validTo?: string
}

export interface GuideItem extends GuideSchedule {
  id: string
}

export interface PromoStat extends GuideItem {
  value: string
  label: string
  icon: string
}

export interface SiteStat {
  id: string
  icon: string
  text: string
}

export interface GuideSite extends GuideItem {
  flag: string
  name: string
  url: string
  badge: string
  desc: string
  condition: string
  stats: SiteStat[]
  tags: string[]
}

export interface GuideFlow extends GuideItem {
  title: string
  desc: string
}

export interface GuideFaq extends GuideItem {
  q: string
  a: string
}

export interface GuidePolicy extends GuideItem {
  title: string
  summary: string
  content: string
  url: string
}

export interface GuideSection<T> extends GuideSchedule {
  items: T[]
}

export interface RegisterGuideConfig {
  promo: GuideSection<PromoStat> & { title: string; subtitle: string; tags: string[] }
  sites: GuideSection<GuideSite>
  flows: GuideSection<GuideFlow> & { materials: string[] }
  faqs: GuideSection<GuideFaq>
  policies: GuideSection<GuidePolicy>
}

export const REGISTER_GUIDE_PATH = '/pages/register-guide/index'

export const DEFAULT_REGISTER_GUIDE: RegisterGuideConfig = {
  promo: {
    enabled: true, title: '沃要开店 · 全球电商新机遇', subtitle: '入驻沃尔玛，触达北美数亿消费者',
    items: [
      { id: 'promo-offer', enabled: true, value: '$75,000', label: '新卖家最高优惠', icon: 'gift' },
      { id: 'promo-fee', enabled: true, value: '0', label: '开店费/月租', icon: 'checkCircle' },
      { id: 'promo-shoppers', enabled: true, value: '1.5亿', label: '每周活跃消费者', icon: 'users' },
      { id: 'promo-manager', enabled: true, value: '1v1', label: '专属客户经理', icon: 'userCheck' },
    ],
    tags: ['佣金减免', '流量扶持', 'WFS 仓配补贴', '广告代金券'],
  },
  sites: {
    enabled: true,
    items: [
      {
        id: 'site-us', enabled: true, flag: '🇺🇸', name: '美国站 · US Marketplace', url: 'walmart.com', badge: '热门',
        desc: '持久强势，美国站邀您一起乘势而上。全渠道优势触达数百万忠诚消费者，无需支付开店费用或月租费用，平台提供有竞争力的佣金政策。新卖家最高享 75,000 美元优惠（2026.2-2027.1 上线新卖家）。',
        condition: '面向符合平台资质要求的企业卖家。',
        stats: [
          { id: 'us-shoppers', icon: 'users', text: '每周 1.5 亿消费者' },
          { id: 'us-growth', icon: 'trendingUp', text: 'Q4 电商增长 27%' },
          { id: 'us-stores', icon: 'home', text: '4,600+ 门店' },
          { id: 'us-streak', icon: 'clock', text: '连续 15 季两位数增长' },
        ],
        tags: ['0 年费/月租', '新卖家激励', 'WFS 官方仓配', '全品类开放'],
      },
      {
        id: 'site-ca', enabled: true, flag: '🇨🇦', name: '加拿大站 · CA Marketplace', url: 'walmart.ca', badge: '增长快',
        desc: '潜力市场，带您一起持续增长。海量优质曝光助推销售攀升，加拿大站网站访问量呈指数式增长。无需支付开店费用或月租费用，已入驻美国站并激活 90 天以上、业绩表现良好的卖家即可申请。',
        condition: '需已入驻美国站并激活 90 天以上，且业绩表现良好。',
        stats: [
          { id: 'ca-visitors', icon: 'users', text: '月独立访客 2,500 万' },
          { id: 'ca-growth', icon: 'trendingUp', text: '连续 3 年两位数增长' },
          { id: 'ca-gmv', icon: 'star', text: '黑五 GMV 增长 115%+' },
        ],
        tags: ['需先开通美国站', '0 年费/月租', '竞争蓝海', '一站式电商平台'],
      },
      {
        id: 'site-mx', enabled: true, flag: '🇲🇽', name: '墨西哥站 · MX Marketplace', url: 'walmart.com.mx', badge: '新兴市场',
        desc: '高速增长的新兴平台，极具潜力的跨境蓝海市场。本地团队提供招商入驻、品类运营、物流管理、广告营销等一站式服务。一个 Listing 可同步在 walmart.com.mx 和 bodegaaurrera.com.mx 多站销售。定向邀请制，需已入驻美国站。',
        condition: '定向邀请制，需已入驻美国站。',
        stats: [
          { id: 'mx-stores', icon: 'home', text: '3,000+ 线下门店' },
          { id: 'mx-growth', icon: 'trendingUp', text: '年销售增长 20%' },
          { id: 'mx-sku', icon: 'package', text: 'SKU 增长 60%' },
          { id: 'mx-sellers', icon: 'users', text: '卖家增长 50%' },
        ],
        tags: ['定向邀请制', 'WFS + WRF 物流', 'Walmart Connect 广告', '多站同步'],
      },
    ],
  },
  flows: {
    enabled: true,
    items: [
      { id: 'flow-site', enabled: true, title: '选择站点', desc: '美国站 / 加拿大站 / 墨西哥站' },
      { id: 'flow-form', enabled: true, title: '填写入驻登记表', desc: '联系人、企业、经营与平台信息' },
      { id: 'flow-prescreen', enabled: true, title: '填写五要素', desc: '法人实名登记（Pre-screening 5FA）' },
      { id: 'flow-review', enabled: true, title: '等待审核', desc: '通常3-5个工作日，状态实时可查' },
      { id: 'flow-pid', enabled: true, title: '绑定PID·上线', desc: '上线后绑定PID解锁孵化课程' },
    ],
    materials: [
      '企业营业执照（18位统一社会信用代码）',
      '法定代表人姓名、手机号、身份证号（五要素）',
      '品牌商标注册证 / 授权书',
      '跨境电商经验证明（其他平台店铺截图 / GMV截图）',
      '产品合规证书（如适用）',
      '企业银行账户信息',
    ],
  },
  faqs: {
    enabled: true,
    items: [
      { id: 'faq-time', enabled: true, q: '入驻沃尔玛需要多长时间？', a: '从提交申请到审核通过，通常需要3-5个工作日。材料齐全且合规的情况下可能更快。建议提前准备好所有材料。' },
      { id: 'faq-person', enabled: true, q: '个人可以入驻吗？', a: '目前沃尔玛Marketplace仅接受企业卖家入驻，需要提供有效的企业营业执照和相关资质证明。' },
      { id: 'faq-fee', enabled: true, q: '入驻费用是多少？', a: '沃尔玛入驻不收取年费或入驻费，仅按订单收取佣金。佣金比例因类目而异，一般在8%-15%之间。' },
      { id: 'faq-rejected', enabled: true, q: '审核不通过怎么办？', a: '如审核未通过，系统会告知具体原因。您可以根据反馈修改资料后重新提交。也可以联系专属招商经理获取指导。' },
    ],
  },
  policies: { enabled: false, items: [] },
}

const STORAGE_KEY = 'walmart-admin-register-guide-v1'

export function readRegisterGuidePage(defaultPage: MiniProgramPage): MiniProgramPage {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPage
    const stored: unknown = JSON.parse(raw)
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return defaultPage
    const page = stored as Partial<MiniProgramPage>
    if (page.id !== defaultPage.id || !page.registerGuide || !['promo', 'sites', 'flows', 'faqs', 'policies'].every((key) =>
      Array.isArray(page.registerGuide?.[key as keyof RegisterGuideConfig]?.items))) return defaultPage
    return { ...defaultPage, ...page, id: defaultPage.id, kind: defaultPage.kind, path: REGISTER_GUIDE_PATH }
  } catch {
    return defaultPage
  }
}

export function saveRegisterGuidePage(page: MiniProgramPage): void {
  if (page.id !== 'page-register' || !page.registerGuide) throw new Error('入驻指引配置无效')
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(page))
}
