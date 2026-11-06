import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// OpenStreetMap 타일 이용 규칙: 이 주소를 쓰고, 지도 위에 출처를 잘 보이게 표시
// https://operations.osmfoundation.org/policies/tiles/
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'

// 핀 모양을 CSS로 그림 (Leaflet 기본 핀 이미지는 빌드 도구에서 경로가 깨지기 쉬워서)
const pinIcon = L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 28] })

// 지도에 핀 하나: 끌어서 옮기거나 지도를 눌러서 옮기면 onMove(lat, lon)
// Leaflet은 React가 아니라서, useRef로 지도 객체를 잡아 두고 useEffect에서 만들고 정리함
export default function LocationMap({ lat, lon, onMove }) {
  const boxRef = useRef(null)
  const mapRef = useRef(null)
  const pinRef = useRef(null)
  const moveRef = useRef(onMove)
  const firstRef = useRef([lat, lon]) // 지도를 처음 만들 때의 좌표
  useEffect(() => { moveRef.current = onMove }, [onMove])

  // 처음 한 번: 지도 만들기 (화면에서 사라질 때 remove로 정리)
  useEffect(() => {
    const map = L.map(boxRef.current, { scrollWheelZoom: false }).setView(firstRef.current, 16)
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map)
    const pin = L.marker(firstRef.current, { draggable: true, icon: pinIcon, keyboard: true, title: '매장 위치 핀' }).addTo(map)
    const report = (ll) => moveRef.current(ll.lat, ll.lng)
    pin.on('dragend', () => report(pin.getLatLng()))
    map.on('click', (e) => { pin.setLatLng(e.latlng); report(e.latlng) })
    mapRef.current = map
    pinRef.current = pin
    return () => map.remove()
  }, []) // 처음 한 번만. 좌표가 바뀔 때는 아래 effect가 핀만 옮김

  // 밖에서 좌표가 바뀌면(예: 현재 위치 다시 찾기) 핀과 지도만 옮김
  useEffect(() => {
    const pin = pinRef.current
    if (!pin) return
    const now = pin.getLatLng()
    if (Math.abs(now.lat - lat) > 1e-6 || Math.abs(now.lng - lon) > 1e-6) {
      pin.setLatLng([lat, lon])
      mapRef.current.panTo([lat, lon])
    }
  }, [lat, lon])

  return <div ref={boxRef} className="location-map" role="application" aria-label="매장 위치 지도. 핀을 끌거나 지도를 눌러 위치를 정해요." />
}
