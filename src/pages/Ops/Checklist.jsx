import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { toDateStr } from '../../utils/date.js'
import { staffName } from '../../utils/staff.js'
import { Link } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext.jsx'

const KINDS = [{ id: 'open', label: '오픈' }, { id: 'close', label: '마감' }]

// 오픈·마감 체크리스트: 항목은 매장이 정하고, 날짜별로 누가 언제 체크했는지 남음
export default function Checklist() {
  const { state, dispatch } = useApp()
  const { settings, checkLogs, staff } = state
  const { isAdmin } = useAdmin() // 항목 추가·삭제는 관리자만 (체크는 누구나)
  const [kind, setKind] = useState(() => (new Date().getHours() < 15 ? 'open' : 'close'))
  const [date, setDate] = useState(toDateStr())
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(false)
  const list = settings.checklists[kind]
  const logOf = (itemId) => checkLogs.find((c) => c.date === date && c.kind === kind && c.itemId === itemId)
  const done = list.filter((i) => logOf(i.id)).length

  const addItem = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    dispatch({ type: 'ADD_CHECK_ITEM', payload: { kind, text: text.trim() } })
    setText('')
  }

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="tabs">
          {KINDS.map((k) => (
            <button key={k.id} className={`tab ${kind === k.id ? 'active' : ''}`} onClick={() => setKind(k.id)}>
              {k.label} {settings.checklists[k.id].length > 0 && `${settings.checklists[k.id].filter((i) => checkLogs.some((c) => c.date === date && c.kind === k.id && c.itemId === i.id)).length}/${settings.checklists[k.id].length}`}
            </button>
          ))}
        </div>
        <input className="input small" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="날짜" />
      </div>

      {list.length > 0 && (
        <div className="progress check-progress"><div className="bar" style={{ width: `${(done / list.length) * 100}%` }} /></div>
      )}
      {list.length === 0 && <p className="muted">아직 {kind === 'open' ? '오픈' : '마감'} 항목이 없어요. {isAdmin ? '우리 매장에서 매일 확인하는 일을 아래에 적어 주세요.' : '관리자가 항목을 정하면 여기 나와요.'}</p>}

      <ul className="checklist">
        {list.map((item) => {
          const log = logOf(item.id)
          return (
            <li key={item.id} className={log ? 'checked' : ''}>
              <label>
                <input type="checkbox" checked={!!log} onChange={() => dispatch({ type: 'TOGGLE_CHECK', payload: { date, kind, itemId: item.id } })} />
                <span className="check-text">{item.text}</span>
              </label>
              {log && <span className="muted small">{log.at.slice(11)} · {staffName(staff, log.staffId) ?? '근무자 미선택'}</span>}
              {isAdmin && editing && <button className="btn danger small-btn" onClick={() => dispatch({ type: 'DELETE_CHECK_ITEM', payload: { kind, id: item.id } })}>삭제</button>}
            </li>
          )
        })}
      </ul>

      {isAdmin ? (
        <>
          <form className="row" onSubmit={addItem}>
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="확인할 일 추가 (예: 우유 진열, 마감 실사)" />
            <button className="btn primary" type="submit">추가</button>
          </form>
          {list.length > 0 && <button className="link-btn" onClick={() => setEditing((v) => !v)}>{editing ? '편집 끝내기' : '항목 편집'}</button>}
        </>
      ) : (
        <p className="muted small">항목 추가·삭제는 <Link className="link" to="/settings">관리자 로그인</Link> 뒤에 여기서 할 수 있어요.</p>
      )}
    </div>
  )
}
