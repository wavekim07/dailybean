import { daysBetween, toDateStr } from './date.js'

const round1 = (n) => Math.round(n * 10) / 10
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

// 원두의 가장 최근 입고 기록의 로스팅 날짜
export function latestRoastDate(stockIns, beanId) {
  const rows = stockIns.filter((s) => s.itemId === beanId && s.roastDate).sort((a, b) => b.date.localeCompare(a.date))
  return rows[0]?.roastDate ?? null
}

// 기록 보정: 조건을 통과한 "잘 나온 샷"만 학습 (현장 검증에서 느린 샷까지 배우는 문제를 찾아 고침)
//  - 같은 원두(원두를 안 고르면 보정 안 함), 목표 추출 시간 안(예: 26~30초), 도징이 목표에서 ±doseTol g 이내
//  - 조건을 통과한 최근 10개의 (실제 분쇄도 − 그때 날씨 기준 추천값) 평균, ±0.3 제한
//  - 조건을 통과한 샷이 minCount개 미만이면 보정하지 않음 (몇 잔으로 추천이 흔들리지 않게)
// 날씨 기준 추천값은 baseRecommended(새 기록) 또는 recommended(예전 기록: 날씨 기준값만 저장했음)
export const baseOf = (s) => s.baseRecommended ?? s.recommended

export function isLearnable(s, { targetTime = null, targetDose = null, doseTol = 0.2 } = {}) {
  if (baseOf(s) == null || s.grind == null) return false
  if (targetTime && !(Number(s.time) >= targetTime[0] && Number(s.time) <= targetTime[1])) return false
  if (targetDose != null && (s.dose == null || s.dose === '' || Math.abs(Number(s.dose) - Number(targetDose)) > doseTol + 1e-9)) return false
  return true
}

export function logAdjustment(shots, beanId, { targetTime = null, targetDose = null, doseTol = 0.2, minCount = 3 } = {}) {
  const valid = shots
    .filter((s) => beanId && s.beanId === beanId && isLearnable(s, { targetTime, targetDose, doseTol }))
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, 10)
  if (valid.length < minCount) return { value: 0, count: 0, valid: valid.length, needed: minCount - valid.length }
  const avg = valid.reduce((sum, x) => sum + (x.grind - baseOf(x)), 0) / valid.length
  return { value: clamp(avg, -0.3, 0.3), count: valid.length, valid: valid.length, needed: 0 }
}

// 화면과 저장에서 같은 조건을 쓰도록 설정에서 학습 조건을 꺼냄
export const learnOptsOf = (g) => ({ targetTime: g.targetTime ?? null, targetDose: g.targetDose ?? null, doseTol: 0.2, minCount: 3 })

// 샷을 저장할 때 남길 추천값 두 가지
//  - baseRecommended: 그 시각 날씨·원두 숙성만 반영한 값 (기록 보정이 이 값과의 차이를 배움)
//  - recommended: 기록 보정까지 더해 화면에 보여 준 최종 추천값 (추천 vs 실제 비교용)
// 기존 샷을 고칠 때 날짜·시각이 그대로면 당시 두 값을 그대로 유지 (지금 설정·기록으로 다시 계산하지 않음)
// 날짜·시각을 고치면 날씨도 새로 가져오므로, 그 시각 기준으로 다시 계산
export function shotRecommendations({ data, editingShot = null, weather, shots = [], grind, roastDate = null, grinder = '' }) {
  if (editingShot && editingShot.datetime === data.datetime && editingShot.recommended != null) {
    return { baseRecommended: editingShot.baseRecommended ?? editingShot.recommended, recommended: editingShot.recommended }
  }
  if (!weather) return { baseRecommended: null, recommended: null }
  // 이 샷보다 앞선, 같은 그라인더의 다른 샷만 보정에 씀 (자기 자신이나 나중 기록을 배우지 않게)
  const others = shots.filter((s) => s.id !== editingShot?.id && s.datetime < data.datetime && (!s.grinder || !grinder || s.grinder === grinder))
  const logAdj = logAdjustment(others, data.beanId, learnOptsOf(grind))
  const opts = { roastDate, onDate: data.datetime.slice(0, 10) }
  return { baseRecommended: calcGrind(weather, grind, opts).value, recommended: calcGrind(weather, grind, { ...opts, logAdj }).value }
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

// 추출 기준 (예전 저장 데이터에 없으면 기본값)
export const extractOf = (grind) => ({
  dose: Number(grind.targetDose ?? 19),
  yield: Number(grind.targetYield ?? 32),
  unit: grind.yieldUnit === 'ml' ? 'ml' : 'g',
})

// 추출 비율: 도징 1 대비 추출량. 19g → 32 = 1:1.7
// 비율이 짧을수록(1:1 쪽) 진하고 농축된 맛, 길수록(1:3 쪽) 순한 맛 [Clive Coffee, Dialing In Espresso By Taste]
export const ratioText = (dose, out) => (Number(dose) > 0 && Number(out) > 0 ? `1:${(Number(out) / Number(dose)).toFixed(1)}` : '-')
