import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import GrindPage from './pages/Grind/GrindPage.jsx'
import OpsPage from './pages/Ops/OpsPage.jsx'
import CustomersPage from './pages/Customers/CustomersPage.jsx'
import SettingsPage from './pages/Settings/SettingsPage.jsx'
import SetupPage from './pages/Setup/SetupPage.jsx'
import AdminGate from './components/auth/AdminGate.jsx'
import Guard from './components/auth/Guard.jsx'
import { useApp } from './context/AppContext.jsx'

// 차트 라이브러리(Recharts)가 커서 매출 페이지는 필요할 때 불러오기
const SalesPage = lazy(() => import('./pages/Sales/SalesPage.jsx'))

export default function App() {
  const { state } = useApp()
  // 매장 시작 설정: 처음(관리자 없음)에는 누구나, 관리자가 생긴 뒤에는 관리자만
  const setup = state.auth?.admin ? <AdminGate title="매장 시작 설정은 관리자 전용"><SetupPage /></AdminGate> : <SetupPage />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="grind" element={<GrindPage />} />
        <Route path="ops" element={<OpsPage />} />
        <Route path="stock" element={<Navigate to="/ops?tab=stock" replace />} />
        <Route path="items" element={<Navigate to="/ops?tab=stock" replace />} />
        <Route path="sales" element={<Suspense fallback={<p className="muted">불러오는 중…</p>}><SalesPage /></Suspense>} />
        <Route path="customers" element={<Guard perm="customers"><CustomersPage /></Guard>} />
        <Route path="settings" element={<AdminGate title="설정은 관리자 전용"><SettingsPage /></AdminGate>} />
        <Route path="setup" element={setup} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
