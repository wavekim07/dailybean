import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'

// 지금 근무자 고르기: 고른 이름이 샷·실사·매출·체크리스트·인수인계 기록에 붙어요
export default function StaffPicker({ dark = false }) {
  const { state, dispatch } = useApp()
  const { staff, settings } = state
  if (staff.length === 0) return <Link className={`staff-chip ${dark ? 'dark' : ''}`} to="/settings">근무자 등록</Link>
  return (
    <label className={`staff-chip ${dark ? 'dark' : ''}`}>
      <span className="staff-label">근무자</span>
      <select value={settings.currentStaffId ?? ''} onChange={(e) => dispatch({ type: 'SET_CURRENT_STAFF', payload: e.target.value || null })} aria-label="지금 근무자">
        <option value="">선택</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </label>
  )
}
