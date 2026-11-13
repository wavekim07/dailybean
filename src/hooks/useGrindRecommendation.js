import { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import useWeather from './useWeather.js'
import { calcGrind, findAdjustPoint, latestRoastDate, learnOptsOf, logAdjustment, sameGrinderOf } from '../utils/grindCalc.js'

// 날씨 + 원두 숙성일 + 샷 기록으로 오늘 추천 분쇄도 계산
export default function useGrindRecommendation(beanId) {
  const { state } = useApp()
  const { settings, stockIns, shots } = state
  const { lat, lon } = settings.location
  const { weather, loading, error, reload } = useWeather(lat, lon)

  const result = useMemo(() => {
    const roastDate = beanId ? latestRoastDate(stockIns, beanId) : null
    // 지금 그라인더로 맞춘 기록만 보정에 사용 (그라인더가 바뀌면 숫자 기준도 달라서, 그라인더가 비어 있는 기록도 제외)
    const grinder = settings.store?.grinder
    const sameGrinder = sameGrinderOf(shots, grinder)
    const logAdj = logAdjustment(sameGrinder, beanId, learnOptsOf(settings.grind))
    const opts = { roastDate, logAdj }
    const rec = calcGrind(weather?.current ?? null, settings.grind, opts)
    const adjust = weather ? findAdjustPoint(weather.hourly, settings.grind, rec.value, opts) : null
    return { ...rec, roastDate, adjust, logAdj }
  }, [weather, settings.grind, settings.store, stockIns, shots, beanId])

  return { weather, loading, error, reload, ...result }
}
