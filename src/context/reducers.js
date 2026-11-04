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

const nowStr = () => `${toDateStr()}T${new Date().toTimeString().slice(0, 5)}`
// 입고·실사 기록 시각 (초까지): 같은 날 실사와 입고의 앞뒤를 가리는 데 씀 (utils/stockCalc.js)
const stampStr = () => `${toDateStr()}T${new Date().toTimeString().slice(0, 8)}`

// 기록에 "누가"를 붙임: 지금 근무자 (설정에서 고름)
const withStaff = (state, data) => ({ staffId: state.settings.currentStaffId ?? null, ...data })

export function rootReducer(state, action) {
  const { type, payload } = action
  switch (type) {
    // 품목
    case 'ADD_ITEM':
      return { ...state, items: add(state.items, payload) }
    case 'UPDATE_ITEM':
      return { ...state, items: update(state.items, payload) }
    case 'DELETE_ITEM':
      // 품목을 지우면 아직 입고 안 된 그 품목의 발주도 같이 지움
      return { ...state, items: remove(state.items, payload), orders: state.orders.filter((o) => !(o.itemId === payload && o.status !== 'received')) }

    // 재고
    case 'ADD_STOCK_IN':
      return { ...state, stockIns: add(state.stockIns, withStaff(state, { at: stampStr(), ...payload })) }
    case 'DELETE_STOCK_IN': {
      // 발주에서 만들어진 입고를 지우면 그 발주는 다시 '주문함'으로 돌아감 (입고가 잘못 눌렸을 때 되돌리기)
      const orders = state.orders.map((o) => (o.stockInId === payload ? { ...o, status: 'ordered', receivedAt: null, receivedQty: null, stockInId: null } : o))
      return { ...state, stockIns: remove(state.stockIns, payload), orders }
    }
    case 'SAVE_DAILY_COUNT': {
      // payload: { date, quantities: { [itemId]: qty } }
      // 같은 날짜에서 이번에 입력한 품목의 기록만 바꾸고, 입력하지 않은 품목의 기록은 그대로 둠
      const { date, quantities } = payload
      const others = state.counts.filter((c) => !(c.date === date && c.itemId in quantities))
      const rows = Object.entries(quantities).map(([itemId, qty]) => ({ id: newId(), date, itemId, qty: Number(qty), at: stampStr(), staffId: state.settings.currentStaffId ?? null }))
      return { ...state, counts: [...others, ...rows] }
    }

    // 발주 목록: 담기 → 주문함 → 입고 완료(입고 기록이 자동으로 생김)
    case 'ADD_ORDER': {
      // 같은 품목이 아직 입고 안 된 채 목록에 있으면 새로 담지 않음 (두 번 주문 방지)
      if (state.orders.some((o) => o.itemId === payload.itemId && o.status !== 'received')) return state
      return { ...state, orders: add(state.orders, withStaff(state, { status: 'draft', createdAt: nowStr(), ...payload })) }
    }
    case 'UPDATE_ORDER_QTY':
      return { ...state, orders: update(state.orders, { id: payload.id, qty: Number(payload.qty) }) }
    case 'MARK_ORDERED': {
      // payload: 주문 보낸 발주 id 목록 (거래처 하나 단위로 보냄)
      const ids = new Set(payload)
      return { ...state, orders: state.orders.map((o) => (ids.has(o.id) && o.status === 'draft' ? { ...o, status: 'ordered', orderedAt: nowStr(), orderedBy: state.settings.currentStaffId ?? null } : o)) }
    }
    case 'UNMARK_ORDERED':
      return { ...state, orders: state.orders.map((o) => (o.id === payload && o.status === 'ordered' ? { ...o, status: 'draft', orderedAt: null, orderedBy: null } : o)) }
    case 'RECEIVE_ORDER': {
      // payload: { id, date, qty, roastDate } → 입고 기록을 만들고 발주를 '입고 완료'로
      const order = state.orders.find((o) => o.id === payload.id)
      if (!order || order.status === 'received') return state
      const stockInId = newId()
      const stockIn = withStaff(state, { id: stockInId, date: payload.date, itemId: order.itemId, qty: Number(payload.qty), roastDate: payload.roastDate || null, orderId: order.id, at: stampStr() })
      return {
        ...state,
        stockIns: [...state.stockIns, stockIn],
        orders: update(state.orders, { id: order.id, status: 'received', receivedAt: nowStr(), receivedQty: Number(payload.qty), stockInId, receivedBy: state.settings.currentStaffId ?? null }),
      }
    }
    case 'DELETE_ORDER':
      return { ...state, orders: remove(state.orders, payload) }

    // 근무자
    case 'ADD_STAFF':
      return { ...state, staff: add(state.staff, { name: payload }) }
    case 'DELETE_STAFF':
      return {
        ...state, staff: remove(state.staff, payload),
        settings: state.settings.currentStaffId === payload ? { ...state.settings, currentStaffId: null } : state.settings,
      }
    case 'SET_CURRENT_STAFF':
      return { ...state, settings: { ...state.settings, currentStaffId: payload } }

    // 인수인계 노트
    case 'ADD_NOTE':
      return { ...state, notes: add(state.notes, withStaff(state, { datetime: nowStr(), done: false, ...payload })) }
    case 'TOGGLE_NOTE':
      return {
        ...state,
        notes: state.notes.map((n) => (n.id !== payload ? n : n.done
          ? { ...n, done: false, doneBy: null, doneAt: null }
          : { ...n, done: true, doneBy: state.settings.currentStaffId ?? null, doneAt: nowStr() })),
      }
    case 'DELETE_NOTE':
      return { ...state, notes: remove(state.notes, payload) }

    // 오픈·마감 체크리스트 (항목은 settings.checklists, 체크 기록은 checkLogs)
    case 'ADD_CHECK_ITEM': {
      const { kind, text } = payload
      const lists = state.settings.checklists
      return { ...state, settings: { ...state.settings, checklists: { ...lists, [kind]: [...lists[kind], { id: newId(), text }] } } }
    }
    case 'DELETE_CHECK_ITEM': {
      const { kind, id } = payload
      const lists = state.settings.checklists
      return { ...state, settings: { ...state.settings, checklists: { ...lists, [kind]: lists[kind].filter((x) => x.id !== id) } } }
    }
    case 'TOGGLE_CHECK': {
      const { date, kind, itemId } = payload
      const hit = state.checkLogs.find((c) => c.date === date && c.kind === kind && c.itemId === itemId)
      return {
        ...state,
        checkLogs: hit
          ? state.checkLogs.filter((c) => c !== hit)
          : [...state.checkLogs, { id: newId(), date, kind, itemId, staffId: state.settings.currentStaffId ?? null, at: nowStr() }],
      }
    }

    // 샷 기록
    case 'ADD_SHOT':
      return { ...state, shots: add(state.shots, withStaff(state, payload)) }
    case 'UPDATE_SHOT':
      return { ...state, shots: update(state.shots, payload) }
    case 'DELETE_SHOT':
      return { ...state, shots: remove(state.shots, payload) }

    // 매출
    case 'ADD_SALE':
      return { ...state, sales: add(state.sales, withStaff(state, payload)) }
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
    case 'IMPORT_ALL': {
      // 설정은 한 단계 안쪽까지 기본값과 합쳐서, 예전 백업이어도 빠진 설정이 기본값으로 채워지게
      const s = payload.settings || {}
      return {
        ...initialState, ...payload,
        settings: {
          ...initialState.settings, ...s,
          store: { ...initialState.settings.store, ...s.store },
          checklists: { ...initialState.settings.checklists, ...s.checklists },
          grind: { ...initialState.settings.grind, ...s.grind },
        },
      }
    }
    case 'RESET_ALL':
      return initialState

    default:
      return state
  }
}
