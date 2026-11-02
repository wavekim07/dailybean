import { useEffect, useState } from 'react'
import { fetchTodayWeather } from '../utils/weatherApi.js'

const CACHE_KEY = 'dailybean-weather'
const CACHE_MS = 30 * 60 * 1000 // 30분 캐시로 API 호출 줄이기

function readCache(lat, lon) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (c && c.lat === lat && c.lon === lon && Date.now() - c.savedAt < CACHE_MS) return c.data
  } catch {
    // 캐시가 깨졌으면 무시
  }
  return null
}

// 요청마다 key(위치+새로고침 횟수)를 붙여서, 결과의 key가 지금 key와 다르면 "로딩 중"으로 판단
export default function useWeather(lat, lon) {
  const [reloadCount, setReloadCount] = useState(0)
  const key = `${lat},${lon},${reloadCount}`
  const [result, setResult] = useState(() => {
    const cached = readCache(lat, lon)
    return cached ? { key: `${lat},${lon},0`, data: cached, error: null } : { key: null, data: null, error: null }
  })

  useEffect(() => {
    if (result.key === key) return // 이미 이 위치의 데이터가 있음 (캐시 포함)
    const controller = new AbortController()
    const cached = reloadCount === 0 ? readCache(lat, lon) : null
    const request = cached ? Promise.resolve(cached) : fetchTodayWeather(lat, lon, controller.signal)
    request
      .then((data) => {
        if (!cached) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, savedAt: Date.now(), data }))
          } catch {
            // 저장 실패는 무시
          }
        }
        setResult({ key, data, error: null })
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setResult((prev) => ({ key, data: prev.data, error: e.message || '날씨를 불러오지 못했어요.' }))
      })
    return () => controller.abort()
  }, [key, lat, lon, reloadCount, result.key])

  return {
    weather: result.data,
    loading: result.key !== key,
    error: result.key === key ? result.error : null,
    reload: () => setReloadCount((c) => c + 1),
  }
}
