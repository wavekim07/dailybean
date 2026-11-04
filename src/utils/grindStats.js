// 우리 매장 샷 기록 평균: 그라인더 × 원두별, 습도 구간별
const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null)

export const HUMIDITY_BANDS = [
  { id: 'dry', label: '건조 (50% 이하)', test: (h) => h <= 50 },
  { id: 'mid', label: '보통 (51~70%)', test: (h) => h > 50 && h <= 70 },
  { id: 'wet', label: '습함 (71% 이상)', test: (h) => h > 70 },
]

export function grinderBeanAverages(shots, beanName) {
  const groups = new Map()
  for (const s of shots) {
    const key = `${s.grinder || '그라인더 미지정'}|${s.beanId}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s)
  }
  return [...groups.entries()].map(([key, list]) => {
    const [grinder, beanId] = key.split('|')
    const withRec = list.filter((s) => s.recommended != null)
    return {
      key, grinder, bean: beanName(beanId), count: list.length,
      grind: avg(list.map((s) => Number(s.grind))),
      time: avg(list.map((s) => Number(s.time))),
      dose: avg(list.map((s) => Number(s.dose)).filter((n) => !Number.isNaN(n))),
      // 추천값과 실제 맞춘 값의 평균 차이 (작을수록 추천이 정확)
      diff: avg(withRec.map((s) => Math.abs(s.grind - s.recommended))),
    }
  }).sort((a, b) => b.count - a.count)
}

export function humidityAverages(shots) {
  return HUMIDITY_BANDS.map((b) => {
    const list = shots.filter((s) => s.weather && b.test(s.weather.humidity))
    return { ...b, count: list.length, grind: avg(list.map((s) => Number(s.grind))) }
  })
}
