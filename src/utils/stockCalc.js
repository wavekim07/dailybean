// 사용량 = 전날 재고 + 오늘 입고 − 오늘 재고
// "전날 재고"는 그 날짜 이전의 가장 최근 마감 실사 값

const sum = (arr) => arr.reduce((s, x) => s + Number(x.qty), 0)

// 같은 날 입고와 실사의 순서: 기록한 시각(at)으로 비교
// 예: 오후에 실사 → 저녁에 발주 물건 입고 → 입고가 현재 재고에 더해져야 함
// 예전 기록처럼 시각이 없으면, 그날 입고는 그날 실사에 이미 들어 있다고 봄 (마감 실사 기준)
const inKey = (s) => `${s.date}T${s.at ? s.at.slice(11) : '00:00:00'}`
const countKey = (c) => `${c.date}T${c.at ? c.at.slice(11) : '23:59:59'}`
const latestCount = (list) => [...list].sort((a, b) => countKey(b).localeCompare(countKey(a)))[0] || null

// 기본 발주량 (예전 데이터의 minQty도 호환)
export const orderQtyOf = (item) => Number(item.orderQty ?? item.minQty ?? 0)

// 발주량 대비 남은 비율
export const remainRate = (item, qty) => (orderQtyOf(item) > 0 ? qty / orderQtyOf(item) : 1)

// 부족 경고: 발주량에서 shortageRate(기본 70%) 이상 줄었으면 = 남은 양이 30% 이하
export const isLow = (item, qty, shortageRate = 0.7) => orderQtyOf(item) > 0 && qty <= orderQtyOf(item) * (1 - shortageRate)

export function lastCountBefore(counts, itemId, date) {
  return latestCount(counts.filter((c) => c.itemId === itemId && c.date < date))
}

export function usageRows(items, stockIns, counts, date, shortageRate) {
  return items.map((item) => {
    const prev = lastCountBefore(counts, item.id, date)
    const today = counts.find((c) => c.itemId === item.id && c.date === date)
    // 전날 실사 이후부터 오늘 실사 전까지의 입고를 합산 (실사를 하루 빠뜨려도 맞게, 오늘 실사 뒤 입고는 다음 날 몫)
    const ins = sum(stockIns.filter((s) => s.itemId === item.id
      && (today ? inKey(s) <= countKey(today) : s.date <= date)
      && (!prev || inKey(s) > countKey(prev))))
    const usage = prev && today ? prev.qty + ins - today.qty : null
    const low = today ? isLow(item, today.qty, shortageRate) : false
    return { item, prevQty: prev?.qty ?? null, prevDate: prev?.date ?? null, ins, todayQty: today?.qty ?? null, usage, low }
  })
}

// 현재 추정 재고 = 가장 최근 실사 + 그 이후 입고
export function currentStock(item, stockIns, counts) {
  const last = latestCount(counts.filter((c) => c.itemId === item.id))
  const ins = sum(stockIns.filter((s) => s.itemId === item.id && (!last || inKey(s) > countKey(last))))
  return (last ? last.qty : 0) + ins
}

// 입고나 실사 기록이 하나라도 있어야 재고를 알 수 있음 (없으면 '0'이 아니라 '입력 전')
export const hasStockRecord = (item, stockIns, counts) =>
  stockIns.some((s) => s.itemId === item.id) || counts.some((c) => c.itemId === item.id)

export function lowStockItems(items, stockIns, counts, shortageRate) {
  return items
    .filter((item) => hasStockRecord(item, stockIns, counts))
    .map((item) => ({ item, qty: currentStock(item, stockIns, counts) }))
    .filter(({ item, qty }) => isLow(item, qty, shortageRate))
}
