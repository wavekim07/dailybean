import { isLow, orderQtyOf, remainRate } from '../../utils/stockCalc.js'

export default function ItemList({ items, stockOf, shortageRate, onEdit, onDelete }) {
  if (items.length === 0) return <div className="card placeholder">조건에 맞는 품목이 없어요.</div>

  return (
    <ul className="list">
      {items.map((item) => {
        const qty = stockOf(item)
        const low = isLow(item, qty, shortageRate)
        const pct = Math.round(remainRate(item, qty) * 100)
        return (
        <li key={item.id} className={`card list-row ${low ? 'low-row' : ''}`}>
          <div>
            <span className="tag">{item.category}</span>
            <strong>{item.name}</strong>
            {low && <span className="tag danger">⚠️ 재고 부족</span>}
            <p className="muted">현재 <b className={low ? 'danger-text' : ''}>{Number(qty.toFixed(2))}{item.unit}</b> · 발주량 {orderQtyOf(item)}{item.unit} 대비 {pct}%</p>
            <div className="progress small-bar"><div className={`bar ${low ? 'danger' : ''}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
          </div>
          <div className="actions">
            <button className="btn" onClick={() => onEdit(item)}>수정</button>
            <button className="btn danger" onClick={() => onDelete(item)}>삭제</button>
          </div>
        </li>
        )
      })}
    </ul>
  )
}
