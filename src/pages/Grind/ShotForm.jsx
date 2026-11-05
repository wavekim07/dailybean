import { useState } from 'react'
import { judgeTime, ratioText } from '../../utils/grindCalc.js'
import { FLAVOR_WHEEL_URL, TASTE_AXES, hasTaste, tasteAdvice } from '../../utils/taste.js'
import TasteMap from '../../components/grind/TasteMap.jsx'

const nowLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

// 도징·추출량은 설정의 추출 기준으로 미리 채움 (실제로 다르게 뽑았으면 고쳐서 저장)
const blank = (beanId, grind, extract, out) => ({ datetime: nowLocal(), beanId: beanId ?? '', grind: grind ?? '', dose: String(extract.dose), time: '', yield: String(out ?? extract.yield), memo: '', taste: {} })
const DEFAULT_EXTRACT = { dose: 19, yield: 32, unit: 'g' }

// editingShot이 있으면 수정 모드. 부모가 key로 다시 만들어 초기화
export default function ShotForm({ beans, defaultBeanId, suggestedGrind, editingShot, saving, onSubmit, onCancel, targetTime = [26, 30], higherIsFiner = true, extract = DEFAULT_EXTRACT, targetBodyOf = () => 0, yieldStep = 2 }) {
  const [form, setForm] = useState(() =>
    editingShot
      ? { ...editingShot, taste: editingShot.taste ?? {}, grind: String(editingShot.grind), dose: String(editingShot.dose), time: String(editingShot.time), yield: String(editingShot.yield) }
      : blank(defaultBeanId, suggestedGrind, extract),
  )
  const [error, setError] = useState('')
  // 지금 고른 맛으로 저장하면 어떤 제안이 나오는지 미리 보여 줌
  const advicePreview = tasteAdvice(form.taste, targetBodyOf(form.beanId), yieldStep)
  const [saved, setSaved] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setError('')
    setSaved('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nums = { grind: Math.round(Number(form.grind) * 100) / 100, dose: Number(form.dose), time: Number(form.time), yield: Number(form.yield) }
    if (!form.beanId) return setError('원두를 선택해 주세요.')
    if (Object.values(nums).some((n) => Number.isNaN(n) || n <= 0)) return setError('분쇄도·도징·추출 시간·추출량을 숫자로 입력해 주세요.')
    if (nums.grind < 1 || nums.grind > 15) return setError('분쇄도 값이 너무 커요/작아요. 다이얼 숫자를 확인해 주세요.')
    if (nums.time > 90) return setError('추출 시간은 초 단위로 입력해 주세요.')

    const taste = hasTaste(form.taste) ? form.taste : null
    const ok = await onSubmit({ ...form, ...nums, taste })
    if (ok && !editingShot) {
      // 빠름/느림이면 다음 샷 분쇄도를 0.1 조정해서 미리 넣어 둠 (다이얼 방향 반영)
      // 맛 평가가 있으면 맛 기준으로, 없으면 추출 시간 기준으로 다음 샷 값을 미리 넣음
      const j = judgeTime(nums.time, targetTime, higherIsFiner)
      const advice = tasteAdvice(taste, targetBodyOf(form.beanId), yieldStep)
      const finer = advice ? advice.grindStep : j.status === 'fast' ? 1 : j.status === 'slow' ? -1 : 0 // +1 가늘게, -1 굵게
      const dial = (higherIsFiner === false ? -finer : finer) * 0.1
      const next = Math.round((nums.grind + dial) * 10) / 10
      const nextYield = Math.round((nums.yield + (advice?.yieldDelta ?? 0)) * 10) / 10
      setForm(blank(form.beanId, String(next), extract, nextYield)) // 추출량은 방금 뽑은 양을 이어 씀 (맛 평가로 바꾸라고 했을 때만 바뀜)
      const timeText = `${nums.time}초 ${j.label}`
      const plan = finer ? `다음 샷은 분쇄도 ${next.toFixed(1)}(${finer > 0 ? '가늘게' : '굵게'})` : advice?.yieldDelta ? `다음 샷은 추출량 ${nextYield}${extract.unit}` : '지금 세팅 유지'
      setSaved(advice ? `기록했어요. ${advice.reason}. ${plan}로 넣어 뒀어요. (${timeText})` : j.status === 'ok' ? `기록했어요. ${timeText}, 지금 세팅 유지` : `기록했어요. ${timeText} → ${plan}로 넣어 뒀어요`)
    }
  }

  if (beans.length === 0) return <div className="card placeholder">재고 페이지의 "품목·현재 재고" 탭에서 분류가 "원두"인 품목을 먼저 등록해 주세요.</div>

  return (
    <form className="card form shot-form" onSubmit={handleSubmit}>
      <h2>{editingShot ? '샷 기록 수정' : '샷 기록'}</h2>
      {saved && <p className="notice">✓ {saved}</p>}
      <div className="row">
        <label>
          일시
          <input className="input" type="datetime-local" name="datetime" value={form.datetime} onChange={handleChange} />
        </label>
        <label>
          원두
          <select className="input" name="beanId" value={form.beanId} onChange={handleChange}>
            <option value="">선택</option>
            {beans.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label>분쇄도<input className="input" name="grind" inputMode="decimal" value={form.grind} onChange={handleChange} /></label>
        <label>도징 (g)<input className="input" name="dose" inputMode="decimal" value={form.dose} onChange={handleChange} /></label>
      </div>
      <div className="row">
        <label>추출 시간 (초)<input className="input" name="time" inputMode="decimal" value={form.time} onChange={handleChange} /></label>
        <label>추출량 ({extract.unit})<input className="input" name="yield" inputMode="decimal" value={form.yield} onChange={handleChange} /></label>
      </div>
      <p className="muted small">
        비율 {ratioText(form.dose, form.yield)} · 목표 {extract.dose}g → {extract.yield}{extract.unit} ({ratioText(extract.dose, extract.yield)})
        {Number(form.yield) > 0 && Number(form.yield) !== extract.yield && ` · 목표보다 ${Number(form.yield) > extract.yield ? '많이' : '적게'} 뽑음`}
      </p>
      <div className="taste-wrap">
        <div className="taste">
        <span className="taste-title">맛 평가 (선택) <span className="muted small">마셔 보고 눌러 주세요. 다음 샷 값을 맛 기준으로 제안해요.</span></span>
        {TASTE_AXES.map((a) => (
          <div key={a.key} className="taste-row" role="group" aria-label={a.label}>
            <span>{a.label}</span>
            {a.levels.map((lv, i) => {
              const v = i - 1
              const on = form.taste?.[a.key] === v
              return <button key={lv} type="button" className={`taste-btn ${on ? 'on' : ''}`} aria-pressed={on}
                onClick={() => setForm((p) => ({ ...p, taste: { ...p.taste, [a.key]: on ? null : v } }))}>{lv}</button>
            })}
          </div>
        ))}
          {advicePreview && <p className="small taste-preview">→ {advicePreview.reason}</p>}
        </div>
        <TasteMap taste={form.taste} onPick={(t) => setForm((p) => ({ ...p, taste: t }))} />
      </div>
      <label>
        향·메모
        <input className="input" name="memo" value={form.memo} onChange={handleChange} placeholder="예: 견과류, 다크초콜릿 / 오픈 첫 세팅" />
        <span className="muted small">향 표현은 <a href={FLAVOR_WHEEL_URL} target="_blank" rel="noreferrer">SCA 커피 테이스터스 플레이버 휠</a>의 단어를 참고하면 근무자끼리 같은 말로 기록할 수 있어요.</span>
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        {editingShot && <button type="button" className="btn" onClick={onCancel}>취소</button>}
        <button type="submit" className="btn primary" disabled={saving}>{saving ? '날씨 확인 중…' : editingShot ? '수정 저장' : '기록 저장'}</button>
      </div>
    </form>
  )
}
