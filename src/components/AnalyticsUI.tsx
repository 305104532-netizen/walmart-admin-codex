import type { ReactNode } from 'react'
import { Segmented, Tabs, Tag, Typography } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AnalyticsPeriod } from '../mock/analytics'
import { formatCount } from '../mock/analytics'
import './AnalyticsUI.css'

const ANALYSIS_TABS = [
  { key: '/data/overview', label: '流量概览' },
  { key: '/data/behavior', label: '用户行为' },
  { key: '/data/learning', label: '课程学习' },
]

export function AnalyticsHeader({ title, subtitle, period, onPeriodChange, tabs = false, action }: {
  title: string
  subtitle: string
  period: AnalyticsPeriod
  onPeriodChange: (value: AnalyticsPeriod) => void
  tabs?: boolean
  action?: ReactNode
}) {
  const navigate = useNavigate()
  const location = useLocation()
  return <>
    <header className="analysis-header">
      <div className="analysis-header-copy">
        <div className="analysis-title-line"><Typography.Title level={3}>{title}</Typography.Title><Tag color="default">演示数据</Tag></div>
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      </div>
      <div className="analysis-header-actions">
        <Segmented aria-label="统计时间范围" options={[{ label: '近 7 天', value: 7 }, { label: '近 30 天', value: 30 }]} value={period} onChange={(value) => onPeriodChange(value as AnalyticsPeriod)} />
        {action}
      </div>
    </header>
    {tabs && <Tabs className="analysis-nav" activeKey={location.pathname} items={ANALYSIS_TABS} onChange={(key) => navigate(key)} />}
  </>
}

export function MetricCard({ label, value, unit, precision = 0, change, description, onClick }: {
  label: string
  value: number
  unit?: string
  precision?: number
  change?: number
  description?: string
  onClick?: () => void
}) {
  const formattedValue = precision ? value.toFixed(precision) : formatCount(value)
  const content = <>
    <span className="analysis-metric-label">{label}</span>
    <span className="analysis-metric-value">{formattedValue}{unit && <small>{unit}</small>}</span>
    <span className="analysis-metric-foot">
      {change === undefined ? <span>{description}</span> : <><span className={change >= 0 ? 'is-positive' : 'is-negative'}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span><span>较上期</span></>}
    </span>
  </>
  return onClick
    ? <button type="button" className="analysis-metric analysis-metric-button" onClick={onClick} aria-label={`${label} ${formattedValue}${unit ?? ''}，查看详情`}>{content}</button>
    : <div className="analysis-metric">{content}</div>
}

export function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="analysis-section-heading"><div><h2>{title}</h2>{detail && <span>{detail}</span>}</div>{action}</div>
}
