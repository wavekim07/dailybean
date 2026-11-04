import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import NavBar from './NavBar.jsx'

export default function Layout() {
  const { state } = useApp()
  const { pathname } = useLocation()
  // 매장 시작 설정을 아직 안 했으면 먼저 설정 화면으로
  if (!state.settings.store.setupDone && pathname !== '/setup') return <Navigate to="/setup" replace />
  return (
    <div className="layout">
      <NavBar />
      <main className="content">
        <Outlet />
        {/* Open-Meteo 무료 이용 조건(CC BY 4.0): 날씨 데이터가 보이는 곳에 출처 링크 */}
        <footer className="credit">
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo.com</a>
        </footer>
      </main>
    </div>
  )
}
