import { grinderBeanAverages, humidityAverages } from '../../utils/grindStats.js'

const f1 = (n, d = 1) => (n == null ? '-' : n.toFixed(d))

// 우리 매장 평균: 기록이 쌓일수록 "이 그라인더·이 원두는 보통 몇에 맞추나"가 보임
export default function ShotAverages({ shots, beanName, grinder }) {
  const mine = shots.filter((s) => !grinder || !s.grinder || s.grinder === grinder)
  const rows = grinderBeanAverages(shots, beanName)
  const bands = humidityAverages(mine)
  if (shots.length === 0) return null
  return (
    <div className="panel averages">
      <div className="panel-title"><h2>우리 매장 평균</h2><span className="muted small">기록 {shots.length}개 기준</span></div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>그라인더 · 원두</th><th>샷</th><th>평균 분쇄도</th><th>평균 시간</th><th>평균 도징</th><th>추천과 차이</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.grinder}<br /><span className="muted small">{r.bean}</span></td>
                <td>{r.count}</td>
                <td><b>{f1(r.grind)}</b></td>
                <td>{f1(r.time)}초</td>
                <td>{f1(r.dose)}g</td>
                <td>{r.diff == null ? '-' : `±${f1(r.diff, 2)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="sub-title">습도별 평균 분쇄도{grinder ? ` (${grinder})` : ''}</h3>
      <div className="band-row">
        {bands.map((b) => (
          <div key={b.id} className="band">
            <span className="muted small">{b.label}</span>
            <strong>{f1(b.grind)}</strong>
            <span className="muted small">{b.count}잔</span>
          </div>
        ))}
      </div>
    </div>
  )
}
