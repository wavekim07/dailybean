import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { staffName } from '../../utils/staff.js'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'

// 인수인계 노트: 다음 근무자에게 남기는 말. 확인하면 누가 언제 확인했는지 남음
export default function Handoff({ compact = false }) {
  const { state, dispatch } = useApp()
  const { notes, staff } = state
  const [text, setText] = useState('')
  // 확인한 것도 기본으로 보여 줌: 체크하자마자 사라지면 잘못 누른 것을 알아차리기 어려움 (11-13 실사용자 피드백)
  const [showDone, setShowDone] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const sorted = [...notes].sort((a, b) => b.datetime.localeCompare(a.datetime))
  const open = sorted.filter((n) => !n.done)
  const closed = sorted.filter((n) => n.done)
  const shown = compact ? open.slice(0, 3) : open

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    dispatch({ type: 'ADD_NOTE', payload: { text: text.trim() } })
    setText('')
  }

  const row = (n) => (
    <li key={n.id} className={`note ${n.done ? 'done' : ''}`}>
      <input type="checkbox" checked={n.done} onChange={() => dispatch({ type: 'TOGGLE_NOTE', payload: n.id })} aria-label="확인" />
      <div className="note-body">
        <p>{n.text}</p>
        <span className="muted small">
          {n.datetime.slice(5).replace('T', ' ')} · {staffName(staff, n.staffId) ?? '이름 없음'}
          {n.done && ` → ${n.doneAt?.slice(5).replace('T', ' ')} ${staffName(staff, n.doneBy) ?? ''} 확인`}
        </span>
      </div>
      {!compact && <button className="link-btn danger-text" onClick={() => setDeleteId(n.id)}>삭제</button>}
    </li>
  )

  return (
    <div className={compact ? '' : 'panel'}>
      {!compact && <div className="panel-title"><h2>인수인계</h2><span className="muted small">확인 안 한 것 {open.length}개</span></div>}
      {!compact && (
        <form className="form" onSubmit={submit}>
          <textarea className="input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="다음 근무자에게 (예: 우유 2팩 남음, 분쇄도 6.3으로 확정)" />
          <div className="actions"><button className="btn primary" type="submit">남기기</button></div>
        </form>
      )}
      {shown.length === 0 && <p className="muted">{compact ? '확인할 인수인계가 없어요.' : '남은 인수인계가 없어요.'}</p>}
      <ul className="notes">{shown.map(row)}</ul>
      {!compact && closed.length > 0 && (
        <>
          <button className="link-btn" onClick={() => setShowDone((v) => !v)}>{showDone ? '확인한 것 숨기기' : `확인한 것 ${closed.length}개 보기`}</button>
          {showDone && <ul className="notes">{closed.map(row)}</ul>}
        </>
      )}
      <ConfirmDialog open={!!deleteId} message="이 인수인계를 삭제할까요?"
        onConfirm={() => { dispatch({ type: 'DELETE_NOTE', payload: deleteId }); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)} />
    </div>
  )
}
