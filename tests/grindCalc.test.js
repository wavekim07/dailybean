// 분쇄도 추천 계산 테스트 (기준값은 파도김 매장 기본 설정)
import { describe, it, expect } from 'vitest'
import { calcGrind, logAdjustment, judgeTime } from '../src/utils/grindCalc.js'
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

describe('샷 기록 보정', () => {
  it('최근 샷이 추천보다 평균 0.2 가늘게 쓰였으면 +0.2 보정', () => {
    const shots = [
      { beanId: 'b', datetime: '2026-11-08T10:00', grind: 6.7, recommended: 6.5 },
      { beanId: 'b', datetime: '2026-11-08T11:00', grind: 6.6, recommended: 6.4 },
    ]
    const adj = logAdjustment(shots, 'b')
    expect(adj.count).toBe(2)
    expect(adj.value).toBeCloseTo(0.2)
  })

  it('보정은 ±0.3을 넘지 않음 (기록 몇 개로 추천이 크게 흔들리지 않게)', () => {
    const shots = [{ beanId: 'b', datetime: '2026-11-08T10:00', grind: 7.5, recommended: 6.5 }]
    expect(logAdjustment(shots, 'b').value).toBe(0.3)
  })
})

describe('추출 시간 판정 (목표 26~30초)', () => {
  it('24초는 빠름 → 가늘게, 32초는 느림 → 굵게, 28초는 유지', () => {
    expect(judgeTime(24, [26, 30]).tip).toBe('+0.1 가늘게')
    expect(judgeTime(32, [26, 30]).tip).toBe('−0.1 굵게')
    expect(judgeTime(28, [26, 30]).status).toBe('ok')
  })
})
