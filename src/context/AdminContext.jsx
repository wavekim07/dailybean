/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useApp } from './AppContext.jsx'
import { defaultPerms } from '../constants/permissions.js'
import { verifySecret } from '../utils/auth.js'

// 관리자 모드: 비밀번호로 들어가고, 10분 동안 손대지 않으면 자동으로 나가요.
// 로그인 상태는 이 탭(sessionStorage)에만 남아서, 브라우저를 닫으면 다시 로그인해야 해요.
const IDLE_MS = 10 * 60 * 1000
const KEY = 'dailybean-admin-until'
const AdminContext = createContext(null)

const readUntil = () => {
  try { return Number(sessionStorage.getItem(KEY)) || 0 } catch { return 0 }
}
const writeUntil = (v) => {
  try { if (v) sessionStorage.setItem(KEY, String(v)); else sessionStorage.removeItem(KEY) } catch { /* 저장이 막힌 브라우저면 이 화면에서만 유지 */ }
}

export function AdminProvider({ children }) {
  const { state } = useApp()
  const [until, setUntil] = useState(readUntil)
  const [now, setNow] = useState(() => Date.now())
  const hasAdmin = !!state.auth?.admin
  const isAdmin = hasAdmin && until > now

  // 15초마다 시간 확인 (시간이 지나면 자동으로 관리자 모드 끝)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(t)
  }, [])

  // 관리자 모드에서 화면을 누르거나 입력하면 10분 연장
  useEffect(() => {
    if (!isAdmin) return
    const touch = () => { const v = Date.now() + IDLE_MS; setUntil(v); writeUntil(v); setNow(Date.now()) }
    window.addEventListener('pointerdown', touch)
    window.addEventListener('keydown', touch)
    return () => { window.removeEventListener('pointerdown', touch); window.removeEventListener('keydown', touch) }
  }, [isAdmin])

  const enter = useCallback(() => { const v = Date.now() + IDLE_MS; setUntil(v); writeUntil(v); setNow(Date.now()) }, [])
  const login = useCallback(async (password) => {
    const ok = await verifySecret(password, state.auth?.admin)
    if (ok) enter()
    return ok
  }, [state.auth, enter])
  const logout = useCallback(() => { setUntil(0); writeUntil(0) }, [])

  return <AdminContext.Provider value={{ hasAdmin, isAdmin, login, logout, enter, minutesLeft: Math.max(0, Math.ceil((until - now) / 60000)) }}>{children}</AdminContext.Provider>
}

export const useAdmin = () => useContext(AdminContext)

// 지금 근무자가 이 일을 할 수 있는지
// - 관리자 모드: 전부 가능
// - 근무자를 아직 한 명도 등록하지 않음: 기본 권한
// - 근무자가 있는데 아무도 고르지 않음: 불가 (누가 했는지 남기려고, 그리고 권한을 피해 가지 못하게)
export function usePermission() {
  const { state } = useApp()
  const { isAdmin } = useAdmin()
  const { staff, settings } = state
  const current = staff.find((s) => s.id === settings.currentStaffId) || null
  const can = (key) => {
    if (isAdmin) return true
    if (staff.length === 0) return defaultPerms()[key] ?? false
    if (!current) return false
    return { ...defaultPerms(), ...current.perms }[key] ?? false
  }
  return { can, isAdmin, current, needsStaff: staff.length > 0 && !current }
}
