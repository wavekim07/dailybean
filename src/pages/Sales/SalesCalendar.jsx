import { manwon, won } from '../../utils/format.js'
import { total } from '../../utils/salesStats.js'
import { toDateStr } from '../../utils/date.js'
import { weatherText } from '../../utils/weatherApi.js'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n) => String(n).padStart(2, '0')

// 포스기 매출 달력처럼: 그 달 날짜마다 하루 매출. 많이 판 날일수록 진하게.
// month: 'YYYY-MM', onPick(date): 날짜를 누르면 (입력 권한이 있을 때) 그날 매출 입력으로
export default function SalesCalendar({ sales, month, onMonthChange, onPick, embedded = false }) {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1).getDay()
  const days = new Date(y, m, 0).getDate()
  const byDate = Object.fromEntries(sales.filter((s) => s.date.startsWith(month)).map((s) => [s.date, s]))
  const list = Object.values(byDate)
  const max = Math.max(0, ...list.map(total))
  const min = list.length > 1 ? Math.min(...list.map(total)) : null // 최저는 영업일이 2일 이상일 때만
  const sum = list.reduce((a, s) => a + total(s), 0)
  const today = toDateStr()
  const move = (d) => { const t = new Date(y, m - 1 + d, 1); onMonthChange(`${t.getFullYear()}-${pad(t.getMonth() + 1)}`) }

  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  const weekSum = (row) => row.reduce((a, d) => a + (d && byDate[`${month}-${pad(d)}`] ? total(byDate[`${month}-${pad(d)}`]) : 0), 0)

  return (
    <div className={embedded ? '' : 'card'}>
      <div className="grind-head">
        <h3 className="cal-title">{y}년 {m}월</h3>
        <span className="cal-nav">
          <button className="btn" onClick={() => move(-1)} aria-label="이전 달">‹</button>
          <button className="btn" onClick={() => move(1)} aria-label="다음 달">›</button>
        </span>
      </div>
      <p className="muted">합계 <b>{won(sum)}</b> · 영업 {list.length}일{list.length ? ` · 하루 평균 ${won(sum / list.length)}` : ''}</p>
      <div className="cal" role="grid">
        {DAYS.map((d, i) => <div key={d} className={`cal-head ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{d}</div>)}
        <div className="cal-head">주간 합계</div>
        {weeks.map((row, w) => [...row.map((d, j) => {
          const i = w * 7 + j
          if (!d) return <div key={`e${i}`} className="cal-cell empty" />
          const date = `${month}-${pad(d)}`
          const s = byDate[date]
          const level = s && max > 0 ? Math.ceil((total(s) / max) * 4) : 0 // 1~4단계 진하기
          const Tag = onPick ? 'button' : 'div'
          return (
            <Tag key={date} className={`cal-cell lv${level} ${date === today ? 'today' : ''}`} onClick={onPick ? () => onPick(date) : undefined}
              title={s ? `${date} ${won(total(s))}${s.weather ? ` · ${weatherText(s.weather.code)}` : ''}${s.memo ? ` · ${s.memo}` : ''}` : date}>
              <span className={`cal-day ${i % 7 === 0 ? 'sun' : i % 7 === 6 ? 'sat' : ''}`}>{d}{s && total(s) === max && max > 0 && <em className="cal-mark hi">최고</em>}{s && min !== null && total(s) === min && min < max && <em className="cal-mark lo">최저</em>}</span>
              {s && <span className="cal-amt">{manwon(total(s))}</span>}
              {s?.memo && <span className="cal-dot" aria-label="메모 있음" />}
            </Tag>
          )
        }), <div key={`w${w}`} className="cal-cell cal-week"><span className="cal-day">{w + 1}주</span>{weekSum(row) > 0 && <span className="cal-amt">{manwon(weekSum(row))}</span>}</div>])}
      </div>
      <p className="muted small">색이 진할수록 이 달에서 많이 판 날이에요.{onPick ? ' 날짜를 누르면 그날 매출을 입력하거나 고칠 수 있어요.' : ''}</p>
    </div>
  )
}
