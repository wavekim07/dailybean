import { ratioText, signed } from '../../utils/grindCalc.js'

export default function GrindRecommendCard({ rec, beans, beanId, onBeanChange, base, higherIsFiner = true, grinder, extract, targetTime }) {
  const { value, parts, resting, roastDate, restDays, adjust, weather, loading } = rec

  return (
    <div className="card grind-card">
      <div className="grind-head">
        <h2>오늘 추천 분쇄도</h2>
        {beans.length > 0 && onBeanChange && (
          <select className="input small" value={beanId ?? ''} onChange={(e) => onBeanChange(e.target.value || null)}>
            {beans.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>
      <p className="grind-value">{loading && !weather ? '…' : value.toFixed(1)}</p>
      <p className="muted">{grinder ? `${grinder} · ` : ''}기준 {base.toFixed(1)} · 숫자가 높을수록 {higherIsFiner ? '가늘게' : '굵게'}</p>

      {extract && <p className="muted">목표 추출: {extract.dose}g → {extract.yield}{extract.unit} ({ratioText(extract.dose, extract.yield)}){targetTime ? `, ${targetTime[0]}~${targetTime[1]}초` : ''}</p>}
      {resting && <p className="warn">⚠️ 로스팅 {restDays}일차 원두예요. 아직 숙성 중이라 가스가 많아요.</p>}
      {!roastDate && beanId && <p className="muted">이 원두의 로스팅 날짜 입고 기록이 없어 숙성 보정은 빠졌어요.</p>}
      {weather && <p className="muted">지금 {weather.current.temp}℃ · 습도 {weather.current.humidity}% 기준</p>}
      {!weather && !loading && <p className="muted">날씨를 못 불러와서 기준값으로 보여드려요. {rec.reload && <button className="link-btn" onClick={rec.reload}>다시 시도</button>}</p>}

      {parts.length > 0 && (
        <ul className="reason">
          {parts.map((p) => (
            <li key={p.label}>
              <span>{p.label}</span>
              <span className={p.value * (higherIsFiner ? 1 : -1) > 0 ? 'finer' : p.value !== 0 ? 'coarser' : ''}>{signed(p.value)}</span>
            </li>
          ))}
        </ul>
      )}

      {adjust && (
        <p className="alert">
          🔔 {adjust.hour}시쯤 습도 {adjust.humidity}%·{adjust.temp}℃ 예상 → <strong>{adjust.value.toFixed(1)}</strong>로 조정 권장
        </p>
      )}
    </div>
  )
}
