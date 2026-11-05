import { TASTE_AXES, extractionOf, levelText } from '../../utils/taste.js'

// 맛 지도: 가로 = 추출 정도 (왼쪽 신맛·덜 추출 ↔ 오른쪽 쓴맛·과추출), 세로 = 진하기 (위 진함 ↔ 아래 연함)
// 아무 곳이나 누르면 그 위치를 신맛·쓴맛·진하기 3단계로 바꿔서 왼쪽 버튼에 그대로 반영해요.
// 반대로 버튼을 누르면 점이 그 칸으로 움직여요.
// 축은 샷 평가 규칙(utils/taste.js)과 같은 기준: 신맛 = 덜 추출, 쓴맛 = 과추출, 진하기 = 비율(추출량)

const S = 240 // 그림 크기 (viewBox 기준)
const PAD = 28
const IN = S - PAD * 2
const third = IN / 3

// -1/0/1 → 칸 가운데 좌표
const toX = (ext) => PAD + third * (ext + 1) + third / 2
const toY = (str) => PAD + third * (1 - str) + third / 2
const zoneOf = (pos) => (pos < 1 / 3 ? -1 : pos < 2 / 3 ? 0 : 1)

export default function TasteMap({ taste, onPick }) {
  const ext = extractionOf(taste)
  const str = taste?.strength
  const hasPoint = ext != null || str != null

  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * S
    const y = ((e.clientY - r.top) / r.height) * S
    const px = Math.min(0.999, Math.max(0, (x - PAD) / IN))
    const py = Math.min(0.999, Math.max(0, (y - PAD) / IN))
    const e2 = zoneOf(px) // -1 왼쪽(신맛) / 0 / 1 오른쪽(쓴맛)
    const s2 = -zoneOf(py) // 위가 진함
    onPick({
      sour: e2 === -1 ? 1 : e2 === 0 ? 0 : -1,
      bitter: e2 === 1 ? 1 : e2 === 0 ? 0 : -1,
      strength: s2,
    })
  }

  const key = (e) => {
    // 키보드로도: 화살표로 한 칸씩
    const cur = { ext: ext ?? 0, str: str ?? 0 }
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }
    const m = moves[e.key]
    if (!m) return
    e.preventDefault()
    const ne = Math.max(-1, Math.min(1, cur.ext + m[0]))
    const ns = Math.max(-1, Math.min(1, cur.str + m[1]))
    onPick({ sour: ne === -1 ? 1 : ne === 0 ? 0 : -1, bitter: ne === 1 ? 1 : ne === 0 ? 0 : -1, strength: ns })
  }

  const label = hasPoint
    ? TASTE_AXES.filter((a) => taste[a.key] != null).map((a) => `${a.label} ${levelText(a.key, taste[a.key])}`).join(', ')
    : '아직 고르지 않음'

  return (
    <div className="taste-map">
      <svg viewBox={`0 0 ${S} ${S}`} role="slider" tabIndex={0} aria-label={`맛 지도: ${label}. 화살표 키로 움직일 수 있어요`}
        aria-valuetext={label} onClick={pick} onKeyDown={key}>
        <rect x={PAD} y={PAD} width={IN} height={IN} rx="10" className="tm-bg" />
        {/* 가운데 칸 = 목표에 가까운 균형 */}
        <rect x={PAD + third} y={PAD + third} width={third} height={third} rx="6" className="tm-center" />
        {[1, 2].map((i) => (
          <g key={i} className="tm-grid">
            <line x1={PAD + third * i} y1={PAD} x2={PAD + third * i} y2={PAD + IN} />
            <line x1={PAD} y1={PAD + third * i} x2={PAD + IN} y2={PAD + third * i} />
          </g>
        ))}
        <text x={S / 2} y={PAD - 10} className="tm-axis" textAnchor="middle">진함</text>
        <text x={S / 2} y={S - 8} className="tm-axis" textAnchor="middle">연함</text>
        <text x={PAD - 12} y={S / 2} className="tm-axis" textAnchor="middle" dominantBaseline="middle" transform={`rotate(-90 ${PAD - 12} ${S / 2})`}>신맛 · 덜 추출</text>
        <text x={S - PAD + 12} y={S / 2} className="tm-axis" textAnchor="middle" dominantBaseline="middle" transform={`rotate(90 ${S - PAD + 12} ${S / 2})`}>쓴맛 · 과추출</text>
        <text x={S / 2} y={S / 2 + 4} className="tm-center-text" textAnchor="middle">균형</text>
        {hasPoint && <circle cx={toX(ext ?? 0)} cy={toY(str ?? 0)} r="11" className="tm-dot" />}
      </svg>
      <p className="muted small">가로는 신맛(덜 추출) ↔ 쓴맛(과추출), 세로는 진하기예요. 느낀 맛 위치를 누르면 왼쪽 평가가 채워져요.</p>
    </div>
  )
}
