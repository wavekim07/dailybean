import { useState } from 'react'
import { won } from '../../utils/format.js'
import { hourLabel, hoursOf, hourlySum } from '../../utils/salesStats.js'

// 날짜를 고르면 그 날짜 기록이 있을 때 수정 모드. 부모가 key로 다시 만들어 초기화
export default function SalesForm({ date, existing, saving, onDateChange, onSubmit, businessHours = { open: 8, close: 22 } }) {
  const [form, setForm] = useState({
    card: existing ? String(existing.card) : '',
    cash: existing ? String(existing.cash) : '',
    memo: existing?.memo ?? '',
  })
  // 시간대별 금액 (선택): 포스기의 시간대별 매출을 마감 때 옮겨 적음
  const [hourly, setHourly] = useState(() => Object.fromEntries(Object.entries(existing?.hourly || {}).map(([h, v]) => [h, String(v)])))
  const [showHourly, setShowHourly] = useState(() => hourlySum(existing?.hourly) > 0)
  const hours = hoursOf(businessHours)
  const hSum = hourlySum(hourly)
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
    const cleaned = Object.fromEntries(Object.entries(hourly).filter(([, v]) => v !== '' && Number(v) > 0).map(([h, v]) => [h, Number(v)]))
    onSubmit({ date, card, cash, memo: form.memo.trim(), hourly: Object.keys(cleaned).length ? cleaned : null })
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
      <button type="button" className="link-btn" onClick={() => setShowHourly((v) => !v)}>{showHourly ? '시간대별 금액 닫기' : '시간대별 금액 넣기 (포스기 시간대별 매출)'}</button>
      {showHourly && (
        <div className="hourly">
          <p className="muted small">포스기의 시간대별 매출을 옮겨 적어 주세요. 비워 둔 칸은 0원으로 봐요. 영업 시간은 설정에서 바꿀 수 있어요.</p>
          <div className="hourly-grid">
            {hours.map((h) => (
              <label key={h} className="hourly-row">
                <span>{hourLabel(h)}</span>
                <input className="input" inputMode="numeric" value={hourly[h] ?? ''} aria-label={`${hourLabel(h)} 금액`}
                  onChange={(e) => setHourly((p) => ({ ...p, [h]: e.target.value.replace(/[^0-9]/g, '') }))} />
              </label>
            ))}
          </div>
          <p className={`small ${hSum && hSum !== card + cash ? 'warn-inline' : 'muted'}`}>
            시간대 합계 {won(hSum)}{hSum > 0 && card + cash > 0 && hSum !== card + cash ? ` · 하루 합계와 ${won(Math.abs(card + cash - hSum))} 차이가 나요. 숫자를 한 번 확인해 주세요.` : ''}
          </p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="btn primary" type="submit" disabled={saving}>{saving ? '저장 중…' : existing ? '수정 저장' : '저장'}</button>
      </div>
    </form>
  )
}
