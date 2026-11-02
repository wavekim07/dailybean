import { useState } from 'react'
import { CATEGORIES, UNITS } from '../../constants/categories.js'

const EMPTY = { name: '', category: CATEGORIES[0], unit: UNITS[0], minQty: '' }

// editingItem이 있으면 수정 모드, 없으면 등록 모드
// 부모가 key를 바꿔서 다시 만들기 때문에 초기값만 받으면 됨
export default function ItemForm({ editingItem, existingNames, onSubmit, onCancel }) {
  const [form, setForm] = useState(editingItem ? { ...editingItem, minQty: String(editingItem.minQty) } : EMPTY)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const minQty = Number(form.minQty)
    if (!name) return setError('품목명을 입력해 주세요.')
    if (form.minQty === '' || Number.isNaN(minQty) || minQty < 0) return setError('최소 재고는 0 이상의 숫자로 입력해 주세요.')
    const duplicated = existingNames.some((n) => n === name && n !== editingItem?.name)
    if (duplicated) return setError('같은 이름의 품목이 이미 있어요.')

    onSubmit({ ...form, name, minQty })
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
          최소 재고
          <input className="input" name="minQty" inputMode="decimal" value={form.minQty} onChange={handleChange} placeholder="예: 2" />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        {editingItem && <button type="button" className="btn" onClick={onCancel}>취소</button>}
        <button type="submit" className="btn primary">{editingItem ? '수정 저장' : '등록'}</button>
      </div>
    </form>
  )
}
