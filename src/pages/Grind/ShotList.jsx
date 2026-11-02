import { judgeTime } from '../../utils/grindCalc.js'
import { weatherText } from '../../utils/weatherApi.js'

export default function ShotList({ shots, beanName, targetTime, onEdit, onDelete }) {
  if (shots.length === 0) return <div className="card placeholder">조건에 맞는 샷 기록이 없어요.</div>

  return (
    <ul className="list">
      {shots.map((s) => {
        const j = judgeTime(s.time, targetTime)
        return (
          <li key={s.id} className="card shot-row">
            <div className="shot-main">
              <div>
                <span className="muted">{s.datetime.replace('T', ' ')}</span>
                <strong> {beanName(s.beanId)}</strong>
              </div>
              <div className="shot-nums">
                <span>분쇄도 <b>{s.grind}</b></span>
                <span>{s.dose}g → {s.yield}g</span>
                <span>{s.time}초 <span className={`tag ${j.status}`}>{j.label}</span></span>
              </div>
              <div className="muted small">
                {s.weather ? `${weatherText(s.weather.code)} ${s.weather.temp}℃ · 습도 ${s.weather.humidity}%` : '날씨 정보 없음'}
                {s.recommended != null && ` · 당시 추천 ${s.recommended.toFixed(1)}`}
                {j.status !== 'ok' && ` · 다음엔 ${j.tip}`}
                {s.memo && ` · ${s.memo}`}
              </div>
            </div>
            <div className="actions">
              <button className="btn" onClick={() => onEdit(s)}>수정</button>
              <button className="btn danger" onClick={() => onDelete(s)}>삭제</button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
