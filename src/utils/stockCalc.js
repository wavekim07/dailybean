// 사용량 = 전날 재고 + 오늘 입고 − 오늘 재고
// "전날 재고"는 그 날짜 이전의 가장 최근 마감 실사 값

const sum = (arr) => arr.reduce((s, x) => s + Number(x.qty), 0)

export function lastCountBefore(counts, itemId, date) {
  return counts
    .filter((c) => c.itemId === itemId && c.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))[0] || null
}

export function usageRows(items, stockIns, counts, date) {
  return items.map((item) => {
    const prev = lastCountBefore(counts, item.id, date)
    // 전날 실사 이후부터 오늘까지의 입고를 합산 (실사를 하루 빠뜨려도 맞게)
    const ins = sum(stockIns.filter((s) => s.itemId === item.id && s.date <= date && (!prev || s.date > prev.date)))
    const today = counts.find((c) => c.itemId === item.id && c.date === date)
    const usage = prev && today ? prev.qty + ins - today.qty : null
    const low = today ? today.qty < item.minQty : false
    return { item, prevQty: prev?.qty ?? null, prevDate: prev?.date ?? null, ins, todayQty: today?.qty ?? null, usage, low }
  })
}

// 현재 추정 재고 = 가장 최근 실사 + 그 이후 입고
export function currentStock(item, stockIns, counts) {
  const last = counts.filter((c) => c.itemId === item.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  const ins = sum(stockIns.filter((s) => s.itemId === item.id && (!last || s.date > last.date)))
  return (last ? last.qty : 0) + ins
}

export function lowStockItems(items, stockIns, counts) {
  return items
    .map((item) => ({ item, qty: currentStock(item, stockIns, counts) }))
    .filter(({ item, qty }) => qty < item.minQty)
}
