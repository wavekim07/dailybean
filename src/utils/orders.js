// 발주 목록 도우미
// 발주 한 건: { id, itemId, qty, status: 'draft'(담음) | 'ordered'(주문함) | 'received'(입고 완료), createdAt, orderedAt, receivedAt, stockInId, staffId }

export const NO_SUPPLIER = '거래처 미지정'

export const supplierOf = (item) => item?.supplier?.trim() || NO_SUPPLIER

// 아직 입고되지 않은 발주 (담음 + 주문함)
export const activeOrders = (orders) => orders.filter((o) => o.status !== 'received')

// 이 품목이 이미 발주 목록에 있는지 (두 번 담지 않게)
export const activeOrderOf = (orders, itemId) => activeOrders(orders).find((o) => o.itemId === itemId) || null

// 거래처별로 묶기: [{ supplier, rows: [{ order, item }] }]  — 미지정은 맨 뒤
export function groupBySupplier(orders, items) {
  const map = new Map()
  for (const order of orders) {
    const item = items.find((i) => i.id === order.itemId)
    const key = supplierOf(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push({ order, item })
  }
  return [...map.entries()]
    .map(([supplier, rows]) => ({ supplier, rows }))
    .sort((a, b) => (a.supplier === NO_SUPPLIER) - (b.supplier === NO_SUPPLIER) || a.supplier.localeCompare(b.supplier, 'ko'))
}

// 거래처에 보낼 문자: 메신저에 그대로 붙여 넣을 수 있게
export function orderMessage(storeName, supplier, rows, date = new Date()) {
  const md = `${date.getMonth() + 1}/${date.getDate()}`
  const head = supplier === NO_SUPPLIER ? `[${storeName || '매장'}] ${md} 발주` : `안녕하세요, ${storeName || '매장'}입니다. ${md} 발주 부탁드려요.`
  const lines = rows.map(({ order, item }) => `- ${item?.name ?? '(삭제된 품목)'} ${order.qty}${item?.unit ?? ''}`)
  return [head, ...lines].join('\n')
}
