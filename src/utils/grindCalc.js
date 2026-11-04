import { daysBetween, toDateStr } from './date.js'

const round1 = (n) => Math.round(n * 10) / 10
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

// 원두의 가장 최근 입고 기록의 로스팅 날짜
export function latestRoastDate(stockIns, beanId) {
  const rows = stockIns.filter((s) => s.itemId === beanId && s.roastDate).sort((a, b) => b.date.localeCompare(a.date))
  return rows[0]?.roastDate ?? null
}

// 기록 보정: 최근 10개 샷의 (실제 분쇄도 − 그때 날씨 기반 추천값) 평균, ±0.3 제한
export function logAdjustment(shots, beanId) {
  const recent = shots
    .filter((s) => s.recommended != null && (!beanId || s.beanId === beanId))
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, 10)
  if (recent.length === 0) return { value: 0, count: 0 }
  const avg = recent.reduce((s, x) => s + (x.grind - x.recommended), 0) / recent.length
  return { value: clamp(avg, -0.3, 0.3), count: recent.length }
}

/**
 * 분쇄도 추천
 * 추천 = 기준값 + 방향×(− a×(습도−기준습도)/10 − b×(기온−기준기온)/10 + 숙성보정) + 기록보정
 * 방향: 그라인더가 '숫자 높을수록 가늘게'면 +1, '숫자 높을수록 굵게'면 −1
 *   (보정값은 '+ = 가늘게' 기준으로 정해 두고, 다이얼 방향에 맞게 부호만 바꿈.
 *    기록보정은 실제 다이얼 숫자 차이라서 방향을 바꾸지 않음)
 * @param weather { humidity, temp }
 * @param g settings.grind
 * @param options { roastDate, onDate, logAdj }
 * @returns { value, raw, parts[] }  parts는 화면에 근거로 보여줄 항목
 */
export function calcGrind(weather, g, { roastDate = null, onDate = toDateStr(), logAdj = null } = {}) {
  const parts = []
  const dir = g.higherIsFiner === false ? -1 : 1
  let v = g.base

  if (weather) {
    const h = (dir * -g.a * (weather.humidity - g.baseHumidity)) / 10
    const t = (dir * -g.b * (weather.temp - g.baseTemp)) / 10
    v += h + t
    parts.push({ label: `습도 ${weather.humidity}%`, value: h })
    parts.push({ label: `기온 ${weather.temp}℃`, value: t })
  }

  let restDays = null
  if (roastDate) {
    restDays = daysBetween(roastDate, onDate)
    if (restDays <= g.restDays) {
      v += dir * g.restAdj
      parts.push({ label: `로스팅 ${restDays}일차 (숙성 중)`, value: dir * g.restAdj })
    }
  }

  if (logAdj && logAdj.count > 0) {
    v += logAdj.value
    parts.push({ label: `최근 샷 ${logAdj.count}개 보정`, value: logAdj.value })
  }

  return { value: round1(clamp(v, g.min, g.max)), raw: v, parts, restDays, resting: restDays !== null && restDays <= g.restDays }
}

// 추출 시간 판정 → 다음 조정 방향
export function judgeTime(time, [min, max], higherIsFiner = true) {
  const finer = higherIsFiner === false ? '−0.1' : '+0.1'
  const coarser = higherIsFiner === false ? '+0.1' : '−0.1'
  if (time < min) return { status: 'fast', label: '빠름', tip: `${finer} 가늘게` }
  if (time > max) return { status: 'slow', label: '느림', tip: `${coarser} 굵게` }
  return { status: 'ok', label: '적정', tip: '유지' }
}

// 오늘 남은 시간 중 추천값이 0.2 이상 달라지는 첫 시각
export function findAdjustPoint(hourly, g, baseValue, opts, now = new Date()) {
  const nowHour = now.getHours()
  for (const h of hourly) {
    const hour = Number(h.time.slice(11, 13))
    if (hour <= nowHour || hour < 7 || hour > 22) continue
    const v = calcGrind(h, g, opts).value
    if (Math.abs(v - baseValue) >= 0.2 - 1e-9) return { hour, value: v, humidity: h.humidity, temp: h.temp }
  }
  return null
}

// 근거 표시용: 다이얼 숫자 변화량
export const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(2)}`
