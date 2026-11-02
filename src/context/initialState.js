// PRD v0.2 / 설계 v0.1 기준 기본값
export const initialState = {
  settings: {
    location: { name: '의정부', lat: 37.738, lon: 127.034 },
    grind: {
      base: 6.5, // 다이얼 기준값 (높을수록 가늘게)
      min: 6.0,
      max: 7.0,
      baseHumidity: 60, // %
      baseTemp: 20, // ℃
      a: 0.2, // 습도 10%당 조정폭
      b: 0.1, // 기온 10℃당 조정폭
      targetTime: [26, 30], // 목표 추출 시간(초)
      restDays: 3, // 로스팅 후 숙성 기간(일)
      restAdj: -0.1, // 숙성 기간 보정 (음수 = 굵게)
    },
    rewardThreshold: 45000, // 무료 음료 쿠폰 기준 누적 금액
    shortageRate: 0.7, // 기본 발주량에서 70% 이상 줄면 재고 부족 경고
  },
  items: [], // { id, name, category, unit, orderQty }  orderQty = 기본 발주량
  stockIns: [], // { id, date, itemId, qty, roastDate }
  counts: [], // { id, date, itemId, qty }  마감 실사
  shots: [], // { id, datetime, beanId, grind, dose, time, yield, memo, recommended, weather }
  sales: [], // { id, date, card, cash, memo, weather }
  customers: [], // { id, name, phone, accAmount, coupons, history }
}
