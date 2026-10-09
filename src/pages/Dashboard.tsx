import { useState } from 'react'
import { Button, Tag } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import type { EChartsOption } from 'echarts'
import { useNavigate } from 'react-router-dom'
import EChart from '../components/EChart'
import { AnalyticsHeader, MetricCard, SectionHeading } from '../components/AnalyticsUI'
import { analyticsWindow, changeFrom, formatCount, rate, totalOf } from '../mock/analytics'
import type { AnalyticsPeriod } from '../mock/analytics'
import './Dashboard.css'

const TODOS = [
  { label: '卖家报名待审核', count: 12, to: '/activity/signup', tone: 'warning' },
  { label: '超 7 天未学习卖家', count: 28, to: '/register/remind', tone: 'neutral' },
  { label: '待绑定 PID 的新卖家', count: 5, to: '/growth/sellers', tone: 'success' },
] as const

export default function Dashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<AnalyticsPeriod>(7)
  const { current, previous } = analyticsWindow(period)
  const pv = totalOf(current, 'pv')
  const uv = totalOf(current, 'uv')
  const leads = totalOf(current, 'leads')
  const registrations = totalOf(current, 'registrations')
  const conversion = rate(registrations, leads)
  const previousConversion = rate(totalOf(previous, 'registrations'), totalOf(previous, 'leads'))

  const trendOption: EChartsOption = {
    color: ['#0071ce', '#25864a'],
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 7 },
    grid: { left: 52, right: 18, top: 18, bottom: 48 },
    xAxis: { type: 'category', boundaryGap: false, data: current.map((day) => day.date), axisLabel: { interval: 'auto', hideOverlap: true }, axisTick: { show: false } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e8edf2', type: 'dashed' } } },
    series: [
      { name: 'PV', type: 'line', smooth: true, symbol: 'none', data: current.map((day) => day.pv), lineStyle: { width: 3 }, areaStyle: { opacity: .08 } },
      { name: 'UV', type: 'line', smooth: true, symbol: 'none', data: current.map((day) => day.uv), lineStyle: { width: 2 } },
    ],
  }

  const steps = [
    { label: '小程序访客', value: uv },
    { label: '进入入驻页', value: leads },
    { label: '提交入驻申请', value: Math.round(leads * .55) },
    { label: '完成入驻', value: registrations },
  ]

  return <div className="dashboard-page">
    <AnalyticsHeader title="运营概览" subtitle="小程序流量、入驻转化与待处理事项" period={period} onPeriodChange={setPeriod}
      action={<Button icon={<ArrowRightOutlined />} onClick={() => navigate('/data/overview')}>流量分析</Button>} />

    <div className="analysis-metrics">
      <MetricCard label="小程序访问量" value={pv} change={changeFrom(pv, totalOf(previous, 'pv'))} onClick={() => navigate('/data/overview')} />
      <MetricCard label="访问人数" value={uv} change={changeFrom(uv, totalOf(previous, 'uv'))} onClick={() => navigate('/data/overview')} />
      <MetricCard label="入驻线索" value={leads} change={changeFrom(leads, totalOf(previous, 'leads'))} onClick={() => navigate('/register/trace')} />
      <MetricCard label="入驻转化率" value={conversion} unit="%" precision={1} change={changeFrom(conversion, previousConversion)} onClick={() => navigate('/register/trace')} />
    </div>

    <div className="analysis-grid">
      <section className="analysis-panel" aria-label="访问趋势">
        <SectionHeading title="访问趋势" detail={`${current[0].date} 至 ${current.at(-1)?.date}`} />
        <div className="analysis-panel-body"><EChart option={trendOption} height={270} /></div>
      </section>
      <section className="analysis-panel" aria-label="入驻转化路径">
        <SectionHeading title="入驻转化路径" detail="按当前时间范围统计" action={<Button type="link" size="small" onClick={() => navigate('/data/behavior')}>查看行为分析 <ArrowRightOutlined /></Button>} />
        <div className="home-funnel">
          {steps.map((step, index) => <div className="home-funnel-row" key={step.label}>
            <div className="home-funnel-row-head"><span><b>{String(index + 1).padStart(2, '0')}</b>{step.label}</span><strong>{formatCount(step.value)}</strong></div>
            <div className="home-funnel-track"><div style={{ width: `${rate(step.value, uv)}%` }} /></div>
          </div>)}
        </div>
      </section>
    </div>

    <section className="analysis-panel home-seller" aria-label="商家增长快照">
      <SectionHeading title="商家增长快照" detail="存量与当前运营状态" action={<Button type="link" size="small" onClick={() => navigate('/growth/sellers')}>卖家管理 <ArrowRightOutlined /></Button>} />
      <div className="home-seller-grid">
        <div><span>总卖家数</span><strong>12,456</strong><small>当前存量</small></div>
        <div><span>今日新增</span><strong>28</strong><small>较昨日 +12.0%</small></div>
        <div><span>周活跃率</span><strong>34.5<em>%</em></strong><small>较上周 -2.1%</small></div>
      </div>
    </section>

    <section className="analysis-panel home-todo" aria-label="运营待办">
      <SectionHeading title="运营待办" detail="需要继续处理的业务事项" action={<Tag>{TODOS.length} 项</Tag>} />
      <div className="home-todo-list">
        {TODOS.map((item) => <button type="button" className="home-todo-item" key={item.label} onClick={() => navigate(item.to)}>
          <span className={`home-todo-dot is-${item.tone}`} aria-hidden="true" />
          <span>{item.label}</span>
          <strong>{item.count}</strong>
          <ArrowRightOutlined aria-hidden="true" />
        </button>)}
      </div>
    </section>
  </div>
}
