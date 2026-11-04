import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import LocationSetting from '../../components/settings/LocationSetting.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { GRINDERS, findGrinder } from '../../utils/grinders.js'

// 매장 시작 설정: 처음 쓰는 매장이 자기 그라인더에 맞게 쓰도록 한 번 입력
// 분쇄도 숫자는 머신이 아니라 그라인더 다이얼 기준이라, 그라인더마다 범위와 방향이 다름
export default function SetupPage() {
  const { state, dispatch } = useApp()
  const { store, grind, location } = state.settings
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: store.name, machine: store.machine, grinder: store.grinder,
    grinderId: store.grinderId ?? (store.grinder ? 'custom' : ''),
    higherIsFiner: grind.higherIsFiner !== false ? 'finer' : 'coarser',
    min: String(grind.min), max: String(grind.max), base: String(grind.base),
  })
  const [msg, setMsg] = useState('')
  const change = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setMsg('') }
  const preset = findGrinder(form.grinderId)

  // 목록에서 고르면 제조사 자료로 확인된 값(이름, 다이얼 범위·방향)만 채움
  const pickGrinder = (e) => {
    const id = e.target.value
    const g = findGrinder(id)
    setMsg('')
    setForm((p) => ({
      ...p, grinderId: id,
      grinder: g ? g.name : id === 'custom' ? '' : p.grinder,
      ...(g?.higherIsFiner != null ? { higherIsFiner: g.higherIsFiner ? 'finer' : 'coarser' } : {}),
      ...(g?.scale ? { min: String(g.scale.min), max: String(g.scale.max), base: '' } : {}),
    }))
  }

  const finish = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setMsg('매장 이름을 입력해 주세요.')
    if (!form.grinder.trim()) return setMsg('그라인더 기종을 입력해 주세요. 분쇄도 숫자는 그라인더 기준이에요.')
    const min = Number(form.min), max = Number(form.max), base = Number(form.base)
    if ([min, max, base].some(Number.isNaN) || form.min === '' || form.max === '' || form.base === '') return setMsg('다이얼 숫자를 입력해 주세요.')
    if (!(min <= base && base <= max)) return setMsg('최소 ≤ 평소 값 ≤ 최대가 되게 입력해 주세요.')
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        store: { name: form.name.trim(), machine: form.machine.trim(), grinder: form.grinder.trim(), grinderId: form.grinderId, setupDone: true },
        grind: { min, max, base, higherIsFiner: form.higherIsFiner === 'finer' },
      },
    })
    navigate('/')
  }

  const skip = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { store: { ...store, setupDone: true } } })
    navigate('/')
  }

  return (
    <section>
      <PageHeader photo title="매장 시작 설정" description="우리 매장 그라인더에 맞춰 추천 분쇄도를 계산하려고 처음 한 번 입력해요." />
      <div className="grid half">
        <form className="card form" onSubmit={finish}>
          <h2>1. 매장과 장비</h2>
          <label>매장 이름<input className="input" name="name" value={form.name} onChange={change} placeholder="예: 칵투스베이커리" /></label>
          <label>에스프레소 머신 (선택)<input className="input" name="machine" value={form.machine} onChange={change} placeholder="예: 라마르조꼬" /></label>
          <label>
            그라인더 기종
            <select className="input" value={form.grinderId} onChange={pickGrinder}>
              <option value="">선택해 주세요</option>
              {GRINDERS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              <option value="custom">목록에 없음 (직접 입력)</option>
            </select>
          </label>
          {form.grinderId === 'custom' && (
            <label>그라인더 이름<input className="input" name="grinder" value={form.grinder} onChange={change} placeholder="브랜드와 모델명" /></label>
          )}
          {preset && (
            <div className="grinder-info">
              <strong>{preset.name} · 제조사 자료</strong>
              <dl>
                <dt>버</dt><dd>{preset.burr}</dd>
                <dt>조절 방식</dt><dd>{preset.adjust}</dd>
                <dt>방향</dt><dd>{preset.direction}</dd>
                {preset.factory && <><dt>기본값</dt><dd>{preset.factory}</dd></>}
                <dt>권장 눈금</dt><dd>{preset.espresso ?? '제조사 자료에 에스프레소 권장 눈금이 없어요. 우리 매장 평소 값을 넣어 주세요.'}</dd>
              </dl>
              {!preset.scale && <p className="muted small">숫자 눈금이 없는 그라인더라, 매장에서 표시해 둔 눈금 숫자로 범위와 방향을 정해 주세요.</p>}
              <p className="src">출처: {preset.sources.map((x) => <a key={x.url} href={x.url} target="_blank" rel="noreferrer">{x.label}</a>)}</p>
            </div>
          )}

          <h2>2. 그라인더 다이얼</h2>
          <p className="muted">추천값은 이 범위 안에서만 나와요. 평소 값은 기준 날씨(습도 {grind.baseHumidity}%, {grind.baseTemp}℃)일 때 맞추는 숫자예요.</p>
          <div className="radio-row">
            <label><input type="radio" name="higherIsFiner" value="finer" checked={form.higherIsFiner === 'finer'} onChange={change} /> 숫자가 높을수록 가늘게</label>
            <label><input type="radio" name="higherIsFiner" value="coarser" checked={form.higherIsFiner === 'coarser'} onChange={change} /> 숫자가 높을수록 굵게</label>
          </div>
          <div className="count-grid">
            <label>최소<input className="input" name="min" inputMode="decimal" value={form.min} onChange={change} /></label>
            <label>평소 값<input className="input" name="base" inputMode="decimal" value={form.base} onChange={change} /></label>
            <label>최대<input className="input" name="max" inputMode="decimal" value={form.max} onChange={change} /></label>
          </div>
          {msg && <p className="error">{msg}</p>}
          <div className="actions">
            <button className="btn" type="button" onClick={skip}>기본값으로 시작</button>
            <button className="btn primary" type="submit">설정 완료</button>
          </div>
        </form>
        <div>
          <p className="muted">3. 날씨를 가져올 매장 위치 (지금: {location.name})</p>
          <LocationSetting location={location} onSave={(loc) => dispatch({ type: 'UPDATE_SETTINGS', payload: { location: loc } })} />
        </div>
      </div>
    </section>
  )
}
