// PRD v0.2 / 설계 v0.1 기준 기본값
export const initialState = {
  settings: {
    // 매장 시작 설정 (처음 한 번). setupDone이 false면 /setup 화면으로 안내
    store: { name: '', machine: '', grinder: '', setupDone: false },
    location: { name: '의정부', lat: 37.738, lon: 127.034 },
    grind: {
      base: 6.5, // 다이얼 기준값
      higherIsFiner: true, // 그라인더 다이얼 방향: 숫자가 높을수록 가늘게면 true
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
    photo: 'table', // 배경 사진 (utils/photos.js의 id, 또는 'custom')
    customPhoto: null, // 사용자가 올린 사진 (data URL)
    rewardThreshold: 45000, // 무료 음료 쿠폰 기준 누적 금액
    shortageRate: 0.7,
    currentStaffId: null, // 지금 근무자 (로그인 없이 이름만 고름)
    checklists: { open: [], close: [] }, // 오픈·마감 확인 항목 [{ id, text }] — 매장이 직접 정함 // 기본 발주량에서 70% 이상 줄면 재고 부족 경고
  },
  items: [], // { id, name, category, unit, orderQty, supplier }  orderQty = 기본 발주량, supplier = 거래처
  stockIns: [], // { id, date, itemId, qty, roastDate }
  counts: [], // { id, date, itemId, qty }  마감 실사
  shots: [], // { id, datetime, beanId, grind, dose, time, yield, memo, recommended, weather }
  sales: [], // { id, date, card, cash, memo, weather }
  customers: [],
  staff: [], // { id, name }
  notes: [], // 인수인계 { id, datetime, staffId, text, done, doneBy, doneAt }
  orders: [], // 발주 { id, itemId, qty, status: draft|ordered|received, createdAt, orderedAt, receivedAt, stockInId, staffId }
  checkLogs: [], // 체크리스트 기록 { id, date, type, itemId, staffId, at } // { id, name, phone, accAmount, coupons, history }
}
