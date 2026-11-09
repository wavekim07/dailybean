// 재고 계산 테스트: 사용량 = 전날 재고 + 입고 − 오늘 재고
import { describe, it, expect } from 'vitest'
import { usageRows, currentStock, isLow, lowStockItems } from '../src/utils/stockCalc.js'

const milk = { id: 'milk', name: '우유', unit: '개', orderQty: 20 }

describe('재고 사용량', () => {
  it('어제 마감 10 → 오늘 입고 5 → 오늘 마감 12 이면 사용량 3', () => {
    const counts = [
      { itemId: 'milk', date: '2026-11-01', qty: 10 },
      { itemId: 'milk', date: '2026-11-02', qty: 12 },
    ]
    const stockIns = [{ itemId: 'milk', date: '2026-11-02', qty: 5 }]
    const [row] = usageRows([milk], stockIns, counts, '2026-11-02', 0.7)
    expect(row.prevQty).toBe(10)
    expect(row.ins).toBe(5)
    expect(row.usage).toBe(3)
  })

  it('마감 재고를 하루 빠뜨려도 그 사이 입고를 모두 더함', () => {
    const counts = [
      { itemId: 'milk', date: '2026-11-01', qty: 10 },
      { itemId: 'milk', date: '2026-11-03', qty: 4 },
    ]
    const stockIns = [
      { itemId: 'milk', date: '2026-11-02', qty: 5 },
      { itemId: 'milk', date: '2026-11-03', qty: 5 },
    ]
    const [row] = usageRows([milk], stockIns, counts, '2026-11-03', 0.7)
    expect(row.usage).toBe(16) // 10 + 10 − 4
  })

  it('전날 기록이 없으면 사용량은 계산하지 않음 (0이 아니라 null)', () => {
    const [row] = usageRows([milk], [], [{ itemId: 'milk', date: '2026-11-02', qty: 7 }], '2026-11-02', 0.7)
    expect(row.usage).toBeNull()
  })
})

describe('현재 재고', () => {
  it('마감 재고를 센 뒤에 들어온 입고는 현재 재고에 더함 (같은 날, 기록 시각으로 비교)', () => {
    const counts = [{ itemId: 'milk', date: '2026-11-02', qty: 3, at: '2026-11-02 15:00:00' }]
    const stockIns = [{ itemId: 'milk', date: '2026-11-02', qty: 20, at: '2026-11-02 18:00:00' }]
    expect(currentStock(milk, stockIns, counts)).toBe(23)
  })

  it('마감 재고를 세기 전에 들어온 입고는 이미 센 수량에 들어 있으니 다시 더하지 않음', () => {
    const counts = [{ itemId: 'milk', date: '2026-11-02', qty: 3, at: '2026-11-02 21:00:00' }]
    const stockIns = [{ itemId: 'milk', date: '2026-11-02', qty: 20, at: '2026-11-02 10:00:00' }]
    expect(currentStock(milk, stockIns, counts)).toBe(3)
  })
})

describe('재고 부족 경고 (기본 발주량에서 70% 이상 줄면)', () => {
  it('발주량 20의 30%인 6 이하면 부족, 7이면 아님', () => {
    expect(isLow(milk, 6, 0.7)).toBe(true)
    expect(isLow(milk, 7, 0.7)).toBe(false)
  })

  it('입고·마감 기록이 하나도 없는 품목은 부족으로 띄우지 않음 (입력 전)', () => {
    expect(lowStockItems([milk], [], [], 0.7)).toEqual([])
  })
})
