// 로컬 기준 YYYY-MM-DD
export const toDateStr = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

// 두 날짜 사이 일수 (b − a)
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)
