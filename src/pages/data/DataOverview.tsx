import { useState } from 'react'
import { Button, Table, Tag, Typography } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import type { EChartsOption } from 'echarts'
import { useNavigate } from 'react-router-dom'
import EChart from '../../components/EChart'
import { AnalyticsHeader, MetricCard, SectionHeading } from '../../components/AnalyticsUI'
import { DEFAULT_MINI_PROGRAM_PAGES } from '../../models/tempPages'
import { analyticsWindow, changeFrom, formatCount, rate, SOURCE_MIX, totalOf } from '../../mock/analytics'
import type { AnalyticsPeriod } from '../../mock/analytics'
import './DataDashboard.css'

interface PageRank {
  id: string
  title: string
  path: string
  kind: string
  pv: number
  uv: number
  share: number
}

export default function DataOverview() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<AnalyticsPeriod>(7)
  const { current, previous } = analyticsWindow(period)
  const pv = totalOf(current, 'pv')
  const uv = totalOf(current, 'uv')
  const newVisitors = totalOf(current, 'newVisitors')
  const previousPv = totalOf(previous, 'pv')
  const previousUv = totalOf(previous, 'uv')
  const previousNewVisitors = totalOf(previous, 'newVisitors')

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

  const pageTotal = DEFAULT_MINI_PROGRAM_PAGES.reduce((sum, page) => sum + page.pv, 0)
  const pageTotalUv = DEFAULT_MINI_PROGRAM_PAGES.reduce((sum, page) => sum + page.uv, 0)
  const pageRanks: PageRank[] = [...DEFAULT_MINI_PROGRAM_PAGES].sort((a, b) => b.pv - a.pv).slice(0, 6).map((page) => ({
    id: page.id, title: page.title, path: page.path, kind: page.kind,
    pv: Math.round(pv * page.pv / pageTotal),
    uv: Math.round(uv * page.uv / pageTotalUv),
    share: rate(page.pv, pageTotal),
  }))

  return <div className="data-dashboard">
    <AnalyticsHeader title="流量概览" subtitle="小程序访问规模、来源与页面表现" period={period} onPeriodChange={setPeriod} tabs />
    <div className="analysis-metrics">
      <MetricCard label="访问量 PV" value={pv} change={changeFrom(pv, previousPv)} />
      <MetricCard label="访客数 UV" value={uv} change={changeFrom(uv, previousUv)} />
      <MetricCard label="新访客" value={newVisitors} change={changeFrom(newVisitors, previousNewVisitors)} />
      <MetricCard label="人均访问页数" value={pv / uv} unit="页" precision={1} change={changeFrom(pv / uv, previousPv / previousUv)} />
    </div>

    <div className="analysis-grid">
      <section className="analysis-panel" aria-label="流量趋势">
        <SectionHeading title="流量趋势" detail={`${current[0].date} 至 ${current.at(-1)?.date}`} />
        <div className="analysis-panel-body"><EChart option={trendOption} height={280} /></div>
      </section>
      <section className="analysis-panel" aria-label="流量来源">
        <SectionHeading title="流量来源" detail="按访客数估算" />
        <div className="analysis-source-list">
          {SOURCE_MIX.map((source) => <div className="analysis-source-row" key={source.name}>
            <div className="analysis-source-head"><span><i style={{ background: source.color }} />{source.name}</span><strong>{source.share}%</strong></div>
            <div className="analysis-source-track"><div style={{ width: `${source.share / SOURCE_MIX[0].share * 100}%`, background: source.color }} /></div>
            <span className="analysis-source-count">{formatCount(uv * source.share / 100)} 人</span>
          </div>)}
        </div>
      </section>
    </div>

    <section className="analysis-panel" aria-label="热门页面排行">
      <SectionHeading title="热门页面排行" detail="本周期访问最多的页面" action={<Button type="link" size="small" onClick={() => navigate('/data/behavior')}>页面明细 <ArrowRightOutlined /></Button>} />
      <Table<PageRank> rowKey="id" size="small" pagination={false} scroll={{ x: 760 }} dataSource={pageRanks} columns={[
        { title: '页面', key: 'page', width: 250, render: (_: unknown, page, index) => <div className="analysis-page-cell"><span className="analysis-rank">{index + 1}</span><div><strong>{page.title}</strong><Typography.Text type="secondary" ellipsis={{ tooltip: page.path }}>{page.path}</Typography.Text></div></div> },
        { title: '类型', dataIndex: 'kind', width: 110, render: (kind: string) => <Tag color={kind === 'temporary' ? 'blue' : 'default'}>{kind === 'temporary' ? '自定义' : '系统'}</Tag> },
        { title: '访问量 PV', dataIndex: 'pv', width: 120, align: 'right', sorter: (a, b) => a.pv - b.pv, render: formatCount },
        { title: '访客数 UV', dataIndex: 'uv', width: 120, align: 'right', sorter: (a, b) => a.uv - b.uv, render: formatCount },
        { title: '访问占比', dataIndex: 'share', width: 130, align: 'right', render: (share: number) => `${share.toFixed(1)}%` },
      ]} />
    </section>
  </div>
}
