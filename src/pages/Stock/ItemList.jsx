import { useState } from 'react'
import { isLow, orderQtyOf, remainRate } from '../../utils/stockCalc.js'

export default function ItemList({ items, stockOf, known, onCount, shortageRate, onEdit, onDelete, inOrder, onOrder }) {
  const [countingId, setCountingId] = useState(null)
  const [qty, setQty] = useState('')
  if (items.length === 0) return <div className="card placeholder">조건에 맞는 품목이 없어요.</div>

  const save = (e, item) => {
    e.preventDefault()
    const n = Number(qty)
    if (qty === '' || Number.isNaN(n) || n < 0) return
    onCount(item, n)
    setCountingId(null)
    setQty('')
  }

  return (
    <ul className="list">
      {items.map((item) => {
        const hasRecord = known(item)
        const q = stockOf(item)
        const low = hasRecord && isLow(item, q, shortageRate)
        const pct = Math.round(remainRate(item, q) * 100)
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
            {countingId === item.id && (
              <form className="row count-inline" onSubmit={(e) => save(e, item)}>
                <input className="input" autoFocus inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={`지금 있는 양 (${item.unit})`} />
                <button className="btn primary" type="submit">저장</button>
                <button className="btn" type="button" onClick={() => setCountingId(null)}>취소</button>
              </form>
            )}
          </div>
          <div className="actions">
            {low && !inOrder?.(item) && onOrder && <button className="btn primary" onClick={() => onOrder(item)}>발주 담기</button>}
            {onCount && <button className={`btn ${hasRecord ? '' : 'primary'}`} onClick={() => { setCountingId(item.id); setQty('') }}>수량 입력</button>}
            {onEdit && <button className="btn" onClick={() => onEdit(item)}>수정</button>}
            {onDelete && <button className="btn danger" onClick={() => onDelete(item)}>삭제</button>}
          </div>
        </li>
        )
      })}
    </ul>
  )
}
