import { useState } from 'react'
import { searchCity } from '../../utils/weatherApi.js'

const round3 = (n) => Math.round(n * 1000) / 1000

// 매장 위치: 지역 이름 검색 또는 지금 있는 곳(매장)의 위치 사용
export default function LocationSetting({ location, onSave }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [msg, setMsg] = useState('')
  const [here, setHere] = useState(null) // 현재 위치로 찾은 좌표 (이름 붙이기 전)
  const [hereName, setHereName] = useState('')

  const search = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setMsg('검색 중…')
    setHere(null)
    try {
      const q = query.trim()
      let r = await searchCity(q)
      // '의정부시'처럼 끝에 행정구역 글자가 붙으면 못 찾는 경우가 있어, 결과가 없을 때 한 번 떼고 다시 찾음
      if (r.length === 0 && q.length > 2 && /[시군구동읍면]$/.test(q)) r = await searchCity(q.slice(0, -1))
      setResults(r)
      setMsg(r.length ? '' : '검색 결과가 없어요. 이 검색은 시·군 단위까지만 잘 돼요(동·구 이름은 대부분 안 나와요). 가까운 시·군 이름으로 찾거나, 매장에서 "현재 위치 사용"을 눌러 주세요.')
    } catch (err) {
      setMsg(err.message)
    }
  }

  // 브라우저 위치 정보: 매장에서 누르면 매장 좌표가 바로 들어감 (사용자가 허용해야 함)
  const useHere = () => {
    if (!navigator.geolocation) return setMsg('이 브라우저는 위치 정보를 지원하지 않아요.')
    setMsg('위치를 확인하는 중…')
    setResults([])
    navigator.geolocation.getCurrentPosition(
      (pos) => { setHere({ lat: round3(pos.coords.latitude), lon: round3(pos.coords.longitude) }); setHereName(''); setMsg('') },
      (err) => setMsg(err.code === 1 ? '위치 권한이 꺼져 있어요. 브라우저에서 위치 접근을 허용해 주세요.' : '위치를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.'),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  const pick = (loc) => { onSave(loc); setResults([]); setQuery(''); setMsg(''); setHere(null) }

  return (
    <div className="card form">
      <h2>매장 위치 (날씨 기준)</h2>
      <p>현재: <strong>{location.name}</strong> <span className="muted">({location.lat}, {location.lon})</span></p>
      <button type="button" className="btn primary" onClick={useHere}>📍 현재 위치 사용 (매장에서 누르세요)</button>
      {here && (
        <form className="row" onSubmit={(e) => { e.preventDefault(); pick({ name: hereName.trim() || '우리 매장', ...here }) }}>
          <input className="input" value={hereName} onChange={(e) => setHereName(e.target.value)} placeholder={`위치 이름 (예: 신논현역 매장) · ${here.lat}, ${here.lon}`} />
          <button className="btn primary" type="submit">이 위치로 저장</button>
        </form>
      )}
      <form className="row" onSubmit={search}>
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="또는 시·군 이름 검색 (예: 의정부, 성남)" />
        <button className="btn" type="submit">검색</button>
      </form>
      {msg && <p className="muted">{msg}</p>}
      <ul className="list plain">
        {results.map((r) => (
          <li key={`${r.lat},${r.lon}`} className="list-row compact">
            <span>{r.name} <span className="muted small">{r.detail}</span></span>
            <button className="btn primary" onClick={() => pick({ name: r.name, lat: r.lat, lon: r.lon })}>선택</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
