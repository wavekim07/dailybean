import { NavLink } from 'react-router-dom'

const MENUS = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/grind', label: '분쇄도', icon: '☕' },
  { to: '/stock', label: '재고', icon: '📦' },
  { to: '/sales', label: '매출', icon: '📊' },
  { to: '/customers', label: '고객', icon: '🎟️' },
  { to: '/settings', label: '설정', icon: '⚙️' },
]

export default function NavBar() {
  return (
    <nav className="navbar">
      <div className="brand">데일리빈</div>
      <ul className="menu">
        {MENUS.map((m) => (
          <li key={m.to}>
            <NavLink to={m.to} end={m.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="icon" aria-hidden="true">{m.icon}</span>
              <span className="label">{m.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
