// 좌표에서 가장 가까운 읍·면·동 찾기 (인터넷 요청 없이 앱 안에서 계산)
// 자료: 기상청 단기예보 조회서비스 활용가이드의 '격자_위경도' 엑셀 (공공누리 제1유형, 출처: 기상청)
//   → src/data/kmaDong.json 으로 바꿔 둠. 한 줄 = [시도, 시군구, 읍면동, 위도, 경도] (행정동 중심점)
// 주의: '중심점이 가장 가까운 동'이라서, 동 경계 근처에서는 바로 옆 동이 나올 수 있음

// 위치를 고를 때만 불러와서 첫 화면을 가볍게 (약 46KB 압축)
let cache = null
export const loadDongs = () => (cache ??= import('../data/kmaDong.json').then((m) => m.default.rows))

// 두 지점의 거리 비교용 값 (짧은 거리라 평면으로 근사: 경도 차이에 cos(위도)를 곱함)
const dist2 = (lat1, lon1, lat2, lon2) => {
  const x = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180))
  const y = lat2 - lat1
  return x * x + y * y
}

export function nearestDong(rows, lat, lon) {
  let best = null
  let bestD = Infinity
  for (const r of rows) {
    const d = dist2(lat, lon, r[3], r[4])
    if (d < bestD) { bestD = d; best = r }
  }
  if (!best) return null
  // 위도 1도 ≈ 111km 로 대략적인 거리(km)
  return { sido: best[0], sigungu: best[1], dong: best[2], km: Math.sqrt(bestD) * 111 }
}

// 이름 칸에 넣을 글자: "강남구 역삼1동" (세종처럼 시군구가 없으면 시도 이름)
export const dongLabel = (d) => (d ? `${d.sigungu || d.sido} ${d.dong}` : '')
