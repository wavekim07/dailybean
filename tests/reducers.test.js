// 데이터 변경(reducer) 테스트: 잘못된 입력이 저장되지 않는지, 기록이 엉뚱하게 지워지지 않는지
import { describe, it, expect } from 'vitest'
import { rootReducer } from '../src/context/reducers.js'
import { initialState } from '../src/context/initialState.js'
import { validateBackup } from '../src/utils/backup.js'

const base = () => structuredClone(initialState)

describe('마감 재고 저장', () => {
  it('같은 날 일부 품목만 다시 저장하면 나머지 품목 기록은 그대로 남음', () => {
    let s = base()
    s = rootReducer(s, { type: 'SAVE_DAILY_COUNT', payload: { date: '2026-11-09', quantities: { milk: 5, bean: 2 } } })
    s = rootReducer(s, { type: 'SAVE_DAILY_COUNT', payload: { date: '2026-11-09', quantities: { milk: 3 } } })
    expect(s.counts).toHaveLength(2)
    expect(s.counts.find((c) => c.itemId === 'milk').qty).toBe(3)
    expect(s.counts.find((c) => c.itemId === 'bean').qty).toBe(2)
  })
})

describe('발주', () => {
  it('입고 전인 같은 품목은 두 번 담기지 않음', () => {
    let s = base()
    s = rootReducer(s, { type: 'ADD_ORDER', payload: { itemId: 'milk', qty: 20 } })
    s = rootReducer(s, { type: 'ADD_ORDER', payload: { itemId: 'milk', qty: 20 } })
    expect(s.orders).toHaveLength(1)
  })

  it('수량에 음수나 글자를 넣으면 무시하고, 빈칸은 다시 쓰는 중으로 둠', () => {
    let s = rootReducer(base(), { type: 'ADD_ORDER', payload: { itemId: 'milk', qty: 20 } })
    const id = s.orders[0].id
    expect(rootReducer(s, { type: 'UPDATE_ORDER_QTY', payload: { id, qty: '-5' } }).orders[0].qty).toBe(20)
    expect(rootReducer(s, { type: 'UPDATE_ORDER_QTY', payload: { id, qty: 'abc' } }).orders[0].qty).toBe(20)
    expect(rootReducer(s, { type: 'UPDATE_ORDER_QTY', payload: { id, qty: '' } }).orders[0].qty).toBe('')
    expect(rootReducer(s, { type: 'UPDATE_ORDER_QTY', payload: { id, qty: '12' } }).orders[0].qty).toBe(12)
  })

  it('입고 완료하면 입고 기록이 생기고, 그 입고를 지우면 발주가 주문함으로 돌아감', () => {
    let s = rootReducer(base(), { type: 'ADD_ORDER', payload: { itemId: 'milk', qty: 20 } })
    const id = s.orders[0].id
    s = rootReducer(s, { type: 'MARK_ORDERED', payload: [id] })
    s = rootReducer(s, { type: 'RECEIVE_ORDER', payload: { id, date: '2026-11-09', qty: 20 } })
    expect(s.stockIns).toHaveLength(1)
    expect(s.orders[0].status).toBe('received')
    s = rootReducer(s, { type: 'RECEIVE_ORDER', payload: { id, date: '2026-11-09', qty: 20 } })
    expect(s.stockIns).toHaveLength(1) // 입고 완료를 두 번 눌러도 한 번만
    s = rootReducer(s, { type: 'DELETE_STOCK_IN', payload: s.stockIns[0].id })
    expect(s.orders[0].status).toBe('ordered')
  })
})

describe('백업 불러오기 검사', () => {
  it('정상 백업은 통과', () => {
    expect(validateBackup(base()).ok).toBe(true)
  })
  it('항목이 빠지거나 형식이 틀린 파일은 거부 (기존 데이터는 그대로)', () => {
    const { items, ...noItems } = base()
    expect(items).toEqual([])
    expect(validateBackup(noItems).ok).toBe(false)
    expect(validateBackup({ ...base(), sales: 'x' }).ok).toBe(false)
    expect(validateBackup({ ...base(), shots: [{ grind: 6.5 }] }).ok).toBe(false) // id 없는 기록
  })
})
