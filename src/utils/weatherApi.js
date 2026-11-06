import { toDateStr } from './date.js'
// Open-Meteo (API 키 없음) https://open-meteo.com/
const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive'
const HOURLY = 'temperature_2m,relative_humidity_2m,weather_code'

async function getJson(url, signal) {
  let res
  try {
    res = await fetch(url, { signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new Error('날씨 서버에 연결하지 못했어요.')
  }
  if (!res.ok) throw new Error(`날씨 API 오류 (${res.status})`)
  return res.json()
}

// 현재 날씨 + 오늘 시간별 예보
export async function fetchTodayWeather(lat, lon, signal) {
  const url = `${FORECAST}?latitude=${lat}&longitude=${lon}&current=${HOURLY}&hourly=${HOURLY}&timezone=Asia%2FSeoul&forecast_days=1`
  const data = await getJson(url, signal)
  return {
    current: {
      time: data.current.time,
      temp: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      code: data.current.weather_code,
    },
    hourly: data.hourly.time.map((time, i) => ({
      time,
      temp: data.hourly.temperature_2m[i],
      humidity: data.hourly.relative_humidity_2m[i],
      code: data.hourly.weather_code[i],
    })),
  }
}

// 특정 일시(YYYY-MM-DDTHH:mm)의 날씨
// 공식 문서(open-meteo.com/en/docs)에 맞춘 방식:
//  - 오늘~92일 전: forecast API의 past_days(0~92)로 지난 날까지 받아서 그 시각을 찾음
//  - 그보다 오래된 날: archive API(start_date/end_date)
export async function fetchWeatherAt(lat, lon, datetime, signal) {
  const date = datetime.slice(0, 10)
  const hourKey = `${date}T${datetime.slice(11, 13)}:00`
  const daysAgo = Math.max(0, Math.round((new Date(toDateStr(new Date())) - new Date(date)) / 86400000))
  const url = daysAgo <= 92
    ? `${FORECAST}?latitude=${lat}&longitude=${lon}&hourly=${HOURLY}&timezone=Asia%2FSeoul&past_days=${daysAgo}&forecast_days=1`
    : `${ARCHIVE}?latitude=${lat}&longitude=${lon}&hourly=${HOURLY}&timezone=Asia%2FSeoul&start_date=${date}&end_date=${date}`
  const data = await getJson(url, signal)
  const i = data.hourly.time.indexOf(hourKey)
  if (i < 0) throw new Error('그 시각의 날씨 기록을 찾지 못했어요.')
  return {
    temp: data.hourly.temperature_2m[i],
    humidity: data.hourly.relative_humidity_2m[i],
    code: data.hourly.weather_code[i],
  }
}

// 날씨 코드 → 한글 (WMO 코드)
export function weatherText(code) {
  if (code === 0) return '맑음'
  if (code <= 3) return '구름'
  if (code <= 48) return '안개'
  if (code <= 67) return '비'
  if (code <= 77) return '눈'
  if (code <= 82) return '소나기'
  if (code <= 86) return '눈'
  return '뇌우'
}

export const isRainy = (code) => code >= 51 && code !== 71 && code !== 73 && code !== 75 && code !== 77 && code !== 85 && code !== 86
