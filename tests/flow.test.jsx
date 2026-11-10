// @vitest-environment jsdom
// 화면 흐름 테스트: 실제 화면(운영 › 재고·발주)을 그려 놓고 버튼을 눌러 가며
// "재고 입력 → 부족 경고 → 발주 담기 → 주문 → 입고 완료 → 현재 재고 반영 → 저장"이 이어서 맞게 되는지 확인
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../src/context/AppContext.jsx'
import { AdminProvider } from '../src/context/AdminContext.jsx'
import OpsPage from '../src/pages/Ops/OpsPage.jsx'
import { initialState } from '../src/context/initialState.js'

const KEY = 'dailybean'
const milk = { id: 'milk', name: '우유', category: '우유', unit: '팩', orderQty: 20, supplier: '서울우유' }
const bean = { id: 'bean', name: '블렌드 원두', category: '원두', unit: 'kg', orderQty: 5, supplier: '로스터리' }

// 매장 설정을 마친 상태로 시작 (품목 2개, 근무자 없음 = 기본 권한)
function seed(extra = {}) {
  const s = structuredClone(initialState)
  s.settings.store = { name: '테스트 매장', machine: '', grinder: '', setupDone: true }
  s.items = [milk, bean]
  localStorage.setItem(KEY, JSON.stringify({ ...s, ...extra }))
}
const saved = () => JSON.parse(localStorage.getItem(KEY))

function renderOps(tab = 'stock') {
  return render(
    <MemoryRouter initialEntries={[`/ops?tab=${tab}`]}>
      <AppProvider>
        <AdminProvider>
          <OpsPage />
        </AdminProvider>
      </AppProvider>
    </MemoryRouter>,
  )
}
const rowOf = (name) => screen.getByText(name, { selector: 'strong' }).closest('li')
const tab = (label) => fireEvent.click(screen.getByRole('button', { name: label }))

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
afterEach(cleanup)

describe('재고 → 발주 → 입고 → 재고 (한 흐름)', () => {
  it('우유 5팩 입력 → 부족 경고 → 발주 담기 → 주문 보냄 → 20팩 입고 → 현재 25팩, 경고 사라짐, 저장됨', () => {
    seed()
    renderOps('stock')

    // 1. 재고 탭: 우유 줄에서 수량 입력 5팩 (기본 발주량 20의 25% → 부족)
    fireEvent.click(within(rowOf('우유')).getByRole('button', { name: '수량 입력' }))
    fireEvent.change(screen.getByLabelText('지금 있는 양'), { target: { value: '5' } })
    fireEvent.click(within(rowOf('우유')).getByRole('button', { name: '저장' }))
    expect(within(rowOf('우유')).getByText('⚠️ 재고 부족')).toBeTruthy()
    expect(within(rowOf('우유')).getByText('5팩')).toBeTruthy()

    // 2. 줄에서 바로 발주 담기 → '발주 목록에 있음' 표시
    fireEvent.click(within(rowOf('우유')).getByRole('button', { name: '발주 담기' }))
    expect(within(rowOf('우유')).getByText('발주 목록에 있음')).toBeTruthy()

    // 3. 발주 탭: 거래처(서울우유)별로 묶여 있고, 수량은 기본 발주량 20
    tab('발주')
    expect(screen.getByText('서울우유')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '주문 보냄' }))
    expect(screen.getByText('주문함')).toBeTruthy()

    // 4. 물건이 오면 입고 완료 → 받은 수량 20 저장
    fireEvent.click(screen.getByRole('button', { name: '입고 완료' }))
    fireEvent.click(screen.getByRole('button', { name: '입고 저장' }))
    expect(screen.getByText(/최근 입고 완료 1건/)).toBeTruthy()

    // 5. 다시 재고 탭: 5 + 20 = 25팩, 부족 경고 없음
    tab('재고')
    expect(within(rowOf('우유')).getByText('25팩')).toBeTruthy()
    expect(within(rowOf('우유')).queryByText('⚠️ 재고 부족')).toBeNull()

    // 6. 브라우저 저장소에도 그대로 남음 (새로고침해도 유지)
    const s = saved()
    expect(s.stockIns).toHaveLength(1)
    expect(s.stockIns[0]).toMatchObject({ itemId: 'milk', qty: 20 })
    expect(s.orders[0].status).toBe('received')
  })

  it('새로 열어도(새로고침) 저장된 재고와 발주가 그대로 보임', () => {
    seed({ counts: [{ id: 'c1', date: '2026-11-09', at: '2026-11-09T09:00:00', itemId: 'milk', qty: 3 }],
      orders: [{ id: 'o1', itemId: 'milk', qty: 20, status: 'ordered', orderedAt: '2026-11-09T09:10' }] })
    renderOps('stock')
    expect(within(rowOf('우유')).getByText('3팩')).toBeTruthy()
    expect(within(rowOf('우유')).getByText('발주 목록에 있음')).toBeTruthy()
  })
})

