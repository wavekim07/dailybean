import { useState } from 'react'
import { CATEGORIES, UNITS } from '../../constants/categories.js'
import { BODY_TARGETS } from '../../utils/taste.js'

const EMPTY = { name: '', category: CATEGORIES[0], unit: UNITS[0], orderQty: '', supplier: '', currentQty: '' }

// editingItem이 있으면 수정 모드, 없으면 등록 모드
// 부모가 key를 바꿔서 다시 만들기 때문에 초기값만 받으면 됨
export default function ItemForm({ editingItem, existingNames, onSubmit, onCancel, closable = false }) {
  const [form, setForm] = useState(editingItem ? { ...editingItem, supplier: editingItem.supplier ?? '', orderQty: String(editingItem.orderQty ?? editingItem.minQty ?? '') } : EMPTY)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const orderQty = Number(form.orderQty)
    if (!name) return setError('품목명을 입력해 주세요.')
    if (form.orderQty === '' || Number.isNaN(orderQty) || orderQty <= 0) return setError('기본 발주량은 0보다 큰 숫자로 입력해 주세요.')
    const duplicated = existingNames.some((n) => n === name && n !== editingItem?.name)
    if (duplicated) return setError('같은 이름의 품목이 이미 있어요.')

    const currentQty = form.currentQty === '' || form.currentQty == null ? null : Number(form.currentQty)
    if (currentQty !== null && (Number.isNaN(currentQty) || currentQty < 0)) return setError('지금 있는 양은 0 이상의 숫자로 입력해 주세요.')
    const { minQty: _old, currentQty: _c, ...rest } = form // 예전 필드·임시 필드 정리
    onSubmit({ ...rest, name, orderQty, supplier: (form.supplier || '').trim() }, currentQty)
    if (!editingItem) setForm(EMPTY)
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{editingItem ? '품목 수정' : '품목 등록'}</h2>
      <label>
        품목명
        <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="예: 블렌드 원두" />
      </label>
      <div className="row">
        <label>
          분류
          <select className="input" name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          단위
          <select className="input" name="unit" value={form.unit} onChange={handleChange}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </label>
        <label>
          기본 발주량
          <input className="input" name="orderQty" inputMode="decimal" value={form.orderQty} onChange={handleChange} placeholder="예: 5" />
        </label>
      </div>
      {form.category === '원두' && (
        <div>
          <span className="muted small">목표 맛 (진하기)</span>
          <div className="radio-row">
            {BODY_TARGETS.map((b) => (
              <label key={b.id}><input type="radio" name="targetBody" checked={(form.targetBody ?? 'medium') === b.id} onChange={() => setForm((p) => ({ ...p, targetBody: b.id }))} /> {b.label}</label>
            ))}
          </div>
          <span className="muted small">샷 맛 평가의 진하기를 이 목표와 비교해서 추출량을 제안해요.</span>
        </div>
      )}
      <label>
        거래처 (선택)
        <input className="input" name="supplier" value={form.supplier} onChange={handleChange} placeholder="예: OO유업, 원두 로스터리" />
        <span className="muted small">적어 두면 발주 목록이 거래처별로 묶이고, 거래처에 보낼 문자를 바로 복사할 수 있어요.</span>
      </label>
      {!editingItem && (
        <label>
          지금 있는 양 (선택)
          <input className="input" name="currentQty" inputMode="decimal" value={form.currentQty} onChange={handleChange} placeholder={`지금 매장에 있는 양 (${form.unit})`} />
          <span className="muted small">넣으면 오늘 재고로 저장돼서 바로 현재 재고가 보여요. 비워 두면 '재고 입력 전'으로 표시돼요.</span>
        </label>
      )}
      {error && <p className="error">{error}</p>}
      <div className="actions">
        {(editingItem || closable) && <button type="button" className="btn" onClick={onCancel}>{editingItem ? '취소' : '닫기'}</button>}
        <button type="submit" className="btn primary">{editingItem ? '수정 저장' : '등록'}</button>
      </div>
    </form>
  )
}
