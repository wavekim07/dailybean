// 분쇄도 추천 계산 테스트 (기준값은 파도김 매장 기본 설정)
import { describe, it, expect } from 'vitest'
import { baseOf, calcGrind, judgeTime, learnOptsOf, logAdjustment, shotRecommendations } from '../src/utils/grindCalc.js'
import { initialState } from '../src/context/initialState.js'

const g = initialState.settings.grind // 기준 6.5, 습도 60%, 기온 20℃, 범위 6.0~7.0

describe('분쇄도 추천', () => {
  it('기준 날씨(습도 60%, 20℃)면 기준값 6.5 그대로', () => {
    expect(calcGrind({ humidity: 60, temp: 20 }, g, { onDate: '2026-11-09' }).value).toBe(6.5)
  })

  it('습도가 높으면(80%) 굵게 → 숫자가 내려감', () => {
    // 6.5 − 0.2 × (80 − 60) / 10 = 6.1
    expect(calcGrind({ humidity: 80, temp: 20 }, g, { onDate: '2026-11-09' }).value).toBe(6.1)
  })

  it('다이얼이 반대 방향(숫자 높을수록 굵게)인 그라인더면 부호가 바뀜', () => {
    const reversed = { ...g, higherIsFiner: false }
    expect(calcGrind({ humidity: 80, temp: 20 }, reversed, { onDate: '2026-11-09' }).value).toBe(6.9)
  })

  it('로스팅 3일 이내 원두는 숙성 보정(−0.1)이 붙고, 4일째부터는 안 붙음', () => {
    const w = { humidity: 60, temp: 20 }
    expect(calcGrind(w, g, { roastDate: '2026-11-07', onDate: '2026-11-09' }).value).toBe(6.4)
    expect(calcGrind(w, g, { roastDate: '2026-11-05', onDate: '2026-11-09' }).value).toBe(6.5)
  })

  it('아무리 극단적인 날씨여도 설정한 범위(6.0~7.0)를 벗어나지 않음', () => {
    expect(calcGrind({ humidity: 100, temp: 40 }, g).value).toBe(6.0)
    expect(calcGrind({ humidity: 0, temp: -10 }, g).value).toBe(7.0)
  })
})

describe('샷 기록 보정 (잘 나온 샷만 학습)', () => {
  const opts = learnOptsOf(g) // 26~30초, 도징 19g ±0.2g, 3개 이상
  const shot = (h, extra) => ({ beanId: 'b', datetime: `2026-11-08T1${h}:00`, time: 28, dose: 19, grind: 6.7, baseRecommended: 6.5, ...extra })

  it('조건을 통과한 샷 3개가 평균 0.2 가늘게 쓰였으면 +0.2 보정', () => {
    const adj = logAdjustment([shot(0), shot(1, { grind: 6.6, baseRecommended: 6.4 }), shot(2)], 'b', opts)
    expect(adj.count).toBe(3)
    expect(adj.value).toBeCloseTo(0.2)
  })

  it('조건을 통과한 샷이 3개 미만이면 보정하지 않고, 몇 개 더 필요한지 알려 줌', () => {
    const adj = logAdjustment([shot(0), shot(1)], 'b', opts)
    expect(adj).toMatchObject({ value: 0, valid: 2, needed: 1 })
  })

  it('느린 샷(32초)·빠른 샷(23초)·시간 빈칸은 학습하지 않음', () => {
    const shots = [shot(0), shot(1), shot(2, { time: 32, grind: 7.0 }), shot(3, { time: 23, grind: 6.0 }), shot(4, { time: '' })]
    expect(logAdjustment(shots, 'b', opts)).toMatchObject({ value: 0, valid: 2, needed: 1 })
  })

  it('도징이 목표 19g에서 0.2g 넘게 벗어나면 학습하지 않음 (19.2g는 통과, 19.5g·빈칸은 제외)', () => {
    const shots = [shot(0), shot(1), shot(2, { dose: 19.2 }), shot(3, { dose: 19.5, grind: 7.0 }), shot(4, { dose: '', grind: 7.0 })]
    const adj = logAdjustment(shots, 'b', opts)
    expect(adj.count).toBe(3)
    expect(adj.value).toBeCloseTo(0.2)
  })

  it('다른 원두 기록은 쓰지 않고, 원두를 안 고르면 보정하지 않음', () => {
    const shots = [shot(0), shot(1), shot(2, { beanId: 'other' })]
    expect(logAdjustment(shots, 'b', opts).valid).toBe(2)
    expect(logAdjustment([shot(0), shot(1), shot(2)], null, opts).value).toBe(0)
  })

  it('기준은 baseRecommended(날씨·숙성만)이고, 화면에 보여 준 recommended가 아님', () => {
    const shots = [0, 1, 2].map((h) => shot(h, { baseRecommended: 6.5, recommended: 6.8 }))
    expect(logAdjustment(shots, 'b', opts).value).toBeCloseTo(0.2)
  })

  it('예전 기록(baseRecommended 없음)은 recommended를 기준값으로 씀', () => {
    const shots = [0, 1, 2].map((h) => shot(h, { baseRecommended: undefined, recommended: 6.5 }))
    expect(baseOf(shots[0])).toBe(6.5)
    expect(logAdjustment(shots, 'b', opts).value).toBeCloseTo(0.2)
  })

  it('보정은 ±0.3을 넘지 않음 (기록 몇 개로 추천이 크게 흔들리지 않게)', () => {
    const shots = [0, 1, 2].map((h) => shot(h, { grind: 7.5 }))
    expect(logAdjustment(shots, 'b', opts).value).toBe(0.3)
  })
})

