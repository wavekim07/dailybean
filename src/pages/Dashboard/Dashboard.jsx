import { useState } from 'react'
import { Link } from 'react-router-dom'
import PhotoPicker from '../../components/photo/PhotoPicker.jsx'
import StaffPicker from '../../components/common/StaffPicker.jsx'
import Handoff from '../Ops/Handoff.jsx'
import { useApp } from '../../context/AppContext.jsx'
import useGrindRecommendation from '../../hooks/useGrindRecommendation.js'
import { hasStockRecord, lowStockItems } from '../../utils/stockCalc.js'
import { groupSales, summarize, total } from '../../utils/salesStats.js'
import { toDateStr } from '../../utils/date.js'
import { won } from '../../utils/format.js'
import { extractOf, judgeTime, ratioText, signed } from '../../utils/grindCalc.js'
import { weatherText } from '../../utils/weatherApi.js'
import { photoSrc } from '../../utils/photos.js'
import { usePermission } from '../../context/AdminContext.jsx'

const greeting = (h) => (h < 11 ? '좋은 아침이에요' : h < 17 ? '좋은 오후예요' : '오늘도 수고했어요')
const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Dashboard() {
  const { state } = useApp()
  const { can } = usePermission()
  const { settings, items, stockIns, counts, shots, sales } = state
  const beans = items.filter((i) => i.category === '원두')
  const [beanId, setBeanId] = useState(null)
  const [picking, setPicking] = useState(false)
  const activeBeanId = beanId ?? beans[0]?.id ?? null
  const rec = useGrindRecommendation(activeBeanId)
  const higherIsFiner = settings.grind.higherIsFiner !== false
  const extract = extractOf(settings.grind)

  const [now] = useState(() => new Date())
  const today = toDateStr()
  const low = lowStockItems(items, stockIns, counts, settings.shortageRate)
  const waiting = (state.orders || []).filter((o) => o.status !== 'received').length
  const unknown = items.filter((i) => !hasStockRecord(i, stockIns, counts))
  const todaySale = sales.find((s) => s.date === today)
  const week = summarize(groupSales(sales, 'week7')) // 오늘 포함 최근 7일 (매출 화면의 주간과 같은 기준)
  const last = [...shots].sort((a, b) => b.datetime.localeCompare(a.datetime))[0] // 홈에는 마지막 샷 하나만 (전체는 분쇄도 화면)
  const todayShots = shots.filter((s) => s.datetime.startsWith(today)).length
  const w = rec.weather?.current

  return (
    <section className="dashboard">
      {/* 1. 매장 사진 위에 오늘의 핵심: 날씨 + 추천 분쇄도 */}
      <div className="hero" style={{ backgroundImage: `url(${photoSrc(settings)})` }}>
        <div className="hero-shade" />
        <div className="hero-inner">
          <div className="hero-top">
            <span className="hero-store">{settings.store.name || '데일리빈'} · {settings.location.name}</span>
            <span className="hero-actions"><StaffPicker dark /><button className="chip-btn" onClick={() => setPicking(true)}>사진</button></span>
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

          <div className="grind-panel today-panel">
            <div className="grind-panel-head"><span>오늘 할 일</span><Link className="link" to="/ops">운영 →</Link></div>
            <div className="today-checks">
              {[['open', '오픈'], ['close', '마감']].map(([k, label]) => {
                const list = settings.checklists[k]
                const done = list.filter((i) => state.checkLogs.some((c) => c.date === today && c.kind === k && c.itemId === i.id)).length
                return (
                  <Link key={k} to="/ops?tab=today" className="today-check">
                    <span>{label} 확인</span>
                    <strong>{list.length ? `${done}/${list.length}` : '항목 없음'}</strong>
                    <span className="progress"><span className="bar" style={{ width: list.length ? `${(done / list.length) * 100}%` : 0 }} /></span>
                  </Link>
                )
              })}
              {/* 재고 부족이면 바로 발주 목록으로 (예전 '발주 확인' 칸을 여기로 합침) */}
              <Link to={low.length || waiting ? '/ops?tab=order' : '/ops?tab=stock'} className={`today-check ${low.length ? 'alert' : ''}`}>
                <span>재고·발주{waiting ? ` · 입고 대기 ${waiting}` : ''}</span>
                <strong>{items.length === 0 ? '등록 전' : low.length ? `${low.length}개 부족` : unknown.length === items.length ? '수량 입력 전' : '여유'}</strong>
                <span className="glance-sub">{items.length === 0 ? '품목을 등록해 주세요' : low.length ? low.slice(0, 2).map((l) => l.item.name).join(', ') : unknown.length ? `${unknown.length}개 수량 입력 전` : '발주 걱정 없어요'}</span>
              </Link>
            </div>
            <h3 className="sub-title">인수인계 <Link className="link" to="/ops?tab=today">남기기</Link></h3>
            <Handoff compact />
          </div>
        </div>
        <a className="hero-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo.com</a>
      </div>

      {/* 2. 분쇄도와 매출 */}
      <div className="dash-columns">
          <div className="panel grind-home">
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
                기준 {settings.grind.base.toFixed(1)} · 높을수록 {higherIsFiner ? '가늘게' : '굵게'}<br />
                목표 {extract.dose}g → {extract.yield}{extract.unit} ({ratioText(extract.dose, extract.yield)})
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
              <span className="muted-light">오늘 기록 {todayShots}잔{last && <><br />마지막 {last.datetime.slice(11, 16)} · {Number(last.grind).toFixed(1)} · {last.time}초 {judgeTime(last.time, settings.grind.targetTime, settings.grind.higherIsFiner).label}</>}</span>
            </div>
          </div>
        <div className="panel">
          <div className="panel-title"><h2>매출</h2><Link className="link" to="/sales">자세히</Link></div>
          <div className="sales-sum">
            <div><span className="muted">오늘</span><strong>{todaySale ? won(total(todaySale)) : '입력 전'}</strong></div>
            <div><span className="muted">최근 7일</span><strong>{can('salesView') ? won(week.total) : '🔒'}</strong></div>
          </div>
          {todaySale?.memo && <p className="muted" style={{ marginTop: 8 }}>메모: {todaySale.memo}</p>}
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
