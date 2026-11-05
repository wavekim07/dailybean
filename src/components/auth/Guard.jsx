import { Link } from 'react-router-dom'
import { usePermission } from '../../context/AdminContext.jsx'
import { permLabel } from '../../constants/permissions.js'
import StaffPicker from '../common/StaffPicker.jsx'

// 권한이 없으면 내용 대신 안내를 보여 줘요. compact면 한 줄로.
export default function Guard({ perm, children, compact = false }) {
  const { can, needsStaff } = usePermission()
  if (can(perm)) return children
  const text = needsStaff ? '먼저 지금 근무자를 골라 주세요.' : `'${permLabel(perm)}' 권한이 없어요. 관리자에게 요청해 주세요.`
  if (compact) return <p className="muted small lock-line">🔒 {text}</p>
  return (
    <div className="card lock-card">
      <p>🔒 {text}</p>
      {needsStaff ? <StaffPicker /> : <Link className="link" to="/settings">관리자 로그인</Link>}
    </div>
  )
}
