import { weatherText } from '../../utils/weatherApi.js'

export default function WeatherCard({ location, weather, loading, error, onReload }) {
  return (
    <div className="card weather-card">
      <h2>{location} 지금 날씨</h2>
      {loading && <p className="muted">날씨를 불러오는 중…</p>}
      {error && (
        <p className="error">
          {error} <button className="btn" onClick={onReload}>다시 시도</button>
        </p>
      )}
      {weather && !loading && (
        <div className="weather-row">
          <span className="big">{weather.current.temp}℃</span>
          <span>습도 <strong>{weather.current.humidity}%</strong></span>
          <span className="tag">{weatherText(weather.current.code)}</span>
        </div>
      )}
      <a className="credit-inline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo.com</a>
    </div>
  )
}
