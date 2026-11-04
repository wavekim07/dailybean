import { useState } from 'react'
import { Link } from 'react-router-dom'
import PhotoPicker from '../../components/photo/PhotoPicker.jsx'
import { useApp } from '../../context/AppContext.jsx'
import useGrindRecommendation from '../../hooks/useGrindRecommendation.js'
import { lowStockItems, orderQtyOf } from '../../utils/stockCalc.js'
import { groupSales, summarize, total } from '../../utils/salesStats.js'
import { toDateStr } from '../../utils/date.js'
import { won } from '../../utils/format.js'
import { judgeTime, signed } from '../../utils/grindCalc.js'
import { weatherText } from '../../utils/weatherApi.js'
import { photoSrc } from '../../utils/photos.js'

const greeting = (h) => (h < 11 ? '좋은 아침이에요' : h < 17 ? '좋은 오후예요' : '오늘도 수고했어요')
const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Dashboard() {
  const { state } = useApp()
  const { settings, items, stockIns, counts, shots, sales } = state
  const beans = items.filter((i) => i.category === '원두')
  const [beanId, setBeanId] = useState(null)
  const [picking, setPicking] = useState(false)
  const activeBeanId = beanId ?? beans[0]?.id ?? null
  const rec = useGrindRecommendation(activeBeanId)
  const higherIsFiner = settings.grind.higherIsFiner !== false

  const [now] = useState(() => new Date())
  const today = toDateStr()
  const low = lowStockItems(items, stockIns, counts, settings.shortageRate)
  const todaySale = sales.find((s) => s.date === today)
  const week = summarize(groupSales(sales, 'week').slice(-1))
  const recent = [...shots].sort((a, b) => b.datetime.localeCompare(a.datetime)).slice(0, 4)
  const todayShots = shots.filter((s) => s.datetime.startsWith(today)).length
  const beanName = (id) => items.find((i) => i.id === id)?.name ?? '-'
  const w = rec.weather?.current

  return (
    <section className="dashboard">
      {/* 1. 매장 사진 위에 오늘의 핵심: 날씨 + 추천 분쇄도 */}
      <div className="hero" style={{ backgroundImage: `url(${photoSrc(settings)})` }}>
        <div className="hero-shade" />
        <div className="hero-inner">
          <div className="hero-top">
            <span className="hero-store">{settings.store.name || '데일리빈'} · {settings.location.name}</span>
            <button className="chip-btn" onClick={() => setPicking(true)}>사진 바꾸기</button>
          </div>
          <h1 className="hero-title">{greeting(now.getHours())}</h1>
          <p className="hero-date">{now.getMonth() + 1}월 {now.getDate()}일 {DAYS[now.getDay()]}요일</p>

          <div className="hero-weather">
            {rec.loading && !w && <span className="chip glass">날씨 불러오는 중…</span>}
            {rec.error && <button className="chip glass" onClick={rec.reload}>날씨를 못 불러왔어요 · 다시 시도</button>}
            {w && (
              <>
                <span className="chip glass">{weatherText(w.code)}</span>
                <span className="chip glass">{w.temp}℃</span>
                <span className="chip glass">습도 {w.humidity}%</span>
              </>
            )}
          </div>

          <div className="grind-panel">
            <div className="grind-panel-head">
              <span>오늘 추천 분쇄도</span>
              {beans.length > 0 && (
                <select className="pill-select" value={activeBeanId ?? ''} onChange={(e) => setBeanId(e.target.value || null)} aria-label="원두 선택">
                  {beans.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            </div>
            <div className="grind-panel-main">
              <strong className="grind-number">{rec.loading && !rec.weather ? '…' : rec.value.toFixed(1)}</strong>
              <span className="grind-meta">
                {settings.store.grinder || '그라인더'}<br />
                기준 {settings.grind.base.toFixed(1)} · 높을수록 {higherIsFiner ? '가늘게' : '굵게'}
              </span>
            </div>
            {rec.parts.length > 0 && (
              <div className="reason-chips">
                {rec.parts.map((p) => (
                  <span key={p.label} className="reason-chip">{p.label} <b className={p.value * (higherIsFiner ? 1 : -1) > 0 ? 'finer' : p.value !== 0 ? 'coarser' : ''}>{signed(p.value)}</b></span>
                ))}
              </div>
            )}
            {rec.adjust && <p className="panel-note">{rec.adjust.hour}시쯤 습도 {rec.adjust.humidity}% 예상 → <b>{rec.adjust.value.toFixed(1)}</b>로 다시 맞춰 보세요</p>}
            <div className="panel-actions">
              <Link className="btn primary big-btn" to="/grind">샷 기록하기</Link>
              <span className="muted-light">오늘 기록 {todayShots}잔</span>
            </div>
          </div>
        </div>
        <a className="hero-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo.com</a>
      </div>

      {/* 2. 오늘 챙길 것 한눈에 */}
      <div className="glance">
        <Link to="/stock" className={`glance-item ${low.length ? 'alert' : ''}`}>
          <span className="glance-label">재고</span>
          <strong>{items.length === 0 ? '품목 등록 전' : low.length ? `${low.length}개 부족` : '여유 있음'}</strong>
          <span className="glance-sub">{low.slice(0, 2).map((l) => l.item.name).join(', ') || '발주 걱정 없어요'}</span>
        </Link>
        <Link to="/sales" className="glance-item">
          <span className="glance-label">오늘 매출</span>
          <strong>{todaySale ? won(total(todaySale)) : '입력 전'}</strong>
          <span className="glance-sub">이번 주 {won(week.total)}</span>
        </Link>
        <Link to="/customers" className="glance-item">
          <span className="glance-label">단골</span>
          <strong>{state.customers.length}명</strong>
          <span className="glance-sub">쿠폰 보유 {state.customers.filter((c) => c.coupons > 0).length}명</span>
        </Link>
      </div>

      {/* 3. 교대 인수인계: 최근 샷 */}
      <div className="dash-columns">
        <div className="panel">
          <div className="panel-title"><h2>최근 샷 · 인수인계</h2><Link className="link" to="/grind">전체 보기</Link></div>
          {recent.length === 0 && <p className="muted">아직 샷 기록이 없어요. 첫 샷을 기록하면 다음 근무자가 바로 볼 수 있어요.</p>}
          <ol className="timeline">
            {recent.map((s) => {
              const j = judgeTime(s.time, settings.grind.targetTime, settings.grind.higherIsFiner)
              return (
                <li key={s.id}>
                  <span className="tl-time">{s.datetime.slice(5, 10).replace('-', '/')} {s.datetime.slice(11, 16)}</span>
                  <span className="tl-body"><b>{s.grind}</b> · {beanName(s.beanId)} · {s.time}초 <span className={`tag ${j.status}`}>{j.label}</span>{s.memo && <em className="tl-memo">“{s.memo}”</em>}</span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="panel">
          <div className="panel-title"><h2>발주 확인</h2><Link className="link" to="/stock">재고 보기</Link></div>
          {items.length === 0 && <p className="muted">재고 화면에서 품목과 기본 발주량을 등록해 주세요.</p>}
          {items.length > 0 && low.length === 0 && <p className="ok-text">모든 품목이 발주량의 {Math.round((1 - settings.shortageRate) * 100)}% 넘게 남아 있어요.</p>}
          <ul className="low-list">
            {low.map(({ item, qty }) => {
              const pct = Math.max(0, Math.min(100, (qty / orderQtyOf(item)) * 100))
              return (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span className="progress small-bar"><span className="bar danger" style={{ width: `${pct}%` }} /></span>
                  <span className="danger-text">{Number(qty.toFixed(2))}{item.unit}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {picking && (
        <div className="modal-backdrop" onClick={() => setPicking(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title"><h2>배경 사진</h2><button className="btn" onClick={() => setPicking(false)}>닫기</button></div>
            <PhotoPicker onDone={() => setPicking(false)} />
          </div>
        </div>
      )}
    </section>
  )
}
