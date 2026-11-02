export const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`
export const manwon = (n) => (n >= 10000 ? `${Math.round(n / 1000) / 10}만` : `${Math.round(n).toLocaleString('ko-KR')}`)
