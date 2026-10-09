import { useState } from 'react'
import { Progress, Segmented, Table, Tag } from 'antd'
import type { EChartsOption } from 'echarts'
import EChart from '../../components/EChart'
import { AnalyticsHeader, MetricCard, SectionHeading } from '../../components/AnalyticsUI'
import { loadCourseAlbums } from '../../models/courseCatalog'
import type { CourseRequirement } from '../../models/courseCatalog'
import { analyticsWindow, changeFrom, formatCount, rate, totalOf } from '../../mock/analytics'
import type { AnalyticsPeriod } from '../../mock/analytics'
import './DataDashboard.css'

const CATEGORY_NAMES: Record<string, string> = {
  entry: '新手入门', operation: '进阶运营', logistics: '物流仓配', ads: '广告投放',
}

export default function DataLearning() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(7)
  const [requirement, setRequirement] = useState<'all' | CourseRequirement>('all')
  const [albums] = useState(loadCourseAlbums)
  const { current, previous } = analyticsWindow(period)
  const published = albums.filter((album) => album.status === 'published')
  const visible = published.filter((album) => requirement === 'all' || album.requirement === requirement)
  const allLearners = published.reduce((sum, album) => sum + album.learners, 0)
  const visibleLearners = visible.reduce((sum, album) => sum + album.learners, 0)
  const share = allLearners ? visibleLearners / allLearners : 0

  const courseRows = published.map((album, index) => {
    const periodLearners = allLearners ? Math.round(totalOf(current, 'learners') * album.learners / allLearners) : 0
    const plays = Math.round(periodLearners * (1.55 + index * .08))
    const completion = Math.min(85, (album.requirement === 'required' ? 69 : 57) + index * 3)
    const avgDuration = album.lessons.length ? Math.round(album.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0) / album.lessons.length * .72) : 0
    return { id: album.id, title: album.title, category: album.category, requirement: album.requirement, plays, completion, avgDuration, learners: periodLearners }
  }).filter((row) => requirement === 'all' || row.requirement === requirement).sort((a, b) => b.plays - a.plays)

  const plays = courseRows.reduce((sum, row) => sum + row.plays, 0)
  const learners = courseRows.reduce((sum, row) => sum + row.learners, 0)
  const completions = courseRows.reduce((sum, row) => sum + Math.round(row.plays * row.completion / 100), 0)
  const completionRate = rate(completions, plays)
  const avgMinutes = plays ? courseRows.reduce((sum, row) => sum + row.avgDuration * row.plays, 0) / plays : 0
  const trendChange = plays ? changeFrom(totalOf(current, 'learners'), totalOf(previous, 'learners')) : 0
  const previousCompletionRate = rate(totalOf(previous, 'completions'), totalOf(previous, 'learners'))
  const currentCompletionRate = rate(totalOf(current, 'completions'), totalOf(current, 'learners'))

  const trendOption: EChartsOption = {
    color: ['#0071ce', '#25864a'],
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 7 },
    grid: { left: 48, right: 16, top: 20, bottom: 48 },
    xAxis: { type: 'category', data: current.map((day) => day.date), axisTick: { show: false }, axisLabel: { interval: 'auto', hideOverlap: true } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e8edf2', type: 'dashed' } } },
    series: [
      { name: '学习', type: 'bar', barMaxWidth: 16, data: current.map((day) => Math.round(day.learners * share)), itemStyle: { borderRadius: [3, 3, 0, 0] } },
      { name: '完课', type: 'line', smooth: true, symbol: 'none', data: current.map((day) => Math.round(day.completions * share)), lineStyle: { width: 3 } },
    ],
  }

  const categoryRows = Object.entries(courseRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.plays
    return acc
  }, {})).map(([category, count]) => ({ name: CATEGORY_NAMES[category] ?? category, count, share: rate(count, plays) })).sort((a, b) => b.count - a.count)

  return <div className="data-dashboard">
    <AnalyticsHeader title="学习数据统计" subtitle="课程学习趋势、完课表现与课程排行" period={period} onPeriodChange={setPeriod} tabs />
    <div className="analysis-metrics">
      <MetricCard label="课程播放次数" value={plays} change={trendChange} />
      <MetricCard label="课程学习人次" value={learners} change={trendChange} />
      <MetricCard label="平均完课率" value={completionRate} unit="%" precision={1} change={changeFrom(currentCompletionRate, previousCompletionRate)} />
      <MetricCard label="平均观看时长" value={avgMinutes} unit="分钟" precision={1} description="每次播放" />
    </div>

    <div className="analysis-grid">
      <section className="analysis-panel" aria-label="课程学习趋势">
        <SectionHeading title="课程学习趋势" detail={`${current[0].date} 至 ${current.at(-1)?.date}`} />
        <div className="analysis-panel-body"><EChart option={trendOption} height={280} /></div>
      </section>
      <section className="analysis-panel" aria-label="课程分类分布">
        <SectionHeading title="课程分类分布" detail="按播放次数统计" />
        <div className="analysis-source-list">
          {categoryRows.length ? categoryRows.map((category, index) => <div className="analysis-source-row" key={category.name}>
            <div className="analysis-source-head"><span><i className={`analysis-category-dot is-${index % 4}`} />{category.name}</span><strong>{category.share.toFixed(1)}%</strong></div>
            <div className="analysis-source-track"><div className={`analysis-category-bar is-${index % 4}`} style={{ width: `${category.count / categoryRows[0].count * 100}%` }} /></div>
            <span className="analysis-source-count">{formatCount(category.count)} 次</span>
          </div>) : <div className="analysis-empty">当前筛选下暂无已发布课程</div>}
        </div>
      </section>
    </div>

    <section className="analysis-panel" aria-label="课程排行">
      <SectionHeading title="课程排行" detail="按播放次数排序" action={<Segmented aria-label="课程类型" value={requirement} onChange={(value) => setRequirement(value as typeof requirement)} options={[{ label: '全部', value: 'all' }, { label: '必修', value: 'required' }, { label: '选修', value: 'elective' }]} />} />
      <Table rowKey="id" size="small" pagination={false} scroll={{ x: 820 }} dataSource={courseRows} columns={[
        { title: '课程', key: 'title', width: 250, render: (_: unknown, row, index) => <div className="analysis-page-cell"><span className="analysis-rank">{index + 1}</span><strong>{row.title}</strong></div> },
        { title: '类型', dataIndex: 'requirement', width: 100, render: (value: CourseRequirement) => <Tag color={value === 'required' ? 'gold' : 'blue'}>{value === 'required' ? '必修' : '选修'}</Tag> },
        { title: '播放次数', dataIndex: 'plays', width: 130, align: 'right', sorter: (a, b) => a.plays - b.plays, render: formatCount },
        { title: '完课率', dataIndex: 'completion', width: 190, render: (value: number) => <div className="analysis-progress-cell"><Progress percent={value} size="small" strokeColor="#25864a" showInfo={false} /><span>{value}%</span></div> },
        { title: '平均观看', dataIndex: 'avgDuration', width: 110, align: 'right', render: (value: number) => `${value} 分钟` },
      ]} />
    </section>
  </div>
}
