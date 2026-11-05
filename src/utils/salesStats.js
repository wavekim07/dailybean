import { toDateStr } from './date.js'
import { isRainy } from './weatherApi.js'

export const total = (s) => s.card + s.cash

// 월요일 시작 주의 첫날
function weekStart(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return toDateStr(d)
}

// day: 하루씩 14일 / week7: 기준일 포함 최근 7일(기준일 −6일 ~ 기준일)을 하루씩 / week: 월요일 시작 주 / month: 달
const daily = (period) => period === 'day' || period === 'week7'
const keyOf = (date, period) => (daily(period) ? date : period === 'week' ? weekStart(date) : date.slice(0, 7))
const WD = ['일', '월', '화', '수', '목', '금', '토']

const labelOf = (key, period) => {
  if (period === 'week7') return `${key.slice(5).replace('-', '/')}(${WD[new Date(`${key}T00:00:00`).getDay()]})`
  if (period === 'day') return key.slice(5).replace('-', '/')
  if (period === 'week') return `${key.slice(5).replace('-', '/')}주`
  return `${Number(key.slice(5))}월`
}

// 기준일에서 거슬러 올라간 구간 목록 (매출이 없는 날도 0으로 표시)
function buckets(period, endDate) {
  const n = period === 'day' ? 14 : period === 'week7' ? 7 : period === 'week' ? 8 : 6
  const keys = []
  const d = new Date(`${endDate}T00:00:00`)
  for (let i = 0; i < n; i++) {
    keys.unshift(keyOf(toDateStr(d), period))
    if (daily(period)) d.setDate(d.getDate() - 1)
    else if (period === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1, 1)
  }
  return [...new Set(keys)]
}

export function groupSales(sales, period, endDate = toDateStr()) {
  const keys = buckets(period, endDate)
  const map = Object.fromEntries(keys.map((k) => [k, { key: k, label: labelOf(k, period), card: 0, cash: 0, days: 0 }]))
  for (const s of sales) {
    const row = map[keyOf(s.date, period)]
    if (!row) continue
    row.card += s.card
    row.cash += s.cash
    row.days += 1
  }
  return keys.map((k) => ({ ...map[k], total: map[k].card + map[k].cash }))
}

export function summarize(rows) {
  const card = rows.reduce((s, r) => s + r.card, 0)
  const cash = rows.reduce((s, r) => s + r.cash, 0)
  const days = rows.reduce((s, r) => s + r.days, 0)
  return { card, cash, total: card + cash, days, avg: days ? (card + cash) / days : 0, cardRate: card + cash ? card / (card + cash) : 0 }
}

// 날씨별 하루 평균 매출 (날씨 기록이 있는 날만)
export function salesByWeather(sales) {
  const groups = [
    { name: '맑음·구름', test: (w) => !isRainy(w.code) && w.code <= 3 },
    { name: '비·눈', test: (w) => isRainy(w.code) || (w.code >= 71 && w.code <= 86) },
    { name: '추운 날 (10℃ 미만)', test: (w) => w.temp < 10 },
    { name: '더운 날 (25℃ 이상)', test: (w) => w.temp >= 25 },
  ]
  return groups.map((g) => {
    const days = sales.filter((s) => s.weather && g.test(s.weather))
    return { name: g.name, avg: days.length ? days.reduce((sum, s) => sum + total(s), 0) / days.length : 0, days: days.length }
  })
}

// 시간대 칸 이름: 13 → "13:00 ~ 14:00" (포스기 시간대별 매출 형식)
export const hourLabel = (h) => `${String(h).padStart(2, '0')}:00 ~ ${String((h + 1) % 24).padStart(2, '0')}:00`
export const hoursOf = ({ open, close }) => Array.from({ length: Math.max(0, close - open) }, (_, i) => open + i)
export const hourlySum = (hourly) => Object.values(hourly || {}).reduce((a, v) => a + Number(v || 0), 0)

// 그 달 시간대별 평균: 시간대별 금액을 적은 날만 모아서, 시간대마다 하루 평균 금액
// 적지 않은 날까지 0으로 넣으면 평균이 낮아지니까, 시간대 기록이 있는 날만 나눔
export function hourlyAverage(sales, month, hours) {
  const days = sales.filter((s) => s.date.startsWith(month) && s.hourly && hourlySum(s.hourly) > 0)
  const rows = hours.map((h) => {
    const sum = days.reduce((a, s) => a + Number(s.hourly[h] || 0), 0)
    return { hour: h, label: `${h}시`, range: hourLabel(h), avg: days.length ? sum / days.length : 0 }
  })
  return { days: days.length, rows }
}
