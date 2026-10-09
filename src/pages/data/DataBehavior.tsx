import { useState } from 'react'
import { Table, Tag, Typography } from 'antd'
import type { EChartsOption } from 'echarts'
import EChart from '../../components/EChart'
import { AnalyticsHeader, MetricCard, SectionHeading } from '../../components/AnalyticsUI'
import { DEFAULT_MINI_PROGRAM_PAGES } from '../../models/tempPages'
import { analyticsWindow, changeFrom, formatCount, rate, totalOf } from '../../mock/analytics'
import type { AnalyticsPeriod } from '../../mock/analytics'
import './DataDashboard.css'

const PATHS = [
  { id: 'learn', path: '首页 → 卖家大学 → 课程详情', share: 28 },
  { id: 'register', path: '首页 → 沃要开店 → 提交申请', share: 16 },
  { id: 'event', path: '活动中心 → 活动详情 → 报名', share: 13 },
  { id: 'growth', path: '首页 → 成长中心 → 课程', share: 9 },
]

export default function DataBehavior() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(7)
  const { current, previous } = analyticsWindow(period)
  const uv = totalOf(current, 'uv')
  const previousUv = totalOf(previous, 'uv')
  const newVisitors = totalOf(current, 'newVisitors')
  const previousNewVisitors = totalOf(previous, 'newVisitors')
  const leads = totalOf(current, 'leads')
  const previousLeads = totalOf(previous, 'leads')
  const registrations = totalOf(current, 'registrations')
  const avgActive = current.reduce((sum, day) => sum + Math.round(day.uv * .74), 0) / period
  const previousAvgActive = previous.reduce((sum, day) => sum + Math.round(day.uv * .74), 0) / period

  const activeOption: EChartsOption = {
    color: ['#0071ce', '#d6a20a'],
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 7 },
    grid: { left: 48, right: 16, top: 20, bottom: 48 },
    xAxis: { type: 'category', data: current.map((day) => day.date), axisTick: { show: false }, axisLabel: { interval: 'auto', hideOverlap: true } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e8edf2', type: 'dashed' } } },
    series: [
      { name: '活跃', type: 'line', smooth: true, symbol: 'none', data: current.map((day) => Math.round(day.uv * .74)), lineStyle: { width: 3 }, areaStyle: { opacity: .07 } },
      { name: '新增', type: 'bar', barMaxWidth: 16, data: current.map((day) => day.newVisitors), itemStyle: { borderRadius: [3, 3, 0, 0] } },
    ],
  }

  const funnel = [
    { label: '访问小程序', value: uv },
    { label: '浏览内容', value: Math.round(uv * .68) },
    { label: '进入入驻页', value: leads },
    { label: '提交申请', value: Math.round(leads * .55) },
    { label: '完成入驻', value: registrations },
  ]

  const pageTotalPv = DEFAULT_MINI_PROGRAM_PAGES.reduce((sum, page) => sum + page.pv, 0)
  const pageTotalUv = DEFAULT_MINI_PROGRAM_PAGES.reduce((sum, page) => sum + page.uv, 0)
  const pageRows = DEFAULT_MINI_PROGRAM_PAGES.map((page) => ({
    ...page, periodPv: Math.round(totalOf(current, 'pv') * page.pv / pageTotalPv),
    periodUv: Math.round(uv * page.uv / pageTotalUv), share: rate(page.pv, pageTotalPv),
  }))

  return <div className="data-dashboard">
    <AnalyticsHeader title="用户行为分析" subtitle="访客活跃、访问路径与入驻转化" period={period} onPeriodChange={setPeriod} tabs />
    <div className="analysis-metrics">
      <MetricCard label="日均活跃访客" value={avgActive} change={changeFrom(avgActive, previousAvgActive)} />
      <MetricCard label="新增访客" value={newVisitors} change={changeFrom(newVisitors, previousNewVisitors)} />
      <MetricCard label="回访访客占比" value={rate(uv - newVisitors, uv)} unit="%" precision={1} change={changeFrom(rate(uv - newVisitors, uv), rate(previousUv - previousNewVisitors, previousUv))} />
      <MetricCard label="入驻页到达率" value={rate(leads, uv)} unit="%" precision={1} change={changeFrom(rate(leads, uv), rate(previousLeads, previousUv))} />
    </div>

    <div className="analysis-grid">
      <section className="analysis-panel" aria-label="活跃访客趋势">
        <SectionHeading title="活跃访客趋势" detail={`${current[0].date} 至 ${current.at(-1)?.date}`} />
        <div className="analysis-panel-body"><EChart option={activeOption} height={280} /></div>
      </section>
      <section className="analysis-panel" aria-label="入驻转化漏斗">
        <SectionHeading title="入驻转化漏斗" detail={`完成入驻 ${formatCount(registrations)} 人`} />
        <div className="analysis-funnel-list">
          {funnel.map((step, index) => <div className="analysis-funnel-step" key={step.label}>
            <div className="analysis-funnel-label"><span>{step.label}</span><strong>{formatCount(step.value)}</strong></div>
            <div className="analysis-funnel-track"><div style={{ width: `${Math.max(4, rate(step.value, uv))}%` }} /></div>
            {index > 0 && <small>上一步转化 {rate(step.value, funnel[index - 1].value).toFixed(1)}%</small>}
          </div>)}
        </div>
      </section>
    </div>

    <div className="analysis-grid">
      <section className="analysis-panel" aria-label="高频访问路径">
        <SectionHeading title="高频访问路径" detail="按访客数估算" />
        <Table rowKey="id" size="small" pagination={false} scroll={{ x: 520 }} dataSource={PATHS.map((item) => ({ ...item, count: Math.round(uv * item.share / 100) }))} columns={[
          { title: '访问路径', dataIndex: 'path', width: 330 },
          { title: '访客数', dataIndex: 'count', width: 100, align: 'right', render: formatCount },
          { title: '占比', dataIndex: 'share', width: 90, align: 'right', render: (value: number) => `${value}%` },
        ]} />
      </section>
      <section className="analysis-panel" aria-label="关键行为摘要">
        <SectionHeading title="关键行为摘要" detail="当前时间范围" />
        <div className="analysis-insights">
          <div><span>人均访问页数</span><strong>{(totalOf(current, 'pv') / uv).toFixed(1)} <small>页</small></strong></div>
          <div><span>入驻页访客</span><strong>{formatCount(leads)} <small>人</small></strong></div>
          <div><span>完成入驻</span><strong>{formatCount(registrations)} <small>人</small></strong></div>
        </div>
      </section>
    </div>

    <section className="analysis-panel" aria-label="页面访问明细">
      <SectionHeading title="页面访问明细" detail="本周期页面表现" />
      <Table rowKey="id" size="small" dataSource={pageRows} scroll={{ x: 900 }} pagination={{ pageSize: 10, hideOnSinglePage: true }} columns={[
        { title: '页面名称', dataIndex: 'title', width: 200 },
        { title: '页面路径', dataIndex: 'path', width: 270, render: (value: string) => <Typography.Text code ellipsis={{ tooltip: value }}>{value}</Typography.Text> },
        { title: '类型', dataIndex: 'kind', width: 110, render: (value: string) => <Tag color={value === 'temporary' ? 'blue' : 'default'}>{value === 'temporary' ? '自定义' : '系统'}</Tag> },
        { title: '访问量 PV', dataIndex: 'periodPv', width: 120, align: 'right', sorter: (a, b) => a.periodPv - b.periodPv, render: formatCount },
        { title: '访客数 UV', dataIndex: 'periodUv', width: 120, align: 'right', sorter: (a, b) => a.periodUv - b.periodUv, render: formatCount },
        { title: '访问占比', dataIndex: 'share', width: 110, align: 'right', render: (value: number) => `${value.toFixed(1)}%` },
      ]} />
    </section>
  </div>
}
