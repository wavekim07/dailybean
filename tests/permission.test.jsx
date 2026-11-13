// @vitest-environment jsdom
// 권한 화면 테스트 (11-13 실사용자 피드백: "샷 기록 권한을 껐는데 기록이 됐다")
// 원인은 버그가 아니라 관리자 모드(모든 권한 열림)와 선택된 근무자 차이였음 → 그 동작과 새 안내 띠를 확인
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from '../src/context/AppContext.jsx'
import { AdminProvider } from '../src/context/AdminContext.jsx'
import Layout from '../src/components/layout/Layout.jsx'
import GrindPage from '../src/pages/Grind/GrindPage.jsx'
import { initialState } from '../src/context/initialState.js'

// 날씨 서버는 테스트에서 부르지 않음
vi.mock('../src/hooks/useWeather.js', () => ({ default: () => ({ weather: null, loading: false, error: null, reload() {} }) }))

afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear() })

function seed(currentStaffId, { admin = false } = {}) {
  const s = structuredClone(initialState)
  s.settings.store = { name: '테스트 매장', machine: '', grinder: '', setupDone: true }
  s.staff = [{ id: 'h', name: '홍태경', perms: {} }, { id: 'r', name: '롱태경', perms: { shots: false } }]
  s.settings.currentStaffId = currentStaffId
  if (admin) {
    s.auth = { ...(s.auth || {}), admin: { hash: 'x', salt: 'x' } }
    sessionStorage.setItem('dailybean-admin-until', String(Date.now() + 60000))
  }
  localStorage.setItem('dailybean', JSON.stringify(s))
}
const renderGrind = () => render(
  <MemoryRouter initialEntries={['/grind']}>
    <AppProvider><AdminProvider>
      <Routes><Route element={<Layout />}><Route path="/grind" element={<GrindPage />} /></Route></Routes>
    </AdminProvider></AppProvider>
  </MemoryRouter>,
)

describe('샷 기록 권한', () => {
  it('샷 기록 권한이 없는 근무자(롱태경)를 고르면 기록 칸이 잠김', () => {
    seed('r'); renderGrind()
    expect(screen.getByText(/'샷 기록' 권한이 없어요/)).toBeTruthy()
  })

  it('권한이 있는 근무자(홍태경)는 기록할 수 있음', () => {
    seed('h'); renderGrind()
    expect(screen.queryByText(/권한이 없어요/)).toBeNull()
  })

  it('관리자 모드가 켜져 있으면 모든 권한이 열리고, 화면 위에 그 사실과 끝내기 버튼을 보여 줌', () => {
    seed('r', { admin: true }); renderGrind()
    expect(screen.queryByText(/권한이 없어요/)).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('관리자 모드라 모든 권한이 열려 있어요')
    fireEvent.click(screen.getByRole('button', { name: '관리자 모드 끝내기' }))
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByText(/'샷 기록' 권한이 없어요/)).toBeTruthy()
  })
})
