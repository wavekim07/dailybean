import { useState } from 'react'

// 마감 실사: 품목별 남은 수량 입력. 부모가 key={date}로 다시 만들어 그 날짜 값으로 초기화
export default function DailyCountForm({ date, items, counts, onSubmit }) {
  const saved = (id) => String(counts.find((c) => c.itemId === id && c.date === date)?.qty ?? '') // 이 날짜에 이미 저장된 값
  const [values, setValues] = useState(() => Object.fromEntries(items.map((i) => [i.id, saved(i.id)])))
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const filled = Object.entries(values).filter(([, v]) => v !== '')
    if (filled.length === 0) return setMessage('남은 수량을 하나 이상 입력해 주세요.')
    if (filled.some(([, v]) => Number.isNaN(Number(v)) || Number(v) < 0)) return setMessage('수량은 0 이상의 숫자로 입력해 주세요.')
    onSubmit(Object.fromEntries(filled.map(([id, v]) => [id, Number(v)])))
    // 저장된 값이 있던 칸을 비우고 저장하면 그 품목은 이전 값을 그대로 둠 → 조용히 넘어가지 않고 알려 줌
    const kept = items.filter((i) => values[i.id] === '' && saved(i.id) !== '')
    setValues((p) => ({ ...p, ...Object.fromEntries(kept.map((i) => [i.id, saved(i.id)])) }))
    setMessage(`${filled.length}개 품목 마감 재고를 저장했어요.` + (kept.length ? ` 비운 칸(${kept.map((i) => i.name).join(', ')})은 이전 값을 그대로 두었어요. 바꾸려면 새 숫자를 넣어 주세요.` : ''))
  }

  if (items.length === 0) return null

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>마감 재고 입력</h2>
      <p className="muted">마감 때 남은 수량을 입력하면 오늘 사용량이 계산돼요.</p>
      <div className="count-grid">
        {items.map((i) => (
          <label key={i.id}>
            {i.name} ({i.unit})
            <input
              className="input"
              inputMode="decimal"
              value={values[i.id] ?? ''}
              onChange={(e) => { setValues((p) => ({ ...p, [i.id]: e.target.value })); setMessage('') }}
            />
          </label>
        ))}
      </div>
      {message && <p className="muted">{message}</p>}
      <div className="actions">
        <button type="submit" className="btn primary">마감 재고 저장</button>
      </div>
    </form>
  )
}
