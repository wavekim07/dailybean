import { useState } from 'react'
import { toDateStr } from '../../utils/date.js'

export default function StockInForm({ items, onSubmit }) {
  const [form, setForm] = useState({ date: toDateStr(), itemId: '', qty: '', roastDate: '' })
  const [error, setError] = useState('')

  const selected = items.find((i) => i.id === form.itemId)
  const isBean = selected?.category === '원두'

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const qty = Number(form.qty)
    if (!form.itemId) return setError('품목을 선택해 주세요.')
    if (!form.qty || Number.isNaN(qty) || qty <= 0) return setError('입고 수량은 0보다 큰 숫자로 입력해 주세요.')
    if (isBean && !form.roastDate) return setError('원두는 로스팅 날짜를 입력해 주세요. (분쇄도 추천에 쓰여요)')
    if (isBean && form.roastDate > form.date) return setError('로스팅 날짜가 입고 날짜보다 늦을 수 없어요.')

    onSubmit({ date: form.date, itemId: form.itemId, qty, roastDate: isBean ? form.roastDate : null })
    setForm((prev) => ({ ...prev, qty: '', roastDate: '' }))
  }

  if (items.length === 0) return <div className="card placeholder">먼저 "품목·현재 재고" 탭에서 품목을 등록해 주세요.</div>

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>입고 기록</h2>
      <div className="row">
        <label>
          입고 날짜
          <input className="input" type="date" name="date" value={form.date} onChange={handleChange} />
        </label>
        <label>
          품목
          <select className="input" name="itemId" value={form.itemId} onChange={handleChange}>
            <option value="">선택</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label>
          수량{selected ? ` (${selected.unit})` : ''}
          <input className="input" name="qty" inputMode="decimal" value={form.qty} onChange={handleChange} />
        </label>
        {isBean && (
          <label>
            로스팅 날짜
            <input className="input" type="date" name="roastDate" value={form.roastDate} onChange={handleChange} />
          </label>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="submit" className="btn primary">입고 저장</button>
      </div>
    </form>
  )
}
