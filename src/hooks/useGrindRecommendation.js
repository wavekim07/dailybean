import { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import useWeather from './useWeather.js'
import { calcGrind, findAdjustPoint, latestRoastDate, logAdjustment } from '../utils/grindCalc.js'

// 날씨 + 원두 숙성일 + 샷 기록으로 오늘 추천 분쇄도 계산
export default function useGrindRecommendation(beanId) {
  const { state } = useApp()
  const { settings, stockIns, shots } = state
  const { lat, lon } = settings.location
  const { weather, loading, error, reload } = useWeather(lat, lon)

  const result = useMemo(() => {
    const roastDate = beanId ? latestRoastDate(stockIns, beanId) : null
    const logAdj = logAdjustment(shots, beanId)
    const opts = { roastDate, logAdj }
    const rec = calcGrind(weather?.current ?? null, settings.grind, opts)
    const adjust = weather ? findAdjustPoint(weather.hourly, settings.grind, rec.value, opts) : null
    return { ...rec, roastDate, adjust }
  }, [weather, settings.grind, stockIns, shots, beanId])

  return { weather, loading, error, reload, ...result }
}
