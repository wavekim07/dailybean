import { useState } from 'react'
import { isLow, orderQtyOf, remainRate } from '../../utils/stockCalc.js'
import { toDateStr } from '../../utils/date.js'

const EMPTY = { qty: '', date: '', roastDate: '' }

// 품목 줄마다 '입고'와 '수량 입력(실사)'을 바로 할 수 있게 함 (예전 '입고·마감 실사' 탭을 여기로 합침)
export default function ItemList({ items, stockOf, known, onCount, onStockIn, shortageRate, onEdit, onDelete, inOrder, onOrder }) {
  const [open, setOpen] = useState(null) // { id, mode: 'count' | 'in' } 한 번에 한 줄만 열림
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  if (items.length === 0) return <div className="card placeholder">조건에 맞는 품목이 없어요.</div>

  const start = (id, mode) => { setOpen({ id, mode }); setForm({ ...EMPTY, date: toDateStr() }); setError('') }
  const close = () => { setOpen(null); setError('') }
  const change = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError('') }

  const saveCount = (e, item) => {
    e.preventDefault()
    const n = Number(form.qty)
    if (form.qty === '' || Number.isNaN(n) || n < 0) return setError('0 이상의 숫자로 입력해 주세요.')
    onCount(item, n)
    close()
  }

  const saveIn = (e, item) => {
    e.preventDefault()
    const n = Number(form.qty)
    const isBean = item.category === '원두'
    if (!form.qty || Number.isNaN(n) || n <= 0) return setError('입고 수량은 0보다 큰 숫자로 입력해 주세요.')
    if (isBean && !form.roastDate) return setError('원두는 로스팅 날짜가 필요해요. (분쇄도 추천에 쓰여요)')
    if (isBean && form.roastDate > form.date) return setError('로스팅 날짜가 입고 날짜보다 늦을 수 없어요.')
    onStockIn(item, { date: form.date, qty: n, roastDate: isBean ? form.roastDate : null })
    close()
  }

  return (
    <ul className="list">
      {items.map((item) => {
        const hasRecord = known(item)
        const q = stockOf(item)
        const low = hasRecord && isLow(item, q, shortageRate)
        const pct = Math.round(remainRate(item, q) * 100)
        const mode = open?.id === item.id ? open.mode : null
        return (
        <li key={item.id} className={`card list-row item-row ${low ? 'low-row' : ''}`}>
          <div className="item-main">
            <span className="tag">{item.category}</span>
            <strong>{item.name}</strong>
            {low && <span className="tag danger">⚠️ 재고 부족</span>}
            {!hasRecord && <span className="tag pending">재고 입력 전</span>}
            {inOrder?.(item) && <span className="tag ok ordered-tag">발주 목록에 있음</span>}
            {hasRecord ? (
              <>
                <p className="muted">현재 <b className={low ? 'danger-text' : ''}>{Number(q.toFixed(2))}{item.unit}</b> · 발주량 {orderQtyOf(item)}{item.unit} 대비 {pct}%</p>
                <div className="progress small-bar"><div className={`bar ${low ? 'danger' : ''}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
              </>
            ) : (
              <p className="muted">지금 매장에 있는 양을 넣으면 현재 재고와 부족 경고가 보여요.</p>
            )}
            {mode === 'count' && (
              <form className="row count-inline" onSubmit={(e) => saveCount(e, item)}>
                <input className="input" name="qty" autoFocus inputMode="decimal" value={form.qty} onChange={change} placeholder={`지금 있는 양 (${item.unit})`} aria-label="지금 있는 양" />
                <button className="btn primary" type="submit">저장</button>
                <button className="btn" type="button" onClick={close}>취소</button>
              </form>
            )}
            {mode === 'in' && (
              <form className="row count-inline" onSubmit={(e) => saveIn(e, item)}>
                <input className="input" name="qty" autoFocus inputMode="decimal" value={form.qty} onChange={change} placeholder={`들어온 양 (${item.unit})`} aria-label="입고 수량" />
                <input className="input" type="date" name="date" value={form.date} onChange={change} aria-label="입고 날짜" />
                {item.category === '원두' && (
                  <label className="inline muted small">로스팅 <input className="input" type="date" name="roastDate" value={form.roastDate} onChange={change} aria-label="로스팅 날짜" /></label>
                )}
                <button className="btn primary" type="submit">입고 저장</button>
                <button className="btn" type="button" onClick={close}>취소</button>
              </form>
            )}
            {mode && error && <p className="error">{error}</p>}
          </div>
          <div className="actions">
            {low && !inOrder?.(item) && onOrder && <button className="btn primary" onClick={() => onOrder(item)}>발주 담기</button>}
            {onStockIn && <button className="btn" onClick={() => start(item.id, 'in')}>입고</button>}
            {onCount && <button className={`btn ${hasRecord ? '' : 'primary'}`} onClick={() => start(item.id, 'count')}>수량 입력</button>}
            {onEdit && <button className="btn" onClick={() => onEdit(item)}>수정</button>}
            {onDelete && <button className="btn danger" onClick={() => onDelete(item)}>삭제</button>}
          </div>
        </li>
        )
      })}
    </ul>
  )
}
