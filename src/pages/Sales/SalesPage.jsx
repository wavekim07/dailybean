import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { toDateStr } from '../../utils/date.js'
import { won } from '../../utils/format.js'
import { groupSales, salesByWeather, summarize, total } from '../../utils/salesStats.js'
import { fetchWeatherAt, weatherText } from '../../utils/weatherApi.js'
import SalesForm from './SalesForm.jsx'
import { PaymentPieChart, SalesBarChart, SalesShareChart, WeatherSalesChart } from './SalesCharts.jsx'

const PERIODS = [
  { id: 'day', label: '일별 (14일)' },
  { id: 'week', label: '주간 (8주)' },
  { id: 'month', label: '월별 (6개월)' },
]

export default function SalesPage() {
  const { state, dispatch } = useApp()
  const { sales, settings } = state

  const [date, setDate] = useState(toDateStr())
  const [period, setPeriod] = useState('day')
  const [chartType, setChartType] = useState('bar') // 'bar' | 'pie' 버튼으로 전환
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

  const rows = useMemo(() => groupSales(sales, period), [sales, period])
  const sum = summarize(rows)
  const byWeather = useMemo(() => salesByWeather(sales), [sales])
  const monthList = sales.filter((s) => s.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section>
      <PageHeader photo title="매출" description="하루 카드·현금 매출을 입력하고 기간별로 확인해요." />
      <div className="two-col">
        <div className="stack">
          <SalesForm key={date + (existing?.id ?? '')} date={date} existing={existing} saving={saving} onDateChange={setDate} onSubmit={handleSubmit} />
          <div className="card">
            <div className="grind-head">
              <h2>매출 목록</h2>
              <input className="input small" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            {monthList.length === 0 && <p className="muted">이 달 기록이 없어요.</p>}
            <ul className="list plain">
              {monthList.map((s) => (
                <li key={s.id} className="list-row compact">
                  <span>
                    <strong>{s.date.slice(5)}</strong> {won(total(s))}
                    <span className="muted small"> · 카드 {won(s.card)} · 현금 {won(s.cash)}{s.weather && ` · ${weatherText(s.weather.code)} ${s.weather.temp}℃`}</span>
                  </span>
                  <span className="actions">
                    <button className="btn" onClick={() => setDate(s.date)}>수정</button>
                    <button className="btn danger" onClick={() => setDeleteTarget(s)}>삭제</button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="stack">
          <div className="tabs">
            {PERIODS.map((p) => (
              <button key={p.id} className={`tab ${period === p.id ? 'active' : ''}`} onClick={() => setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
          <div className="grid stats">
            <div className="card"><h2>합계</h2><p className="big">{won(sum.total)}</p></div>
            <div className="card"><h2>영업일 평균</h2><p className="big">{won(sum.avg)}</p></div>
            <div className="card"><h2>카드 비중</h2><p className="big">{Math.round(sum.cardRate * 100)}%</p></div>
          </div>
          <div className="card">
            <div className="grind-head">
              <h2>기간별 매출</h2>
              <button className="btn" onClick={() => setChartType((t) => (t === 'bar' ? 'pie' : 'bar'))}>
                {chartType === 'bar' ? '🥧 원형으로 보기' : '📊 막대로 보기'}
              </button>
            </div>
            {chartType === 'bar' ? <SalesBarChart rows={rows} /> : <SalesShareChart rows={rows} />}
          </div>
          <div className="grid half">
            <div className="card"><h2>결제 비중</h2><PaymentPieChart card={sum.card} cash={sum.cash} /></div>
            <div className="card"><h2>날씨별 하루 평균 (전체 기간)</h2><WeatherSalesChart rows={byWeather} /></div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteTarget && `${deleteTarget.date} 매출 기록을 삭제할까요?`}
        onConfirm={() => { dispatch({ type: 'DELETE_SALE', payload: deleteTarget.id }); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
