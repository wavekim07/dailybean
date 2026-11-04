// 백업 파일 검사: 불러오기 전에 구조를 확인하고, 문제가 있으면 기존 데이터를 건드리지 않음
const REQUIRED = ['items', 'stockIns', 'counts', 'shots', 'sales', 'customers']
const OPTIONAL = ['staff', 'notes', 'checkLogs', 'orders'] // 나중에 추가된 항목: 예전 백업에는 없을 수 있음

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

export function validateBackup(data) {
  if (!isObj(data)) return { ok: false, error: '데일리빈 백업 파일이 아니에요.' }
  for (const key of REQUIRED) {
    if (!(key in data)) return { ok: false, error: `백업에 '${key}' 항목이 없어요.` }
    if (!Array.isArray(data[key])) return { ok: false, error: `백업의 '${key}' 형식이 잘못됐어요 (목록이어야 해요).` }
  }
  for (const key of OPTIONAL) {
    if (key in data && !Array.isArray(data[key])) return { ok: false, error: `백업의 '${key}' 형식이 잘못됐어요 (목록이어야 해요).` }
  }
  if ('settings' in data && !isObj(data.settings)) return { ok: false, error: "백업의 'settings' 형식이 잘못됐어요." }
  for (const key of [...REQUIRED, ...OPTIONAL]) {
    const bad = (data[key] || []).findIndex((row) => !isObj(row) || !row.id)
    if (bad >= 0) return { ok: false, error: `백업의 '${key}' ${bad + 1}번째 기록이 손상됐어요.` }
  }
  const total = REQUIRED.reduce((n, k) => n + data[k].length, 0)
  return { ok: true, summary: `품목 ${data.items.length}개, 샷 ${data.shots.length}개, 매출 ${data.sales.length}일, 고객 ${data.customers.length}명 (기록 ${total}개)` }
}
