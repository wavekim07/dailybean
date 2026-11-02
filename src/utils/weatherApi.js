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

// 특정 일시(YYYY-MM-DDTHH:mm)의 날씨. 최근 3개월은 forecast, 그보다 오래되면 archive
export async function fetchWeatherAt(lat, lon, datetime, signal) {
  const date = datetime.slice(0, 10)
  const hour = Number(datetime.slice(11, 13))
  const ageDays = (Date.now() - new Date(date).getTime()) / 86400000
  const base = ageDays > 85 ? ARCHIVE : FORECAST
  const url = `${base}?latitude=${lat}&longitude=${lon}&hourly=${HOURLY}&timezone=Asia%2FSeoul&start_date=${date}&end_date=${date}`
  const data = await getJson(url, signal)
  const i = Math.min(hour, data.hourly.time.length - 1)
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
