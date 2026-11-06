import { useMemo, useState } from 'react'
import SearchBar from '../../components/common/SearchBar.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { CATEGORIES } from '../../constants/categories.js'
import Guard from '../../components/auth/Guard.jsx'
import { usePermission } from '../../context/AdminContext.jsx'
import ItemForm from './ItemForm.jsx'
import ItemList from './ItemList.jsx'
import { currentStock, hasStockRecord, orderQtyOf } from '../../utils/stockCalc.js'
import { newId } from '../../context/reducers.js'
import { toDateStr } from '../../utils/date.js'
import { activeOrderOf } from '../../utils/orders.js'

// 재고 화면 위쪽: 품목 등록·수정·삭제·검색 + 현재 재고, 줄마다 입고·수량 입력
export default function ItemsPanel() {
  const { state, dispatch } = useApp()
  const { can } = usePermission()
  const { items, stockIns, counts, settings, orders = [] } = state

  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('전체')
  const [editingItem, setEditingItem] = useState(null)
  // 품목 등록은 가끔 하는 일이라 접어 두고, 매일 쓰는 목록(수량 입력)을 위로 올림
  const [showForm, setShowForm] = useState(false)
  const formOpen = showForm || !!editingItem || items.length === 0
  const [deleteTarget, setDeleteTarget] = useState(null)

  // 검색: 이름 부분 일치 + 분류 필터
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    return items
      .filter((i) => category === '전체' || i.category === category)
      .filter((i) => i.name.toLowerCase().includes(k))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [items, keyword, category])

  const handleSubmit = (data, currentQty) => {
    if (editingItem) {
      dispatch({ type: 'UPDATE_ITEM', payload: { ...data, id: editingItem.id } })
      setEditingItem(null)
    } else {
      const id = newId()
      dispatch({ type: 'ADD_ITEM', payload: { ...data, id } })
      // 등록할 때 지금 있는 양을 넣었으면 오늘 실사로 저장 → 바로 현재 재고가 계산됨
      if (currentQty !== null) dispatch({ type: 'SAVE_DAILY_COUNT', payload: { date: toDateStr(), quantities: { [id]: currentQty } } })
    }
  }
  // 목록에서 바로 지금 수량 입력 (오늘 실사로 저장)
  const saveCount = (item, qty) => dispatch({ type: 'SAVE_DAILY_COUNT', payload: { date: toDateStr(), quantities: { [item.id]: qty } } })

  const hasRecords = (id) => stockIns.some((s) => s.itemId === id) || counts.some((c) => c.itemId === id)

  const confirmDelete = () => {
    dispatch({ type: 'DELETE_ITEM', payload: deleteTarget.id })
    if (editingItem?.id === deleteTarget.id) setEditingItem(null)
    setDeleteTarget(null)
  }

  return (
    <>
      <div className={formOpen ? 'two-col' : ''}>
        {formOpen && (
        <Guard perm="items">
        <ItemForm
          key={editingItem?.id ?? 'new'}
          editingItem={editingItem}
          existingNames={items.map((i) => i.name)}
          onSubmit={(d, q) => { handleSubmit(d, q); if (!editingItem) setShowForm(false) }}
          onCancel={() => { setEditingItem(null); setShowForm(false) }}
          closable={items.length > 0}
        />
        </Guard>
        )}
        <div>
          <div className="toolbar">
            {!formOpen && can('items') && <button className="btn primary" onClick={() => setShowForm(true)}>＋ 품목 등록</button>}
            <SearchBar value={keyword} onChange={setKeyword} placeholder="품목명 검색" />
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {['전체', ...CATEGORIES].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <p className="muted count">{filtered.length}개 / 전체 {items.length}개</p>
          <ItemList items={filtered} stockOf={(item) => currentStock(item, stockIns, counts)} known={(item) => hasStockRecord(item, stockIns, counts)} onCount={can('stock') ? saveCount : undefined} onStockIn={can('stock') ? (item, d) => dispatch({ type: 'ADD_STOCK_IN', payload: { ...d, itemId: item.id } }) : undefined} shortageRate={settings.shortageRate} onEdit={can('items') ? setEditingItem : undefined} onDelete={can('items') ? setDeleteTarget : undefined}
            inOrder={(item) => !!activeOrderOf(orders, item.id)} onOrder={can('orders') ? (item) => dispatch({ type: 'ADD_ORDER', payload: { itemId: item.id, qty: orderQtyOf(item) } }) : undefined} />
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        message={
          deleteTarget &&
          (hasRecords(deleteTarget.id)
            ? `"${deleteTarget.name}"에 재고 기록이 있어요. 그래도 삭제할까요?`
            : `"${deleteTarget.name}"을(를) 삭제할까요?`)
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
