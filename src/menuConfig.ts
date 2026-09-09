import type { ReactNode } from 'react'
import {
  DashboardOutlined, UserAddOutlined, RiseOutlined, ReadOutlined,
  CalendarOutlined, BarChartOutlined, MessageOutlined, AppstoreOutlined, SettingOutlined,
} from '@ant-design/icons'
import { createElement } from 'react'

export interface MenuNode {
  key: string
  label: string
  icon?: ReactNode
  children?: { key: string; label: string }[]
}

// 左侧菜单（8 大模块 / 42 页面），key 即路由 path
export const menuConfig: MenuNode[] = [
  { key: '/dashboard', label: '首页看板', icon: createElement(DashboardOutlined) },
  {
    key: 'register', label: '入驻管理', icon: createElement(UserAddOutlined),
    children: [
      { key: '/register/list', label: '卖家入驻进度看板' },
      { key: '/register/trace', label: '溯源追踪' },
      { key: '/register/form-config', label: '入驻表单字段配置' },
      { key: '/register/prescreen', label: '五要素预审(5FA)' },
      { key: '/register/remind', label: '学习提醒配置' },
      { key: '/register/task', label: '任务派发' },
    ],
  },
  {
    key: 'growth', label: '成长中心', icon: createElement(RiseOutlined),
    children: [
      { key: '/growth/score', label: '评分体系配置' },
      { key: '/growth/persona', label: '用户画像管理' },
      { key: '/growth/tags', label: '标签管理' },
      { key: '/growth/audience', label: '人群圈选' },
      { key: '/growth/distribute', label: '课程分发' },
      { key: '/growth/dayone', label: 'DAY-ONE白名单' },
      { key: '/growth/effect', label: '推送效果追踪' },
    ],
  },
  {
    key: 'content', label: '内容管理', icon: createElement(ReadOutlined),
    children: [
      { key: '/content/articles', label: '文章管理' },
      { key: '/content/videos', label: '视频课程管理' },
      { key: '/content/categories', label: '分类管理' },
      { key: '/content/tags', label: '内容标签管理' },
      { key: '/content/dictionary', label: '内容字典' },
      { key: '/content/import', label: '内容迁移/导入' },
      { key: '/content/search-config', label: '搜索配置' },
    ],
  },
  {
    key: 'activity', label: '活动管理', icon: createElement(CalendarOutlined),
    children: [
      { key: '/activity/list', label: '活动列表' },
      { key: '/activity/create', label: '创建活动' },
      { key: '/activity/summit', label: '沃尔玛峰会管理' },
      { key: '/activity/signup', label: '报名管理' },
      { key: '/activity/checkin', label: '签到管理' },
      { key: '/activity/leads', label: '活动线索转化归因' },
      { key: '/activity/survey', label: '问卷管理' },
    ],
  },
  {
    key: 'data', label: '数据看板', icon: createElement(BarChartOutlined),
    children: [
      { key: '/data/overview', label: '流量概览' },
      { key: '/data/behavior', label: '用户行为分析' },
      { key: '/data/learning', label: '学习数据统计' },
    ],
  },
  {
    key: 'message', label: '消息管理', icon: createElement(MessageOutlined),
    children: [
      { key: '/message/template', label: '服务号模板消息' },
      { key: '/message/inbox', label: '站内信管理' },
      { key: '/message/subscribe', label: '订阅消息配置' },
    ],
  },
  {
    key: 'resource', label: '资源位管理', icon: createElement(AppstoreOutlined),
    children: [
      { key: '/resource/banner', label: 'Banner管理' },
      { key: '/resource/popup', label: '弹窗管理' },
      { key: '/resource/editor', label: '页面编辑器' },
      { key: '/resource/pages', label: '临时页面管理' },
    ],
  },
  {
    key: 'settings', label: '系统设置', icon: createElement(SettingOutlined),
    children: [
      { key: '/settings/organization', label: '组织架构管理' },
      { key: '/settings/permission', label: '权限管理' },
      { key: '/settings/commission', label: '佣金公式管理' },
      { key: '/settings/logs', label: '操作日志' },
    ],
  },
]
