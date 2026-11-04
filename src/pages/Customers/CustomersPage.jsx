import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { won } from '../../utils/format.js'
import CustomerForm from './CustomerForm.jsx'
import CustomerDetail from './CustomerDetail.jsx'

export default function CustomersPage() {
  const { state, dispatch } = useApp()
  const { customers, settings } = state
  const threshold = settings.rewardThreshold

  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // 전화번호 뒷자리(숫자) 또는 이름으로 검색
  const filtered = useMemo(() => {
    const k = keyword.trim()
    const digits = k.replace(/\D/g, '')
    return customers.filter((c) => !k || (digits && c.phone.replace(/\D/g, '').endsWith(digits)) || (c.name && c.name.includes(k)) || (c.memo && c.memo.includes(k)))
  }, [customers, keyword])

  const selected = customers.find((c) => c.id === selectedId)

  const handleSubmit = (data) => {
    if (editing) {
      dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...data, id: editing.id } })
      setEditing(null)
    } else {
      dispatch({ type: 'ADD_CUSTOMER', payload: data })
      setKeyword(data.phone.slice(-4))
    }
  }

  return (
    <section>
      <PageHeader photo title="고객" description={`누적 ${won(threshold)}마다 무료 음료 쿠폰 1장을 드려요.`} />
      <div className="two-col">
        <div className="stack">
          <CustomerForm key={editing?.id ?? 'new'} editing={editing} phones={customers.map((c) => c.phone)}
            onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
          {selected && (
            <CustomerDetail
              customer={selected}
              threshold={threshold}
              onPurchase={(amount) => dispatch({ type: 'ADD_PURCHASE', payload: { id: selected.id, amount } })}
              onUseCoupon={() => dispatch({ type: 'USE_COUPON', payload: selected.id })}
              onEdit={() => setEditing(selected)}
              onDelete={() => setDeleteTarget(selected)}
            />
          )}
        </div>
        <div className="search-col">
          <div className="toolbar">
            <SearchBar value={keyword} onChange={setKeyword} placeholder="전화번호 뒷자리, 이름, 메모 검색" />
          </div>
          <p className="muted count">{filtered.length}명 / 전체 {customers.length}명</p>
          {filtered.length === 0 && <div className="card placeholder">찾는 고객이 없어요. 왼쪽에서 새로 등록해 주세요.</div>}
          <ul className="list">
            {filtered.map((c) => (
              <li key={c.id}>
                <button className={`card list-row customer-row ${c.id === selectedId ? 'selected' : ''}`} onClick={() => setSelectedId(c.id)}>
                  <span>
                    <strong>{c.phone.slice(-4)}</strong> <span className="muted">{c.name}</span>
                    {c.memo && <span className="muted small memo-line">{c.memo}</span>}
                  </span>
                  <span className="muted">
                    {won(c.accAmount)} {c.coupons > 0 && <span className="tag ok">쿠폰 {c.coupons}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteTarget && `${deleteTarget.phone} 고객을 삭제할까요? 적립 내역도 함께 지워져요.`}
        onConfirm={() => { dispatch({ type: 'DELETE_CUSTOMER', payload: deleteTarget.id }); setSelectedId(null); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
