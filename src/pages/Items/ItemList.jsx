export default function ItemList({ items, onEdit, onDelete }) {
  if (items.length === 0) return <div className="card placeholder">조건에 맞는 품목이 없어요.</div>

  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id} className="card list-row">
          <div>
            <span className="tag">{item.category}</span>
            <strong>{item.name}</strong>
            <p className="muted">최소 재고 {item.minQty}{item.unit}</p>
          </div>
          <div className="actions">
            <button className="btn" onClick={() => onEdit(item)}>수정</button>
            <button className="btn danger" onClick={() => onDelete(item)}>삭제</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
