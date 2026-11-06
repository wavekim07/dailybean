import { lazy, Suspense, useState } from 'react'
import { dongLabel, loadDongs, nearestDong } from '../../utils/nearestDong.js'

// 지도 라이브러리(Leaflet)는 위치를 고를 때만 불러옴 (첫 화면을 가볍게)
const LocationMap = lazy(() => import('./LocationMap.jsx'))

const round3 = (n) => Math.round(n * 1000) / 1000

// 매장 위치: '현재 위치 사용'으로 대략 잡고, 지도에서 핀을 끌어 정확히 맞춘 뒤 저장
// 이름 검색은 뺐음: 날씨 서버의 지명 검색(GeoNames)이 한국 지명에 약해서 '서울'은 0건, '강남'은 시골 마을이 나왔음 (2026-11-06 확인)
export default function LocationSetting({ location, onSave }) {
  const [msg, setMsg] = useState('')
  const [pick, setPick] = useState(null) // 고르는 중인 좌표 { lat, lon, accuracy, moved }
  const [name, setName] = useState('')
  const [typed, setTyped] = useState(false) // 사용자가 이름을 직접 고쳤는지 (고쳤으면 자동으로 덮어쓰지 않음)
  const [dongs, setDongs] = useState(null) // 기상청 읍·면·동 목록 (위치를 고를 때 불러옴)

  // 핀 자리에서 가장 가까운 동 → 이름 칸 기본값
  const near = pick && dongs ? nearestDong(dongs, pick.lat, pick.lon) : null
  const shownName = typed ? name : dongLabel(near)

  const start = (p) => {
    setPick(p); setName(''); setTyped(false); setMsg('')
    loadDongs().then(setDongs).catch(() => setDongs([]))
  }

  // 브라우저 위치 정보(Geolocation API): 사용자가 허용해야 하고, HTTPS에서만 동작
  const useHere = () => {
    if (!navigator.geolocation) return setMsg('이 브라우저는 위치 정보를 지원하지 않아요. "지도에서 직접 고르기"를 써 주세요.')
    setMsg('위치를 확인하는 중…')
    navigator.geolocation.getCurrentPosition(
      (pos) => start({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy), moved: false }),
      (err) => setMsg(err.code === 1 ? '위치 권한이 꺼져 있어요. 브라우저 주소창 옆에서 위치 접근을 허용하거나, "지도에서 직접 고르기"를 써 주세요.' : '위치를 가져오지 못했어요. "지도에서 직접 고르기"를 써 주세요.'),
      // 한 번만 정하는 값이라 느리더라도 가장 정확한 위치를 요청
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const save = (e) => {
    e.preventDefault()
    onSave({ name: shownName.trim() || '우리 매장', lat: round3(pick.lat), lon: round3(pick.lon) })
    setPick(null)
    setMsg('저장했어요.')
  }

  return (
    <div className="card form">
      <h2>매장 위치 (날씨 기준)</h2>
      <p>현재: <strong>{location.name}</strong> <span className="muted">({location.lat}, {location.lon})</span></p>
      {!pick && (
        <div className="row">
          <button type="button" className="btn primary" onClick={useHere}>📍 현재 위치 사용 (매장에서 누르세요)</button>
          <button type="button" className="btn" onClick={() => start({ lat: location.lat, lon: location.lon, accuracy: null, moved: true })}>지도에서 직접 고르기</button>
        </div>
      )}
      {pick && (
        <form className="stack" onSubmit={save}>
          <p className="muted">핀을 끌거나 지도를 눌러 매장 자리에 맞춰 주세요.</p>
          <Suspense fallback={<div className="location-map placeholder">지도 불러오는 중…</div>}>
            <LocationMap lat={pick.lat} lon={pick.lon} onMove={(lat, lon) => setPick((p) => ({ ...p, lat, lon, moved: true }))} />
          </Suspense>
          <p className="muted small">
            {round3(pick.lat)}, {round3(pick.lon)}
            {pick.moved ? ' · 핀으로 정한 위치' : ` · 브라우저가 찾은 위치, 오차 약 ${pick.accuracy}m`}
          </p>
          {!pick.moved && pick.accuracy > 1000 && <p className="error">오차가 커요. 핀을 매장 자리로 옮겨 주세요.</p>}
          {near && <p className="muted small">가장 가까운 동: <b>{near.sido} {near.sigungu} {near.dong}</b> (동 중심에서 약 {near.km < 1 ? `${Math.round(near.km * 1000)}m` : `${near.km.toFixed(1)}km`}) · 출처: 기상청</p>}
          <div className="row">
            <input className="input" value={shownName} onChange={(e) => { setName(e.target.value); setTyped(true) }} placeholder="위치 이름 (예: 신논현역 매장)" aria-label="위치 이름" />
            <button className="btn primary" type="submit">이 위치로 저장</button>
            <button className="btn" type="button" onClick={() => setPick(null)}>취소</button>
          </div>
        </form>
      )}
      {msg && <p className="muted">{msg}</p>}
    </div>
  )
}
