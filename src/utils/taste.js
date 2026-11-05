// 샷 맛 평가와 다음 샷 제안
// 원리 출처: Clive Coffee, Dialing In Espresso By Taste
//  - 신맛·날카로움 = 덜 추출 → 더 가늘게 (물이 오래 머물러 더 추출)
//  - 쓴맛·떫음 = 너무 많이 추출 → 조금 굵게
//  - 맛 균형은 맞는데 너무 진함 → 추출량을 늘림 (1:1 진하고 농축, 1:2 중간, 1:3 순함)
//  - 분쇄도를 맞출 때는 추출량을 고정하고 분쇄도만 바꿈
// 향 표현은 SCA·WCR의 Coffee Taster's Flavor Wheel을 참고 (그림은 저작권 조건상 앱에 다시 그리지 않고 링크)

export const FLAVOR_WHEEL_URL = 'https://sca.coffee/research/coffee-tasters-flavor-wheel'

// 평가 3가지, 각 3단계 (-1 / 0 / 1)
export const TASTE_AXES = [
  { key: 'sour', label: '신맛', levels: ['약함', '적당', '강함'] },
  { key: 'bitter', label: '쓴맛', levels: ['약함', '적당', '강함'] },
  { key: 'strength', label: '진하기', levels: ['연함', '적당', '진함'] },
]

// 원두별 목표 진하기 (원두 품목에 저장)
export const BODY_TARGETS = [
  { id: 'light', label: '순하게', value: -1 },
  { id: 'medium', label: '중간', value: 0 },
  { id: 'strong', label: '진하게', value: 1 },
]
export const bodyTargetOf = (bean) => BODY_TARGETS.find((b) => b.id === bean?.targetBody) ?? BODY_TARGETS[1]

export const levelText = (axis, v) => TASTE_AXES.find((a) => a.key === axis).levels[v + 1]
export const hasTaste = (t) => !!t && TASTE_AXES.some((a) => t[a.key] != null)

// 다음 샷 제안: { grindStep: +1 가늘게 / -1 굵게 / 0, yieldDelta, reason }
// grindStep은 "가늘게/굵게" 방향이고, 다이얼 숫자로 바꾸는 건 그라인더 방향(higherIsFiner)을 보고 함
export function tasteAdvice(taste, targetBody = 0, yieldStep = 2) {
  if (!hasTaste(taste)) return null
  const sour = taste.sour ?? 0
  const bitter = taste.bitter ?? 0
  const strength = taste.strength ?? 0
  if (sour > 0 && bitter > 0) return { grindStep: 0, yieldDelta: 0, reason: '신맛과 쓴맛이 둘 다 강해요. 원인을 찾기 쉽게 한 번에 하나씩만 바꿔 보세요.' }
  if (sour > 0) return { grindStep: 1, yieldDelta: 0, reason: '신맛이 강해요 → 덜 추출된 맛이라 더 가늘게 (추출량은 그대로)' }
  if (bitter > 0) return { grindStep: -1, yieldDelta: 0, reason: '쓴맛이 강해요 → 너무 많이 추출된 맛이라 조금 굵게 (추출량은 그대로)' }
  // 신맛·쓴맛 균형이 맞으면 진하기를 원두 목표와 비교해서 추출량으로 조절
  if (strength > targetBody) return { grindStep: 0, yieldDelta: yieldStep, reason: `맛 균형은 좋은데 목표보다 진해요 → 추출량 +${yieldStep}` }
  if (strength < targetBody) return { grindStep: 0, yieldDelta: -yieldStep, reason: `맛 균형은 좋은데 목표보다 연해요 → 추출량 −${yieldStep}` }
  return { grindStep: 0, yieldDelta: 0, reason: '목표한 맛에 가까워요 → 지금 세팅 유지' }
}
