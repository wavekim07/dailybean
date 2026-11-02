import { useState } from 'react'
import { won } from '../../utils/format.js'

function RewardProgress({ acc, threshold }) {
  const pct = Math.min(100, (acc / threshold) * 100)
  return (
    <div className="progress-wrap">
      <div className="progress"><div className="bar" style={{ width: `${pct}%` }} /></div>
      <p className="muted">{won(acc)} / {won(threshold)} · 무료 음료까지 {won(threshold - acc)}</p>
    </div>
  )
}

export default function CustomerDetail({ customer, threshold, onPurchase, onUseCoupon, onEdit, onDelete }) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  const handlePurchase = (e) => {
    e.preventDefault()
    const n = Number(amount)
    if (!n || n <= 0) return setMessage('구매 금액을 입력해 주세요.')
    const earned = Math.floor((customer.accAmount + n) / threshold)
    onPurchase(n)
    setAmount('')
    setMessage(earned > 0 ? `🎉 무료 음료 쿠폰 ${earned}장이 발급됐어요!` : `${won(n)} 적립했어요.`)
  }

  return (
    <div className="card form">
      <div className="grind-head">
        <h2>{customer.name || '이름 없음'} <span className="muted">{customer.phone}</span></h2>
        <span className="actions">
          <button className="btn" onClick={onEdit}>수정</button>
          <button className="btn danger" onClick={onDelete}>삭제</button>
        </span>
      </div>

      {customer.memo && <p className="memo">📝 {customer.memo}</p>}

      <div className="coupon-box">
        <span>보유 쿠폰</span>
        <strong>{customer.coupons}장</strong>
        <button className="btn primary" disabled={customer.coupons === 0}
          onClick={() => { onUseCoupon(); setMessage('쿠폰 1장을 사용했어요.') }}>쿠폰 사용</button>
      </div>
      <RewardProgress acc={customer.accAmount} threshold={threshold} />

      <form className="row" onSubmit={handlePurchase}>
        <input className="input" inputMode="numeric" placeholder="구매 금액 (원)" value={amount}
          onChange={(e) => { setAmount(e.target.value.replace(/\D/g, '')); setMessage('') }} />
        <button className="btn primary" type="submit">적립</button>
      </form>
      {message && <p className="muted">{message}</p>}

      <h2>적립·사용 내역</h2>
      {customer.history.length === 0 && <p className="muted">아직 내역이 없어요.</p>}
      <ul className="list plain">
        {[...customer.history].reverse().slice(0, 20).map((h, i) => (
          <li key={i} className="list-row compact">
            <span className="muted">{h.date}</span>
            <span>
              {h.type === 'purchase' ? `${won(h.amount)} 적립` : '쿠폰 1장 사용'}
              {h.earned > 0 && <span className="tag ok">쿠폰 +{h.earned}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
