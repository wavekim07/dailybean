const fmt = (v) => (v === null ? '-' : Number(v.toFixed(2)))

export default function UsageTable({ rows }) {
  if (rows.length === 0) return null
  return (
    <div className="card table-wrap">
      <h2>품목별 사용량</h2>
      <table className="table">
        <thead>
          <tr><th>품목</th><th>전날 재고</th><th>입고</th><th>오늘 재고</th><th>사용량</th></tr>
        </thead>
        <tbody>
          {rows.map(({ item, prevQty, prevDate, ins, todayQty, usage, low }) => (
            <tr key={item.id} className={low ? 'low' : ''}>
              <td>{item.name}{low && <span className="tag danger">부족</span>}</td>
              <td title={prevDate ? `${prevDate} 실사` : '이전 실사 없음'}>{fmt(prevQty)}</td>
              <td>{ins ? `+${fmt(ins)}` : '-'}</td>
              <td>{fmt(todayQty)}</td>
              <td><strong>{fmt(usage)}</strong> {usage !== null && item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">사용량 = 전날 재고 + 입고 − 오늘 재고. 전날 실사가 없으면 계산되지 않아요.</p>
    </div>
  )
}
