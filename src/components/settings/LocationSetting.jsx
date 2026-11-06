import { useState } from 'react'

const round3 = (n) => Math.round(n * 1000) / 1000
// 저장 전에 눈으로 확인할 수 있게 OpenStreetMap 지도에 핀을 찍은 링크
const mapUrl = (lat, lon) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`

// 매장 위치: 매장에서 '현재 위치 사용'을 눌러 정함
// 이름 검색은 뺐음: 날씨 서버의 지명 검색(GeoNames)이 한국 지명에 약해서 '서울'은 0건, '강남'은 시골 마을이 나왔음 (2026-11-06 확인)
export default function LocationSetting({ location, onSave }) {
  const [msg, setMsg] = useState('')
  const [here, setHere] = useState(null) // 찾은 좌표 { lat, lon, accuracy } (이름 붙이기 전)
  const [hereName, setHereName] = useState('')

  // 브라우저 위치 정보(Geolocation API): 사용자가 허용해야 하고, HTTPS에서만 동작
  const useHere = () => {
    if (!navigator.geolocation) return setMsg('이 브라우저는 위치 정보를 지원하지 않아요.')
    setMsg('위치를 확인하는 중…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHere({ lat: round3(pos.coords.latitude), lon: round3(pos.coords.longitude), accuracy: Math.round(pos.coords.accuracy) })
        setHereName('')
        setMsg('')
      },
      (err) => setMsg(err.code === 1 ? '위치 권한이 꺼져 있어요. 브라우저 주소창 옆에서 위치 접근을 허용해 주세요.' : '위치를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.'),
      // 한 번만 정하는 값이라 느리더라도 가장 정확한 위치를 요청
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const save = (e) => {
    e.preventDefault()
    onSave({ name: hereName.trim() || '우리 매장', lat: here.lat, lon: here.lon })
    setHere(null)
    setMsg('저장했어요.')
  }

  return (
    <div className="card form">
      <h2>매장 위치 (날씨 기준)</h2>
      <p>
        현재: <strong>{location.name}</strong> <span className="muted">({location.lat}, {location.lon})</span>{' '}
        <a className="link" href={mapUrl(location.lat, location.lon)} target="_blank" rel="noreferrer">지도에서 보기</a>
      </p>
      <button type="button" className="btn primary" onClick={useHere}>📍 현재 위치 사용 (매장에서 누르세요)</button>
      {here && (
        <form className="stack" onSubmit={save}>
          <p className="muted">
            찾은 위치: {here.lat}, {here.lon} · 오차 약 {here.accuracy}m{' '}
            <a className="link" href={mapUrl(here.lat, here.lon)} target="_blank" rel="noreferrer">지도에서 확인</a>
          </p>
          {here.accuracy > 1000 && <p className="error">오차가 커요. 휴대폰으로 매장에서 다시 눌러 보세요.</p>}
          <div className="row">
            <input className="input" value={hereName} onChange={(e) => setHereName(e.target.value)} placeholder="위치 이름 (예: 신논현역 매장)" aria-label="위치 이름" />
            <button className="btn primary" type="submit">이 위치로 저장</button>
          </div>
        </form>
      )}
      {msg && <p className="muted">{msg}</p>}
    </div>
  )
}
