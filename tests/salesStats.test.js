// 매출 집계 테스트
import { describe, it, expect } from 'vitest'
import { groupSales, summarize, hourlyAverage } from '../src/utils/salesStats.js'

const sales = [
  { date: '2026-11-02', card: 300000, cash: 20000, hourly: { 9: 50000, 10: 70000 } },
  { date: '2026-11-03', card: 280000, cash: 0, hourly: null },
  { date: '2026-11-04', card: 310000, cash: 10000, hourly: { 9: 30000, 10: 90000 } },
]

describe('매출 집계', () => {
  it('최근 7일 합계와 하루 평균이 맞음 (매출 없는 날은 평균에서 뺌)', () => {
    const s = summarize(groupSales(sales, 'week7', '2026-11-08'))
    expect(s.total).toBe(920000)
    expect(s.days).toBe(3)
    expect(s.avg).toBeCloseTo(920000 / 3)
  })

  it('시간대별 평균은 시간대를 적은 날만 나눔 (적지 않은 날을 0으로 넣지 않음)', () => {
    const { days, rows } = hourlyAverage(sales, '2026-11', [9, 10])
    expect(days).toBe(2)
    expect(rows[0].avg).toBe(40000) // (50000 + 30000) / 2
    expect(rows[1].avg).toBe(80000)
  })
})
