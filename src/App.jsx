import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import GrindPage from './pages/Grind/GrindPage.jsx'
import StockPage from './pages/Stock/StockPage.jsx'
import CustomersPage from './pages/Customers/CustomersPage.jsx'
import SettingsPage from './pages/Settings/SettingsPage.jsx'

// 차트 라이브러리(Recharts)가 커서 매출 페이지는 필요할 때 불러오기
const SalesPage = lazy(() => import('./pages/Sales/SalesPage.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="grind" element={<GrindPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="items" element={<Navigate to="/stock" replace />} />
        <Route path="sales" element={<Suspense fallback={<p className="muted">불러오는 중…</p>}><SalesPage /></Suspense>} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
