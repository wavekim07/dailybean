import { useMemo, useState } from 'react'
import SearchBar from '../../components/common/SearchBar.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { CATEGORIES } from '../../constants/categories.js'
import ItemForm from './ItemForm.jsx'
import ItemList from './ItemList.jsx'
import { currentStock, hasStockRecord, orderQtyOf } from '../../utils/stockCalc.js'
import { newId } from '../../context/reducers.js'
import { toDateStr } from '../../utils/date.js'
import { activeOrderOf } from '../../utils/orders.js'

// 재고 페이지의 "품목·현재 재고" 탭: 품목 등록·수정·삭제·검색 + 현재 추정 재고
export default function ItemsPanel() {
  const { state, dispatch } = useApp()
  const { items, stockIns, counts, settings, orders = [] } = state

  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('전체')
  const [editingItem, setEditingItem] = useState(null)
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
      <div className="two-col">
        <ItemForm
          key={editingItem?.id ?? 'new'}
          editingItem={editingItem}
          existingNames={items.map((i) => i.name)}
          onSubmit={handleSubmit}
          onCancel={() => setEditingItem(null)}
        />
        <div>
          <div className="toolbar">
            <SearchBar value={keyword} onChange={setKeyword} placeholder="품목명 검색" />
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {['전체', ...CATEGORIES].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <p className="muted count">{filtered.length}개 / 전체 {items.length}개</p>
          <ItemList items={filtered} stockOf={(item) => currentStock(item, stockIns, counts)} known={(item) => hasStockRecord(item, stockIns, counts)} onCount={saveCount} shortageRate={settings.shortageRate} onEdit={setEditingItem} onDelete={setDeleteTarget}
            inOrder={(item) => !!activeOrderOf(orders, item.id)} onOrder={(item) => dispatch({ type: 'ADD_ORDER', payload: { itemId: item.id, qty: orderQtyOf(item) } })} />
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