describe('예외 상황: 잘못된 입력은 저장되지 않음', () => {
  it('발주 수량을 0으로 바꾸면 주문 보냄이 막히고 안내가 뜸', () => {
    seed({ orders: [{ id: 'o1', itemId: 'milk', qty: 20, status: 'draft' }] })
    renderOps('order')
    fireEvent.change(screen.getByDisplayValue('20'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: '주문 보냄' }))
    expect(screen.getByRole('alert').textContent).toContain('0보다 큰 수량')
    expect(saved().orders[0].status).toBe('draft')
  })

  it('입고 수량이 비었거나 음수면 입고 기록이 생기지 않음', () => {
    seed({ orders: [{ id: 'o1', itemId: 'milk', qty: 20, status: 'ordered' }] })
    renderOps('order')
    fireEvent.click(screen.getByRole('button', { name: '입고 완료' }))
    const qty = screen.getByLabelText(/받은 수량/)
    for (const bad of ['', '-3']) {
      fireEvent.change(qty, { target: { value: bad } })
      fireEvent.click(screen.getByRole('button', { name: '입고 저장' }))
      expect(screen.getByText('받은 수량을 0보다 큰 숫자로 넣어 주세요.')).toBeTruthy()
    }
    expect(saved().stockIns).toHaveLength(0)
    expect(saved().orders[0].status).toBe('ordered')
  })

  it('원두는 로스팅 날짜 없이 입고할 수 없음 (분쇄도 추천에 필요)', () => {
    seed()
    renderOps('stock')
    fireEvent.click(within(rowOf('블렌드 원두')).getByRole('button', { name: '입고' }))
    fireEvent.change(screen.getByLabelText('입고 수량'), { target: { value: '5' } })
    fireEvent.click(within(rowOf('블렌드 원두')).getByRole('button', { name: '입고 저장' }))
    expect(screen.getByText('원두는 로스팅 날짜가 필요해요. (분쇄도 추천에 쓰여요)')).toBeTruthy()
    expect(saved().stockIns).toHaveLength(0)
  })

  it('저장된 데이터가 깨져 있어도 화면이 멈추지 않고 빈 상태로 시작', () => {
    localStorage.setItem(KEY, '{깨진 데이터')
    renderOps('order')
    expect(screen.getByText(/먼저 재고 탭에서 품목을 등록해 주세요/)).toBeTruthy()
  })
})

describe('권한', () => {
  it('발주 권한이 없는 근무자는 발주 탭이 잠기고, 재고 줄에 발주 담기 버튼도 없음', () => {
    seed({
      counts: [{ id: 'c1', date: '2026-11-09', at: '2026-11-09T09:00:00', itemId: 'milk', qty: 2 }],
      staff: [{ id: 'kim', name: '김직원', perms: { stock: true, items: false, orders: false } }],
    })
    const s = saved(); s.settings.currentStaffId = 'kim'; localStorage.setItem(KEY, JSON.stringify(s))
    renderOps('stock')
    expect(within(rowOf('우유')).getByText('⚠️ 재고 부족')).toBeTruthy()
    expect(within(rowOf('우유')).queryByRole('button', { name: '발주 담기' })).toBeNull()
    tab('발주')
    expect(screen.getByText(/'.+' 권한이 없어요/)).toBeTruthy()
  })
})
