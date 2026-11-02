import { initialState } from './initialState.js'
import { toDateStr } from '../utils/date.js'

export const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const today = () => toDateStr() // 로컬(한국) 날짜. toISOString은 UTC라 오전 9시 전에 하루 밀림

// 배열 CRUD 공통 처리
const add = (list, data) => [...list, { id: newId(), ...data }]
const update = (list, data) => list.map((x) => (x.id === data.id ? { ...x, ...data } : x))
const remove = (list, id) => list.filter((x) => x.id !== id)

export function rootReducer(state, action) {
  const { type, payload } = action
  switch (type) {
    // 품목
    case 'ADD_ITEM':
      return { ...state, items: add(state.items, payload) }
    case 'UPDATE_ITEM':
      return { ...state, items: update(state.items, payload) }
    case 'DELETE_ITEM':
      return { ...state, items: remove(state.items, payload) }

    // 재고
    case 'ADD_STOCK_IN':
      return { ...state, stockIns: add(state.stockIns, payload) }
    case 'DELETE_STOCK_IN':
      return { ...state, stockIns: remove(state.stockIns, payload) }
    case 'SAVE_DAILY_COUNT': {
      // payload: { date, quantities: { [itemId]: qty } } 같은 날짜 기록은 덮어쓰기
      const { date, quantities } = payload
      const others = state.counts.filter((c) => c.date !== date)
      const rows = Object.entries(quantities).map(([itemId, qty]) => ({ id: newId(), date, itemId, qty: Number(qty) }))
      return { ...state, counts: [...others, ...rows] }
    }

    // 샷 기록
    case 'ADD_SHOT':
      return { ...state, shots: add(state.shots, payload) }
    case 'UPDATE_SHOT':
      return { ...state, shots: update(state.shots, payload) }
    case 'DELETE_SHOT':
      return { ...state, shots: remove(state.shots, payload) }

    // 매출
    case 'ADD_SALE':
      return { ...state, sales: add(state.sales, payload) }
    case 'UPDATE_SALE':
      return { ...state, sales: update(state.sales, payload) }
    case 'DELETE_SALE':
      return { ...state, sales: remove(state.sales, payload) }

    // 고객
    case 'ADD_CUSTOMER':
      return { ...state, customers: add(state.customers, { accAmount: 0, coupons: 0, history: [], ...payload }) }
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: update(state.customers, payload) }
    case 'DELETE_CUSTOMER':
      return { ...state, customers: remove(state.customers, payload) }
    case 'ADD_PURCHASE': {
      // payload: { id, amount } 누적 금액이 기준을 넘을 때마다 쿠폰 1장, 남은 금액 이월
      const threshold = state.settings.rewardThreshold
      const customers = state.customers.map((c) => {
        if (c.id !== payload.id) return c
        const total = c.accAmount + Number(payload.amount)
        const earned = Math.floor(total / threshold)
        return {
          ...c,
          accAmount: total - earned * threshold,
          coupons: c.coupons + earned,
          history: [...c.history, { date: today(), type: 'purchase', amount: Number(payload.amount), earned }],
        }
      })
      return { ...state, customers }
    }
    case 'USE_COUPON': {
      const customers = state.customers.map((c) =>
        c.id === payload && c.coupons > 0
          ? { ...c, coupons: c.coupons - 1, history: [...c.history, { date: today(), type: 'coupon', amount: 1 }] }
          : c,
      )
      return { ...state, customers }
    }

    // 설정·데이터
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...payload, grind: { ...state.settings.grind, ...(payload.grind || {}) } },
      }
    case 'IMPORT_ALL':
      return { ...initialState, ...payload }
    case 'RESET_ALL':
      return initialState

    default:
      return state
  }
}
