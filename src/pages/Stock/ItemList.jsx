export default function ItemList({ items, stockOf, onEdit, onDelete }) {
  if (items.length === 0) return <div className="card placeholder">조건에 맞는 품목이 없어요.</div>

  return (
    <ul className="list">
      {items.map((item) => {
        const qty = stockOf(item)
        const low = qty < item.minQty
        return (
        <li key={item.id} className={`card list-row ${low ? 'low-row' : ''}`}>
          <div>
            <span className="tag">{item.category}</span>
            <strong>{item.name}</strong>
            {low && <span className="tag danger">부족</span>}
            <p className="muted">현재 <b>{Number(qty.toFixed(2))}{item.unit}</b> · 최소 {item.minQty}{item.unit}</p>
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
