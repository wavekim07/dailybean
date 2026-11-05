// 직원에게 줄 수 있는 권한. 관리자는 언제나 전부 가능하고, 설정은 관리자만 들어가요.
// default: 새 직원을 등록할 때 처음 켜져 있는지 (파도김 결정 2026-11-05: 매출 차트 보기, 품목 등록·수정 허용)
export const PERMISSIONS = [
  { key: 'stock', label: '재고 수량·입고 입력', default: true },
  { key: 'items', label: '품목 등록·수정·삭제', default: true },
  { key: 'orders', label: '발주 (담기·주문·입고 완료)', default: true },
  { key: 'shots', label: '샷 기록', default: true },
  { key: 'salesInput', label: '매출 입력·수정', default: true },
  { key: 'salesView', label: '매출 차트 보기', default: true },
  { key: 'customers', label: '고객 적립·쿠폰', default: true },
]

export const defaultPerms = () => Object.fromEntries(PERMISSIONS.map((p) => [p.key, p.default]))
export const permLabel = (key) => PERMISSIONS.find((p) => p.key === key)?.label ?? key
