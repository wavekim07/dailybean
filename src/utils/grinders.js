// 그라인더 기본 정보: 제조사 공식 자료에서 확인한 내용만 넣음 (2026-11-04 확인)
// 제조사가 정하지 않은 값(에스프레소 권장 눈금 등)은 null → 매장이 직접 입력
export const GRINDERS = [
  {
    id: 'mahlkoenig-e80s',
    name: 'Mahlkönig E80S',
    burr: '80mm 스틸 버',
    adjust: '0~10 슬라이더',
    direction: '0이 가장 가늘고 10이 가장 굵음',
    higherIsFiner: false,
    scale: { min: 0, max: 10 },
    factory: '출고 기본 타이머: 싱글 1.6초(약 12g), 더블 2.8초(약 18g)',
    espresso: null,
    sources: [
      { label: '제품 페이지', url: 'https://www.mahlkoenig.com/en-de/products/e80s-grinder' },
      { label: '사용 설명서', url: 'https://downloads.mahlkoenig.de/Service/Mahlkoenig_E80S_Espresso_Grinder_Original_instruction_manual_EN.pdf' },
    ],
  },
  {
    id: 'lamarzocco-swift',
    name: 'La Marzocco Swift',
    burr: '64mm 세라믹 평면 버',
    adjust: '무단 조절 (숫자 눈금 없음)',
    direction: '왼쪽 노브는 반시계 방향, 오른쪽 노브는 시계 방향이 가늘게',
    higherIsFiner: null,
    scale: null,
    factory: '도징: 22mm 바스켓 기준 약 16~18g',
    espresso: null,
    sources: [
      { label: '제품 페이지', url: 'https://lamarzoccousa.com/commercial-products/coffee-grinders/swift/' },
      { label: '사용 설명서', url: 'https://lamarzoccousa.com/documents/swift-manual/' },
    ],
  },
  {
    id: 'lamarzocco-vulcano',
    name: 'La Marzocco Vulcano',
    burr: '원뿔형(코니컬) 버 63mm(단상) / 67mm(3상)',
    adjust: '무단 조절 (숫자 눈금 없음)',
    direction: '반시계 방향이 가늘게, 시계 방향이 굵게',
    higherIsFiner: null,
    scale: null,
    factory: null,
    espresso: null,
    sources: [
      { label: '제품 페이지', url: 'https://lamarzoccousa.com/commercial-products/coffee-grinders/vulcano/' },
      { label: '사용 설명서', url: 'https://lamarzoccousa.com/documents/vulcano-e-manual/' },
    ],
  },
]

export const findGrinder = (id) => GRINDERS.find((g) => g.id === id) ?? null