describe('샷 저장 시 추천값 두 가지', () => {
  const w = { humidity: 60, temp: 20 } // 기준 날씨 → 날씨 기준값 6.5
  const good = (h) => ({ id: `s${h}`, beanId: 'b', datetime: `2026-11-08T1${h}:00`, time: 28, dose: 19, grind: 6.7, baseRecommended: 6.5, recommended: 6.5 })
  const past = [good(0), good(1), good(2)] // 평균 +0.2 가늘게
  const data = { beanId: 'b', datetime: '2026-11-09T10:00' }

  it('새 샷: 날씨 기준값 6.5와, 기록 보정(+0.2)을 더해 화면에 보여 준 6.7을 따로 저장', () => {
    expect(shotRecommendations({ data, weather: w, shots: past, grind: g })).toEqual({ baseRecommended: 6.5, recommended: 6.7 })
  })

  it('잘 나온 샷이 3개 미만이면 두 값이 같음 (보정 없음)', () => {
    expect(shotRecommendations({ data, weather: w, shots: past.slice(0, 2), grind: g })).toEqual({ baseRecommended: 6.5, recommended: 6.5 })
  })

  it('이 샷보다 나중에 기록된 샷은 보정에 쓰지 않음', () => {
    const later = past.map((s) => ({ ...s, datetime: s.datetime.replace('11-08', '11-10') }))
    expect(shotRecommendations({ data, weather: w, shots: later, grind: g }).recommended).toBe(6.5)
  })

  it('과거 샷을 고쳐도(날짜·시각 그대로) 당시 값 유지, 그 사이 기록이 늘거나 설정이 바뀌어도 그대로', () => {
    const editingShot = { id: 'x', beanId: 'b', datetime: data.datetime, baseRecommended: 6.5, recommended: 6.6 }
    const changed = { ...g, base: 6.8 }
    expect(shotRecommendations({ data: { ...data, grind: 6.9 }, editingShot, weather: w, shots: [...past, editingShot], grind: changed }))
      .toEqual({ baseRecommended: 6.5, recommended: 6.6 })
  })

  it('예전 형식 샷(recommended만 있음)을 고치면 그 값을 기준값으로도 남김', () => {
    const editingShot = { id: 'x', beanId: 'b', datetime: data.datetime, recommended: 6.4 }
    expect(shotRecommendations({ data, editingShot, weather: w, shots: past, grind: g })).toEqual({ baseRecommended: 6.4, recommended: 6.4 })
  })

  it('날씨를 못 불러오면 두 값 모두 비워 둠 (보정 학습에서도 빠짐)', () => {
    expect(shotRecommendations({ data, weather: null, shots: past, grind: g })).toEqual({ baseRecommended: null, recommended: null })
  })
})

describe('추출 시간 판정 (목표 26~30초)', () => {
  it('24초는 빠름 → 가늘게, 32초는 느림 → 굵게, 28초는 유지', () => {
    expect(judgeTime(24, [26, 30]).tip).toBe('+0.1 가늘게')
    expect(judgeTime(32, [26, 30]).tip).toBe('−0.1 굵게')
    expect(judgeTime(28, [26, 30]).status).toBe('ok')
  })
})
