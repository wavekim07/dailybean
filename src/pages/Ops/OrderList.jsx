import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { lowStockItems, orderQtyOf } from '../../utils/stockCalc.js'
import { activeOrderOf, activeOrders, groupBySupplier, NO_SUPPLIER, orderMessage } from '../../utils/orders.js'
import { staffName } from '../../utils/staff.js'
import { toDateStr } from '../../utils/date.js'

const fmt = (dt) => dt?.slice(5).replace('T', ' ').replace('-', '/') ?? ''

// 발주 목록: 부족 품목 담기 → 거래처별 문자 복사 → 주문함 표시 → 물건 오면 입고 완료(입고 기록 자동)
export default function OrderList() {
  const { state, dispatch } = useApp()
  const { items, stockIns, counts, orders = [], settings, staff } = state
  const [pickId, setPickId] = useState('')
  const [pickQty, setPickQty] = useState('')
  const [copied, setCopied] = useState(null)
  const [preview, setPreview] = useState(null)
  const [receiving, setReceiving] = useState(null) // { id, date, qty, roastDate, error }
  const [deleteId, setDeleteId] = useState(null)
  const [showDone, setShowDone] = useState(false)
  const [qtyError, setQtyError] = useState(null) // 수량이 비었거나 0인 거래처 이름

  const active = activeOrders(orders)
  const groups = groupBySupplier(active, items)
  const lowNotAdded = lowStockItems(items, stockIns, counts, settings.shortageRate).filter(({ item }) => !activeOrderOf(orders, item.id))
  const addable = items.filter((i) => !activeOrderOf(orders, i.id))
  const done = orders.filter((o) => o.status === 'received').sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? '')).slice(0, 10)
  const itemOf = (id) => items.find((i) => i.id === id)
  const who = (id) => staffName(staff, id)

  const addOrder = (item, qty) => dispatch({ type: 'ADD_ORDER', payload: { itemId: item.id, qty: Number(qty) || orderQtyOf(item) } })

  const addPicked = (e) => {
    e.preventDefault()
    const item = itemOf(pickId)
    if (!item) return
    const n = Number(pickQty)
    addOrder(item, pickQty !== '' && n > 0 ? n : orderQtyOf(item))
    setPickId('')
    setPickQty('')
  }

  // 수량이 비었거나 0인 발주가 있으면 문자 복사·주문 보냄을 막음 (0개 주문 문자가 나가지 않게)
  const qtyOk = (g) => {
    const ok = g.rows.every(({ order }) => order.status !== 'draft' || Number(order.qty) > 0)
    setQtyError(ok ? null : g.supplier)
    return ok
  }

  const copy = async (g) => {
    if (!qtyOk(g)) return
    const text = orderMessage(settings.store.name, g.supplier, g.rows)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(g.supplier)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setPreview(g.supplier) // 복사가 막힌 브라우저면 글을 보여 줘서 직접 길게 눌러 복사
    }
  }

  const startReceive = (order, item) => setReceiving({ id: order.id, date: toDateStr(), qty: String(order.qty), roastDate: '', isBean: item?.category === '원두' })

  const saveReceive = (e) => {
    e.preventDefault()
    const r = receiving
    const qty = Number(r.qty)
    if (r.qty === '' || Number.isNaN(qty) || qty <= 0) return setReceiving({ ...r, error: '받은 수량을 0보다 큰 숫자로 넣어 주세요.' })
    if (r.isBean && !r.roastDate) return setReceiving({ ...r, error: '원두는 로스팅 날짜가 있어야 분쇄도 추천에 쓸 수 있어요.' })
    if (r.isBean && r.roastDate > r.date) return setReceiving({ ...r, error: '로스팅 날짜가 입고 날짜보다 늦을 수 없어요.' })
    dispatch({ type: 'RECEIVE_ORDER', payload: { id: r.id, date: r.date, qty, roastDate: r.isBean ? r.roastDate : null } })
    setReceiving(null)
  }

  if (items.length === 0) return <div className="card placeholder">먼저 재고 탭에서 품목을 등록해 주세요. 품목마다 기본 발주량과 거래처를 적어 두면 여기서 바로 발주할 수 있어요.</div>

  return (
    <div className="stack">
      {/* 1. 담을 것: 부족한데 아직 목록에 없는 품목 */}
      <div className="panel">
        <div className="panel-title">
          <h2>부족한 품목</h2>
          {lowNotAdded.length > 1 && <button className="btn" onClick={() => lowNotAdded.forEach(({ item }) => addOrder(item))}>모두 담기</button>}
        </div>
        {lowNotAdded.length === 0 && <p className="muted">{active.length ? '부족한 품목은 모두 발주 목록에 담겨 있어요.' : '지금 부족한 품목이 없어요.'}</p>}
        <ul className="list plain">
          {lowNotAdded.map(({ item, qty }) => (
            <li key={item.id} className="list-row compact">
              <span><strong>{item.name}</strong> <span className="muted">현재 <b className="danger-text">{Number(qty.toFixed(2))}{item.unit}</b> · 기본 발주량 {orderQtyOf(item)}{item.unit}</span></span>
              <button className="btn primary" onClick={() => addOrder(item)}>담기</button>
            </li>
          ))}
        </ul>
        {addable.length > 0 && (
          <form className="row order-add" onSubmit={addPicked}>
            <select className="input" value={pickId} onChange={(e) => { setPickId(e.target.value); setPickQty('') }} aria-label="다른 품목">
              <option value="">다른 품목 담기</option>
              {addable.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input className="input qty-input" inputMode="decimal" value={pickQty} onChange={(e) => setPickQty(e.target.value)}
              placeholder={itemOf(pickId) ? `${orderQtyOf(itemOf(pickId))}${itemOf(pickId).unit}` : '수량'} aria-label="수량" />
            <button className="btn" type="submit" disabled={!pickId}>담기</button>
          </form>
        )}
      </div>

      {/* 2. 발주 목록: 거래처별 */}
      <div className="panel">
        <div className="panel-title"><h2>발주 목록</h2><span className="muted small">입고 전 {active.length}개</span></div>
        {active.length === 0 && <p className="muted">담은 품목이 없어요. 위에서 부족한 품목을 담아 주세요.</p>}
        {groups.map((g) => {
          const drafts = g.rows.filter(({ order }) => order.status === 'draft')
          return (
            <div key={g.supplier} className="order-group">
              <div className="order-group-head">
                <strong>{g.supplier}</strong>
                <span className="actions">
                  <button className="btn" onClick={() => copy(g)}>{copied === g.supplier ? '복사했어요' : '문자 복사'}</button>
                  {drafts.length > 0 && <button className="btn primary" onClick={() => qtyOk(g) && dispatch({ type: 'MARK_ORDERED', payload: drafts.map(({ order }) => order.id) })}>주문 보냄</button>}
                </span>
              </div>
              {qtyError === g.supplier && <p className="error" role="alert">수량이 비었거나 0인 품목이 있어요. 0보다 큰 수량을 넣어 주세요.</p>}
              {g.supplier === NO_SUPPLIER && <p className="muted small">재고 탭 → 품목 수정에서 거래처를 적으면 거래처별로 묶여요.</p>}
              {preview === g.supplier && (
                <textarea className="input" readOnly rows={g.rows.length + 1} value={orderMessage(settings.store.name, g.supplier, g.rows)} onFocus={(e) => e.target.select()} />
              )}
              <ul className="list plain">
                {g.rows.map(({ order, item }) => (
                  <li key={order.id} className="order-row">
                    <div className="order-main">
                      <span><strong>{item?.name ?? '(삭제된 품목)'}</strong> <span className={`tag ${order.status === 'ordered' ? 'ok' : 'pending'}`}>{order.status === 'ordered' ? '주문함' : '담음'}</span></span>
                      {order.status === 'draft' ? (
                        <label className="inline">수량
                          <input className="input qty-input" inputMode="decimal" value={order.qty}
                            onChange={(e) => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) { setQtyError(null); dispatch({ type: 'UPDATE_ORDER_QTY', payload: { id: order.id, qty: v } }) } }} />
                          {item?.unit}
                        </label>
                      ) : (
                        <span className="muted small">{order.qty}{item?.unit} · {fmt(order.orderedAt)} {who(order.orderedBy) ?? ''} 주문</span>
                      )}
                    </div>
                    <span className="actions">
                      {order.status === 'ordered' && <button className="btn primary" onClick={() => startReceive(order, item)}>입고 완료</button>}
                      {order.status === 'ordered' && <button className="link-btn" onClick={() => dispatch({ type: 'UNMARK_ORDERED', payload: order.id })}>주문 취소</button>}
                      <button className="link-btn danger-text" onClick={() => setDeleteId(order.id)}>빼기</button>
                    </span>
                    {receiving?.id === order.id && (
                      <form className="form receive-form" onSubmit={saveReceive}>
                        <div className="row">
                          <label>받은 날짜<input className="input" type="date" value={receiving.date} onChange={(e) => setReceiving({ ...receiving, date: e.target.value, error: '' })} /></label>
                          <label>받은 수량 ({item?.unit})<input className="input" inputMode="decimal" value={receiving.qty} onChange={(e) => setReceiving({ ...receiving, qty: e.target.value, error: '' })} /></label>
                          {receiving.isBean && <label>로스팅 날짜<input className="input" type="date" value={receiving.roastDate} onChange={(e) => setReceiving({ ...receiving, roastDate: e.target.value, error: '' })} /></label>}
                        </div>
                        {receiving.error && <p className="error">{receiving.error}</p>}
                        <p className="muted small">저장하면 입고 기록이 만들어져서 현재 재고에 바로 더해져요.</p>
                        <div className="actions">
                          <button type="button" className="btn" onClick={() => setReceiving(null)}>취소</button>
                          <button type="submit" className="btn primary">입고 저장</button>
                        </div>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* 3. 지난 입고 완료 */}
      {done.length > 0 && (
        <div>
          <button className="link-btn" onClick={() => setShowDone((v) => !v)}>{showDone ? '지난 입고 숨기기' : `최근 입고 완료 ${done.length}건 보기`}</button>
          {showDone && (
            <ul className="list plain">
              {done.map((o) => {
                const item = itemOf(o.itemId)
                return (
                  <li key={o.id} className="list-row compact">
                    <span>{item?.name ?? '(삭제된 품목)'} <span className="muted">주문 {o.qty}{item?.unit} · 받음 {o.receivedQty}{item?.unit} · {fmt(o.receivedAt)} {who(o.receivedBy) ?? ''}</span></span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} message="이 품목을 발주 목록에서 뺄까요?"
        onConfirm={() => { dispatch({ type: 'DELETE_ORDER', payload: deleteId }); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)} />
    </div>
  )
}
