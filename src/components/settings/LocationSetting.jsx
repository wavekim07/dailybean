import { useState } from 'react'
import { searchCity } from '../../utils/weatherApi.js'

export default function LocationSetting({ location, onSave }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [msg, setMsg] = useState('')

  const search = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setMsg('검색 중…')
    try {
      const r = await searchCity(query.trim())
      setResults(r)
      setMsg(r.length ? '' : '검색 결과가 없어요. 시·군 이름으로 검색해 보세요.')
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <div className="card form">
      <h2>매장 위치 (날씨 기준)</h2>
      <p>현재: <strong>{location.name}</strong> <span className="muted">({location.lat}, {location.lon})</span></p>
      <form className="row" onSubmit={search}>
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="예: 의정부, 강남구" />
        <button className="btn" type="submit">검색</button>
      </form>
      {msg && <p className="muted">{msg}</p>}
      <ul className="list plain">
        {results.map((r) => (
          <li key={`${r.lat},${r.lon}`} className="list-row compact">
            <span>{r.name} <span className="muted small">{r.detail}</span></span>
            <button className="btn primary" onClick={() => { onSave({ name: r.name, lat: r.lat, lon: r.lon }); setResults([]); setQuery(''); setMsg('') }}>선택</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
