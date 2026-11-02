# 데일리빈 (Daily Bean)

날씨와 우리 매장 추출 기록으로 그라인더 분쇄도를 추천하고, 재고·매출·고객 포인트까지 한 곳에서 관리하는 카페 매니저용 웹서비스입니다.

스크립트 프로그래밍 과제 (생성형 AI 바이브 코딩 React 웹서비스).

## 주요 기능
1. 날씨(Open-Meteo) + 원두 숙성일 + 샷 기록 기반 분쇄도 추천
2. 샷 기록 (등록·수정·삭제·검색)
3. 품목 관리 (등록·수정·삭제·검색)
4. 재고 입고·마감 실사 → 사용량 계산, 부족 알림
5. 매출 (카드·현금, 일/주/월 그래프)
6. 고객 포인트 (누적 45,000원마다 무료 음료 쿠폰)

## 기술
React 19, Vite, React Router, Context + useReducer, localStorage, Recharts, Open-Meteo API (키 없음)

## 실행
```bash
npm install
npm run dev
```
