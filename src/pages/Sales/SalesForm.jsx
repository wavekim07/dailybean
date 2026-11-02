import { useState } from 'react'
import { won } from '../../utils/format.js'

// 날짜를 고르면 그 날짜 기록이 있을 때 수정 모드. 부모가 key로 다시 만들어 초기화
export default function SalesForm({ date, existing, saving, onDateChange, onSubmit }) {
  const [form, setForm] = useState({
    card: existing ? String(existing.card) : '',
    cash: existing ? String(existing.cash) : '',
    memo: existing?.memo ?? '',
  })
  const [error, setError] = useState('')

  const card = Number(form.card || 0)
  const cash = Number(form.cash || 0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: name === 'memo' ? value : value.replace(/[^0-9]/g, '') }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.card === '' && form.cash === '') return setError('카드나 현금 매출을 입력해 주세요.')
    onSubmit({ date, card, cash, memo: form.memo.trim() })
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{existing ? '매출 수정' : '하루 매출 입력'}</h2>
      <label>
        날짜
        <input className="input" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
      </label>
      <div className="row">
        <label>카드 (원)<input className="input" name="card" inputMode="numeric" value={form.card} onChange={handleChange} /></label>
        <label>현금 (원)<input className="input" name="cash" inputMode="numeric" value={form.cash} onChange={handleChange} /></label>
      </div>
      <label>메모<input className="input" name="memo" value={form.memo} onChange={handleChange} placeholder="예: 단체 주문 있음" /></label>
      <p className="total-preview">합계 <strong>{won(card + cash)}</strong></p>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="btn primary" type="submit" disabled={saving}>{saving ? '저장 중…' : existing ? '수정 저장' : '저장'}</button>
      </div>
    </form>
  )
}
