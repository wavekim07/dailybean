import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import GrindPage from './pages/Grind/GrindPage.jsx'
import StockPage from './pages/Stock/StockPage.jsx'
import ItemsPage from './pages/Items/ItemsPage.jsx'
import SalesPage from './pages/Sales/SalesPage.jsx'
import CustomersPage from './pages/Customers/CustomersPage.jsx'
import SettingsPage from './pages/Settings/SettingsPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="grind" element={<GrindPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
