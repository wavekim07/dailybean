import { useState } from 'react'

const nowLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const blank = (beanId, grind) => ({ datetime: nowLocal(), beanId: beanId ?? '', grind: grind ?? '', dose: '19.2', time: '', yield: '32', memo: '' })

// editingShot이 있으면 수정 모드. 부모가 key로 다시 만들어 초기화
export default function ShotForm({ beans, defaultBeanId, suggestedGrind, editingShot, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    editingShot
      ? { ...editingShot, grind: String(editingShot.grind), dose: String(editingShot.dose), time: String(editingShot.time), yield: String(editingShot.yield) }
      : blank(defaultBeanId, suggestedGrind),
  )
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nums = { grind: Number(form.grind), dose: Number(form.dose), time: Number(form.time), yield: Number(form.yield) }
    if (!form.beanId) return setError('원두를 선택해 주세요.')
    if (Object.values(nums).some((n) => Number.isNaN(n) || n <= 0)) return setError('분쇄도·도징·추출 시간·추출량을 숫자로 입력해 주세요.')
    if (nums.grind < 1 || nums.grind > 15) return setError('분쇄도 값이 너무 커요/작아요. 다이얼 숫자를 확인해 주세요.')
    if (nums.time > 90) return setError('추출 시간은 초 단위로 입력해 주세요.')

    const ok = await onSubmit({ ...form, ...nums })
    if (ok && !editingShot) setForm(blank(form.beanId, form.grind))
  }

  if (beans.length === 0) return <div className="card placeholder">품목에서 분류가 "원두"인 품목을 먼저 등록해 주세요.</div>

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{editingShot ? '샷 기록 수정' : '샷 기록'}</h2>
      <div className="row">
        <label>
          일시
          <input className="input" type="datetime-local" name="datetime" value={form.datetime} onChange={handleChange} />
        </label>
        <label>
          원두
          <select className="input" name="beanId" value={form.beanId} onChange={handleChange}>
            <option value="">선택</option>
            {beans.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label>분쇄도<input className="input" name="grind" inputMode="decimal" value={form.grind} onChange={handleChange} /></label>
        <label>도징 (g)<input className="input" name="dose" inputMode="decimal" value={form.dose} onChange={handleChange} /></label>
      </div>
      <div className="row">
        <label>추출 시간 (초)<input className="input" name="time" inputMode="decimal" value={form.time} onChange={handleChange} /></label>
        <label>추출량 (g)<input className="input" name="yield" inputMode="decimal" value={form.yield} onChange={handleChange} /></label>
      </div>
      <label>
        메모
        <input className="input" name="memo" value={form.memo} onChange={handleChange} placeholder="예: 신맛 강함, 오픈 첫 세팅" />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        {editingShot && <button type="button" className="btn" onClick={onCancel}>취소</button>}
        <button type="submit" className="btn primary" disabled={saving}>{saving ? '날씨 확인 중…' : editingShot ? '수정 저장' : '기록 저장'}</button>
      </div>
    </form>
  )
}
