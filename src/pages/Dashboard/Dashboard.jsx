import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import WeatherCard from '../../components/grind/WeatherCard.jsx'
import GrindRecommendCard from '../../components/grind/GrindRecommendCard.jsx'
import { useApp } from '../../context/AppContext.jsx'
import useGrindRecommendation from '../../hooks/useGrindRecommendation.js'
import { lowStockItems, orderQtyOf } from '../../utils/stockCalc.js'
import { groupSales, summarize, total } from '../../utils/salesStats.js'
import { toDateStr } from '../../utils/date.js'
import { won } from '../../utils/format.js'
import { judgeTime } from '../../utils/grindCalc.js'

export default function Dashboard() {
  const { state } = useApp()
  const { settings, items, stockIns, counts, shots, sales } = state
  const beans = items.filter((i) => i.category === '원두')
  const [beanId, setBeanId] = useState(null)
  const activeBeanId = beanId ?? beans[0]?.id ?? null
  const rec = useGrindRecommendation(activeBeanId)

  const low = lowStockItems(items, stockIns, counts, settings.shortageRate)
  const today = toDateStr()
  const todaySale = sales.find((s) => s.date === today)
  const week = summarize(groupSales(sales, 'week').slice(-1))
  const recent = [...shots].sort((a, b) => b.datetime.localeCompare(a.datetime)).slice(0, 3)
  const beanName = (id) => items.find((i) => i.id === id)?.name ?? '-'

  return (
    <section>
      <PageHeader title="오늘의 데일리빈" description={`${today} · ${settings.location.name} 매장`} />
      <div className="dash">
        <div className="stack">
          <WeatherCard location={settings.location.name} weather={rec.weather} loading={rec.loading} error={rec.error} onReload={rec.reload} />
          <GrindRecommendCard rec={rec} beans={beans} beanId={activeBeanId} onBeanChange={setBeanId} base={settings.grind.base} higherIsFiner={settings.grind.higherIsFiner !== false} grinder={settings.store.grinder} />
          {beans.length === 0 && <p className="muted">재고 페이지에 원두를 등록하면 원두별 숙성 보정이 들어가요.</p>}
        </div>
        <div className="stack">
          <div className="card">
            <div className="grind-head"><h2>최근 샷 (교대 인수인계)</h2><Link className="link" to="/grind">기록하기 →</Link></div>
            {recent.length === 0 && <p className="muted">아직 샷 기록이 없어요.</p>}
            <ul className="list plain">
              {recent.map((s) => {
                const j = judgeTime(s.time, settings.grind.targetTime, settings.grind.higherIsFiner)
                return (
                  <li key={s.id} className="list-row compact">
                    <span className="muted small">{s.datetime.slice(5).replace('T', ' ')}</span>
                    <span>{beanName(s.beanId)} <b>{s.grind}</b> · {s.time}초 <span className={`tag ${j.status}`}>{j.label}</span></span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="card">
            <div className="grind-head"><h2>⚠️ 재고 부족 경고</h2><Link className="link" to="/stock">재고 →</Link></div>
            {items.length === 0 && <p className="muted">등록된 품목이 없어요.</p>}
            {items.length > 0 && low.length === 0 && <p className="ok-text">✓ 모든 품목이 발주량의 {Math.round((1 - settings.shortageRate) * 100)}% 넘게 남아 있어요.</p>}
            <ul className="list plain">
              {low.map(({ item, qty }) => (
                <li key={item.id} className="list-row compact">
                  <span>{item.name}<span className="tag danger">부족</span></span>
                  <span className="danger-text">{Number(qty.toFixed(2))} / 발주량 {orderQtyOf(item)}{item.unit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="grind-head"><h2>매출</h2><Link className="link" to="/sales">자세히 →</Link></div>
            <div className="sales-sum">
              <div><span className="muted">오늘</span><strong>{todaySale ? won(total(todaySale)) : '미입력'}</strong></div>
              <div><span className="muted">이번 주</span><strong>{won(week.total)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
