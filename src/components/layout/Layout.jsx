import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import NavBar from './NavBar.jsx'

export default function Layout() {
  const { state, saveError } = useApp()
  const { pathname } = useLocation()
  const { isAdmin, logout } = useAdmin()
  // 매장 시작 설정을 아직 안 했으면 먼저 설정 화면으로
  if (!state.settings.store.setupDone && pathname !== '/setup') return <Navigate to="/setup" replace />
  return (
    <div className="layout">
      <NavBar />
      <main className="content">
        {saveError && <p className="error save-error" role="alert">⚠️ 방금 입력한 내용이 이 기기에 저장되지 않았어요. 저장 공간이 부족할 수 있어요. 설정 → 데이터에서 백업한 뒤, 직접 올린 배경 사진을 기본 사진으로 바꿔 주세요.</p>}
        {/* 관리자 모드에서는 모든 권한이 열려서, 근무자 권한을 시험할 때 헷갈림 (11-13 실사용자 피드백) → 설정 밖 화면에서도 알려 줌 */}
        {isAdmin && pathname !== '/settings' && (
          <p className="admin-banner" role="status">
            🔓 관리자 모드라 모든 권한이 열려 있어요. 근무자 권한대로 쓰려면 끝내 주세요.
            <button className="btn" onClick={logout}>관리자 모드 끝내기</button>
          </p>
        )}
        <Outlet />
        {/* Open-Meteo 무료 이용 조건(CC BY 4.0): 날씨 데이터가 보이는 곳에 출처 링크 */}
        <footer className="credit">
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo.com</a>
        </footer>
      </main>
    </div>
  )
}
