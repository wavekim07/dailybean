import { Outlet } from 'react-router-dom'
import NavBar from './NavBar.jsx'

export default function Layout() {
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
