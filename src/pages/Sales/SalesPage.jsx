import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { toDateStr } from '../../utils/date.js'
import { won } from '../../utils/format.js'
import { groupSales, hourLabel, hourlyAverage, hoursOf, summarize, total } from '../../utils/salesStats.js'
import { fetchWeatherAt, weatherText } from '../../utils/weatherApi.js'
import Guard from '../../components/auth/Guard.jsx'
import { usePermission } from '../../context/AdminContext.jsx'
import SalesForm from './SalesForm.jsx'
import { HourlyAvgChart, SalesBarChart } from './SalesCharts.jsx'
import SalesCalendar from './SalesCalendar.jsx'

const PERIODS = [
  { id: 'day', label: '일별 (14일)' },
  { id: 'week7', label: '주간 (7일)' },
  { id: 'month', label: '월별 (6개월)' },
]

export default function SalesPage() {
  const { state, dispatch } = useApp()
  const { can } = usePermission()
  const { sales, settings } = state

  const [date, setDate] = useState(toDateStr())
  const [period, setPeriod] = useState('day')
  const [endDate, setEndDate] = useState(toDateStr()) // 기준일: 이 날까지 거슬러 보여 줌 (주간 = 기준일 −6일 ~ 기준일)
  const [view, setView] = useState('bar') // 'bar' | 'calendar' 버튼으로 전환
  const [month, setMonth] = useState(toDateStr().slice(0, 7))
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const existing = sales.find((s) => s.date === date)

  const handleSubmit = async (data) => {
    setSaving(true)
    let weather = existing?.weather ?? null
    if (!weather && data.date <= toDateStr()) {
      try {
        weather = await fetchWeatherAt(settings.location.lat, settings.location.lon, `${data.date}T13:00`)
      } catch {
        weather = null // 날씨 없이 저장
      }
    }
    if (existing) dispatch({ type: 'UPDATE_SALE', payload: { ...data, id: existing.id, weather } })
    else dispatch({ type: 'ADD_SALE', payload: { ...data, weather } })
    setSaving(false)
  }

  const rows = useMemo(() => groupSales(sales, period, endDate), [sales, period, endDate])
  const sum = summarize(rows)
  const hourly = useMemo(() => hourlyAverage(sales, month, hoursOf(settings.businessHours)), [sales, month, settings.businessHours])
  const peak = hourly.days ? hourly.rows.reduce((a, r) => (r.avg > a.avg ? r : a), hourly.rows[0]) : null
  const monthList = sales.filter((s) => s.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section>
      <PageHeader photo title="매출" description="하루 카드·현금 매출을 입력하고 기간별로 확인해요." />
      {/* 1줄: 입력과 그 달 목록 (마감 때 쓰는 부분) */}
      <div className="eq-row">
        <Guard perm="salesInput"><SalesForm key={date + (existing?.id ?? '')} date={date} existing={existing} saving={saving} onDateChange={setDate} onSubmit={handleSubmit} businessHours={settings.businessHours} /></Guard>
        <div className="card fit">
          <div className="grind-head">
            <h2>매출 목록</h2>
            <input className="input small" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          {monthList.length === 0 && <p className="muted">이 달 기록이 없어요.</p>}
          <ul className="list plain scroll">
            {monthList.map((s) => (
              <li key={s.id} className="list-row compact">
                <span>
                  <strong>{s.date.slice(5)}</strong> {won(total(s))}
                  <span className="muted small"> · 카드 {won(s.card)} · 현금 {won(s.cash)}{s.weather && ` · ${weatherText(s.weather.code)} ${s.weather.temp}℃`}</span>
                </span>
                {can('salesInput') && <span className="actions">
                  <button className="btn" onClick={() => setDate(s.date)}>수정</button>
                  <button className="btn danger" onClick={() => setDeleteTarget(s)}>삭제</button>
                </span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2줄부터: 분석 (매출 차트 보기 권한) */}
      <Guard perm="salesView">
        <div className="sales-toolbar">
          <div className="tabs">
            {PERIODS.map((p) => (
              <button key={p.id} className={`tab ${period === p.id ? 'active' : ''}`} onClick={() => setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
          <label className="inline">기준일<input className="input small" type="date" value={endDate} onChange={(e) => e.target.value && setEndDate(e.target.value)} /></label>
          {period === 'week7' && rows.length > 0 && <span className="muted small">{rows[0].key} ~ {rows[rows.length - 1].key} (기준일 포함 7일)</span>}
        </div>
        <div className="grid stats">
          <div className="card"><h2>합계</h2><p className="big">{won(sum.total)}</p></div>
          <div className="card"><h2>영업일 평균</h2><p className="big">{won(sum.avg)}</p><p className="muted small">영업 {sum.days}일</p></div>
          <div className="card"><h2>카드 비중</h2><p className="big">{Math.round(sum.cardRate * 100)}%</p><p className="muted small">카드 {won(sum.card)} · 현금 {won(sum.cash)}</p></div>
        </div>
        <div className="eq-row">
          <div className="card chart-card">
            <div className="grind-head">
              <h2>{view === 'bar' ? '기간별 매출' : '매출 달력'}</h2>
              <button className="btn" onClick={() => setView((v) => (v === 'bar' ? 'calendar' : 'bar'))}>
                {view === 'bar' ? '📅 달력으로 보기' : '📊 막대로 보기'}
              </button>
            </div>
            {view === 'bar'
              ? <SalesBarChart rows={rows} />
              : <SalesCalendar embedded sales={sales} month={month} onMonthChange={setMonth} onPick={can('salesInput') ? (d) => { setDate(d); window.scrollTo({ top: 0, behavior: 'smooth' }) } : undefined} />}
          </div>
          <div className="card chart-card">
            <h2>{Number(month.slice(5))}월 시간대별 평균</h2>
            <p className="muted">{hourly.days ? `시간대별 금액을 넣은 ${hourly.days}일 기준 · 가장 바쁜 시간 ${hourLabel(peak.hour)} (하루 평균 ${won(peak.avg)})` : '하루 중 어느 시간이 바쁜지 보여 줘요.'}</p>
            <HourlyAvgChart rows={hourly.rows} days={hourly.days} />
          </div>
        </div>
      </Guard>
      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteTarget && `${deleteTarget.date} 매출 기록을 삭제할까요?`}
        onConfirm={() => { dispatch({ type: 'DELETE_SALE', payload: deleteTarget.id }); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
