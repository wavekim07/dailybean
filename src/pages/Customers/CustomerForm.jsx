import { useState } from 'react'

const formatPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

// 등록/수정 겸용. 부모가 key로 다시 만들어 초기화
export default function CustomerForm({ editing, phones, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: editing?.name ?? '', phone: editing?.phone ?? '', memo: editing?.memo ?? '' })
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const digits = form.phone.replace(/\D/g, '')
    if (digits.length < 10) return setError('전화번호를 정확히 입력해 주세요.')
    if (phones.includes(form.phone) && form.phone !== editing?.phone) return setError('이미 등록된 전화번호예요.')
    onSubmit({ name: form.name.trim(), phone: form.phone, memo: form.memo.trim() })
    if (!editing) setForm({ name: '', phone: '', memo: '' })
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{editing ? '고객 정보 수정' : '고객 등록'}</h2>
      <div className="row">
        <label>
          전화번호
          <input className="input" name="phone" inputMode="tel" value={form.phone} placeholder="010-1234-5678"
            onChange={(e) => { setForm((p) => ({ ...p, phone: formatPhone(e.target.value) })); setError('') }} />
        </label>
        <label>
          이름 (선택)
          <input className="input" name="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </label>
      </div>
      <label>
        메모 (선택)
        <textarea className="input" name="memo" rows={2} value={form.memo} placeholder="예: 아이스 아메리카노 샷 추가, 우유 알레르기"
          onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>취소</button>
        <button className="btn primary" type="submit">{editing ? '수정 저장' : '등록'}</button>
      </div>
    </form>
  )
}
