import { useRef, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { useApp } from '../../context/AppContext.jsx'
import LocationSetting from '../../components/settings/LocationSetting.jsx'
import { Link } from 'react-router-dom'
import { toDateStr } from '../../utils/date.js'

const GRIND_FIELDS = [
  { key: 'base', label: '기준 분쇄도', step: 0.1 },
  { key: 'min', label: '다이얼 최소값', step: 0.1 },
  { key: 'max', label: '다이얼 최대값', step: 0.1 },
  { key: 'baseHumidity', label: '기준 습도 (%)', step: 1 },
  { key: 'baseTemp', label: '기준 기온 (℃)', step: 1 },
  { key: 'a', label: '습도 10%당 조정', step: 0.05 },
  { key: 'b', label: '기온 10℃당 조정', step: 0.05 },
  { key: 'restDays', label: '숙성 기간 (일)', step: 1 },
  { key: 'restAdj', label: '숙성 중 보정', step: 0.05 },
]

function GrindSetting({ grind, onSave }) {
  const [form, setForm] = useState(() => ({ ...grind, t0: grind.targetTime[0], t1: grind.targetTime[1] }))
  const [msg, setMsg] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const next = Object.fromEntries(GRIND_FIELDS.map((f) => [f.key, Number(form[f.key])]))
    const t0 = Number(form.t0)
    const t1 = Number(form.t1)
    if ([...Object.values(next), t0, t1].some(Number.isNaN)) return setMsg('숫자로 입력해 주세요.')
    if (next.min > next.base || next.base > next.max) return setMsg('최소 ≤ 기준 ≤ 최대가 되게 입력해 주세요.')
    if (t0 >= t1) return setMsg('목표 추출 시간 범위를 확인해 주세요.')
    onSave({ ...next, higherIsFiner: grind.higherIsFiner, targetTime: [t0, t1] }) // 저장되면 부모가 key로 폼을 새로 만들고 안내는 부모가 표시
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>분쇄도 기준값</h2>
      <p className="muted">우리 매장 그라인더 기준으로 맞춰 주세요. {grind.higherIsFiner === false ? '이 그라인더는 숫자가 높을수록 굵게' : '이 그라인더는 숫자가 높을수록 가늘게'} (매장 시작 설정에서 바꿀 수 있어요)</p>
      <div className="count-grid">
        {GRIND_FIELDS.map((f) => (
          <label key={f.key}>
            {f.label}
            <input className="input" type="number" step={f.step} value={form[f.key]} onChange={(e) => { setForm((p) => ({ ...p, [f.key]: e.target.value })); setMsg('') }} />
          </label>
        ))}
        <label>목표 추출 (초) 최소<input className="input" type="number" value={form.t0} onChange={(e) => setForm((p) => ({ ...p, t0: e.target.value }))} /></label>
        <label>목표 추출 (초) 최대<input className="input" type="number" value={form.t1} onChange={(e) => setForm((p) => ({ ...p, t1: e.target.value }))} /></label>
      </div>
      {msg && <p className="muted">{msg}</p>}
      <div className="actions"><button className="btn primary" type="submit">저장</button></div>
    </form>
  )
}

function RewardSetting({ value, onSave }) {
  const [v, setV] = useState(String(value))
  const [msg, setMsg] = useState('')
  return (
    <form className="card form" onSubmit={(e) => { e.preventDefault(); const n = Number(v); if (!n || n < 1000) return setMsg('1,000원 이상으로 입력해 주세요.'); onSave(n) }}>
      <h2>무료 음료 쿠폰 기준</h2>
      <div className="row">
        <input className="input" inputMode="numeric" value={v} onChange={(e) => { setV(e.target.value.replace(/\D/g, '')); setMsg('') }} />
        <button className="btn primary" type="submit">저장</button>
      </div>
      <p className="muted">{msg || '누적 구매 금액이 이 금액에 도달할 때마다 쿠폰 1장'}</p>
    </form>
  )
}

function StockSetting({ value, onSave }) {
  const [v, setV] = useState(String(Math.round(value * 100)))
  const [msg, setMsg] = useState('')
  return (
    <form className="card form" onSubmit={(e) => { e.preventDefault(); const n = Number(v); if (!n || n <= 0 || n >= 100) return setMsg('1~99 사이로 입력해 주세요.'); onSave(n / 100) }}>
      <h2>재고 부족 경고 기준</h2>
      <div className="row">
        <input className="input" inputMode="numeric" value={v} onChange={(e) => { setV(e.target.value.replace(/\D/g, '')); setMsg('') }} />
        <button className="btn primary" type="submit">저장</button>
      </div>
      <p className="muted">{msg || `기본 발주량에서 ${v || '?'}% 이상 줄면(남은 양 ${100 - Number(v || 0)}% 이하) 빨간색 경고`}</p>
    </form>
  )
}

function BackupPanel({ state, dispatch }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dailybean-backup-${toDateStr()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data || typeof data !== 'object' || !('items' in data || 'shots' in data)) throw new Error()
        dispatch({ type: 'IMPORT_ALL', payload: data })
        setMsg('백업을 불러왔어요.')
      } catch {
        setMsg('데일리빈 백업 파일이 아니에요.')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="card form">
      <h2>데이터 관리</h2>
      <p className="muted">데이터는 이 기기 브라우저에만 저장돼요. 기기를 바꿀 땐 백업 파일로 옮기세요.</p>
      <div className="actions" style={{ justifyContent: 'flex-start' }}>
        <button className="btn" onClick={exportJson}>백업 내보내기</button>
        <button className="btn" onClick={() => fileRef.current.click()}>백업 불러오기</button>
        <button className="btn danger" onClick={() => setConfirmReset(true)}>전체 초기화</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
      </div>
      {msg && <p className="muted">{msg}</p>}
      <ConfirmDialog open={confirmReset} message="모든 데이터를 지울까요? 되돌릴 수 없어요."
        onConfirm={() => { dispatch({ type: 'RESET_ALL' }); setConfirmReset(false); setMsg('초기화했어요.') }}
        onCancel={() => setConfirmReset(false)} />
    </div>
  )
}

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const { settings } = state
  const [notice, setNotice] = useState('')
  const save = (payload, text) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload })
    setNotice(text)
  }

  return (
    <section>
      <PageHeader title="설정" description="매장 위치, 분쇄도 기준값, 쿠폰 기준을 정해요." />
      {notice && <p className="notice">✓ {notice}</p>}
      <div className="card store-summary">
        <h2>우리 매장</h2>
        <p><strong>{settings.store.name || '이름 없음'}</strong> · 머신 {settings.store.machine || '-'} · 그라인더 {settings.store.grinder || '-'}</p>
        <Link className="btn" to="/setup">매장 시작 설정 다시 하기</Link>
      </div>
      <div className="grid half">
        <LocationSetting location={settings.location} onSave={(location) => save({ location }, `매장 위치를 ${location.name}(으)로 바꿨어요.`)} />
        <RewardSetting key={settings.rewardThreshold} value={settings.rewardThreshold} onSave={(rewardThreshold) => save({ rewardThreshold }, '쿠폰 기준을 저장했어요.')} />
        <StockSetting key={settings.shortageRate} value={settings.shortageRate} onSave={(shortageRate) => save({ shortageRate }, '재고 부족 경고 기준을 저장했어요.')} />
        <GrindSetting key={JSON.stringify(settings.grind)} grind={settings.grind} onSave={(grind) => save({ grind }, '분쇄도 기준값을 저장했어요. 추천값에 바로 반영돼요.')} />
        <BackupPanel state={state} dispatch={dispatch} />
      </div>
    </section>
  )
}
