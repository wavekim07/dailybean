import { useRef, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { useApp } from '../../context/AppContext.jsx'
import LocationSetting from '../../components/settings/LocationSetting.jsx'
import PhotoPicker from '../../components/photo/PhotoPicker.jsx'
import { Link } from 'react-router-dom'
import { toDateStr } from '../../utils/date.js'
import { validateBackup } from '../../utils/backup.js'
import { extractOf, ratioText } from '../../utils/grindCalc.js'
import { PERMISSIONS, defaultPerms } from '../../constants/permissions.js'
import { useAdmin } from '../../context/AdminContext.jsx'

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

// 근무자 목록 + 직원별 권한: 이름을 고르면 그 사람의 권한을 켜고 끌 수 있어요 (관리자 화면)
function StaffSetting({ staff, dispatch }) {
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const selected = staff.find((s) => s.id === selectedId) || null
  const perms = selected ? { ...defaultPerms(), ...selected.perms } : null
  const submit = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    if (staff.some((s) => s.name === n)) return setMsg('이미 있는 이름이에요.')
    dispatch({ type: 'ADD_STAFF', payload: n })
    setName(''); setMsg('')
  }
  return (
    <div className="card form">
      <h2>근무자와 권한</h2>
      <p className="muted">직원은 화면 위에서 자기 이름을 고르면 여기서 정한 권한만큼 쓸 수 있어요. 이름을 누르면 권한을 바꿀 수 있어요. 설정은 관리자만 들어와요.</p>
      <form className="row" onSubmit={submit}>
        <input className="input" value={name} onChange={(e) => { setName(e.target.value); setMsg('') }} placeholder="이름" />
        <button className="btn primary" type="submit">추가</button>
      </form>
      {msg && <p className="error">{msg}</p>}
      {staff.length === 0 && <p className="muted small">아직 등록한 직원이 없어요. 직원이 없으면 누구나 기본 권한으로 쓸 수 있어요.</p>}
      <div className="staff-perm-list">
        {staff.map((s) => {
          const p = { ...defaultPerms(), ...s.perms }
          const off = PERMISSIONS.filter((x) => !p[x.key]).length
          return <button key={s.id} type="button" className={`staff-pill ${s.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}>{s.name}{off ? ` · 제한 ${off}` : ''}</button>
        })}
      </div>
      {selected && (
        <div className="panel-note">
          <strong>{selected.name}</strong>의 권한
          <ul className="perm-list">
            {PERMISSIONS.map((x) => (
              <li key={x.key}><label><input type="checkbox" checked={!!perms[x.key]} onChange={(e) => dispatch({ type: 'SET_STAFF_PERM', payload: { id: selected.id, key: x.key, value: e.target.checked } })} /> {x.label}</label></li>
            ))}
          </ul>
          <div className="actions"><button type="button" className="btn danger" onClick={() => setDeleteTarget(selected)}>{selected.name} 삭제</button></div>
        </div>
      )}
      <ConfirmDialog open={!!deleteTarget} message={deleteTarget && `${deleteTarget.name}을(를) 근무자 목록에서 지울까요? 지금까지 남긴 기록은 그대로 남아요.`}
        onConfirm={() => { dispatch({ type: 'DELETE_STAFF', payload: deleteTarget.id }); setSelectedId(null); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}

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

// 추출 기준: 목표 도징량·추출량과 추출량 단위. 샷 기록 칸에 미리 채워지고, 추천 카드에 비율이 보임
function ExtractSetting({ grind, onSave }) {
  const ex = extractOf(grind)
  const [form, setForm] = useState({ dose: String(ex.dose), out: String(ex.yield), unit: ex.unit })
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setMsg('') }
  const submit = (e) => {
    e.preventDefault()
    const dose = Number(form.dose)
    const out = Number(form.out)
    if (!(dose > 0) || !(out > 0)) return setMsg('도징량과 추출량을 0보다 큰 숫자로 넣어 주세요.')
    onSave({ targetDose: dose, targetYield: out, yieldUnit: form.unit })
  }
  return (
    <form className="card form" onSubmit={submit}>
      <h2>추출 기준</h2>
      <p className="muted">샷을 기록할 때 이 값이 미리 채워지고, 추천 카드에 목표 비율이 보여요. 분쇄도는 같은 양을 뽑는다는 전제에서 맞추기 때문에 기준이 있어야 해요.</p>
      <div className="row">
        <label>목표 도징량 (g)<input className="input" inputMode="decimal" value={form.dose} onChange={set('dose')} /></label>
        <label>목표 추출량 ({form.unit})<input className="input" inputMode="decimal" value={form.out} onChange={set('out')} /></label>
      </div>
      <div className="radio-row">
        <label><input type="radio" name="yieldUnit" checked={form.unit === 'g'} onChange={() => setForm((p) => ({ ...p, unit: 'g' }))} /> g (저울로 무게를 잼)</label>
        <label><input type="radio" name="yieldUnit" checked={form.unit === 'ml'} onChange={() => setForm((p) => ({ ...p, unit: 'ml' }))} /> ml (샷잔 눈금으로 봄)</label>
      </div>
      <p className="muted">{msg || `비율 ${ratioText(form.dose, form.out)} · 1:1에 가까울수록 진하고, 1:3에 가까울수록 순해요.${form.unit === 'ml' ? ' 비율은 원래 무게(g)로 재는 값이라, ml로 보면 대략적인 값이에요.' : ''}`}</p>
      <div className="actions"><button className="btn primary" type="submit">저장</button></div>
    </form>
  )
}

// 영업 시간: 매출 입력의 시간대별 칸과 시간대별 평균 그래프를 이 범위로 보여 줘요
function HoursSetting({ value, onSave }) {
  const [open, setOpen] = useState(String(value.open))
  const [close, setClose] = useState(String(value.close))
  const [msg, setMsg] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const o = Number(open)
    const c = Number(close)
    if (!Number.isInteger(o) || !Number.isInteger(c) || o < 0 || c > 24 || o >= c) return setMsg('0~24 사이 정수로, 여는 시간이 닫는 시간보다 빠르게 넣어 주세요.')
    onSave({ open: o, close: c })
  }
  return (
    <form className="card form" onSubmit={submit}>
      <h2>영업 시간</h2>
      <div className="row">
        <label>여는 시간 (시)<input className="input" inputMode="numeric" value={open} onChange={(e) => { setOpen(e.target.value.replace(/\D/g, '')); setMsg('') }} /></label>
        <label>닫는 시간 (시)<input className="input" inputMode="numeric" value={close} onChange={(e) => { setClose(e.target.value.replace(/\D/g, '')); setMsg('') }} /></label>
      </div>
      <p className="muted">{msg || '매출 입력의 시간대별 칸과 시간대별 평균 그래프가 이 시간만큼 나와요.'}</p>
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
  const [pending, setPending] = useState(null) // 검사를 통과한 백업 (확인 후 적용)

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
      let data
      try {
        data = JSON.parse(reader.result)
      } catch {
        setMsg('파일이 손상됐거나 JSON 형식이 아니에요. 지금 데이터는 그대로예요.')
        e.target.value = ''
        return
      }
      const check = validateBackup(data)
      if (!check.ok) setMsg(`${check.error} 지금 데이터는 그대로예요.`)
      else setPending({ data, summary: check.summary })
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
      <ConfirmDialog open={!!pending} message={pending && `지금 데이터를 백업 내용으로 바꿀까요? ${pending.summary}`}
        onConfirm={() => { dispatch({ type: 'IMPORT_ALL', payload: pending.data }); setPending(null); setMsg('백업을 불러왔어요.') }}
        onCancel={() => { setPending(null); setMsg('불러오기를 취소했어요.') }} />
      <ConfirmDialog open={confirmReset} message="모든 데이터를 지울까요? 되돌릴 수 없어요."
        onConfirm={() => { dispatch({ type: 'RESET_ALL' }); setConfirmReset(false); setMsg('초기화했어요.') }}
        onCancel={() => setConfirmReset(false)} />
    </div>
  )
}

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const { settings } = state
  const { logout, minutesLeft } = useAdmin()
  const [notice, setNotice] = useState('')
  const save = (payload, text) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload })
    setNotice(text)
  }

  return (
    <section>
      <PageHeader title="설정" description="매장 정보, 근무자 권한, 분쇄도·추출 기준, 쿠폰 기준을 정해요." />
      <div className="admin-bar">
        <span>🔓 관리자 모드 · 손대지 않으면 {minutesLeft}분 뒤 자동으로 끝나요</span>
        <button className="btn" onClick={logout}>관리자 모드 끝내기</button>
      </div>
      {notice && <p className="notice">✓ {notice}</p>}
      <div className="card store-summary">
        <h2>우리 매장</h2>
        <p><strong>{settings.store.name || '이름 없음'}</strong> · 머신 {settings.store.machine || '-'} · 그라인더 {settings.store.grinder || '-'}</p>
        <Link className="btn" to="/setup">매장 시작 설정 다시 하기</Link>
      </div>
      <div className="card form" style={{ marginBottom: 16 }}>
        <h2>배경 사진</h2>
        <p className="muted">홈 화면과 각 페이지 위쪽에 보여요. 우리 매장 사진을 올려도 돼요.</p>
        <PhotoPicker onDone={() => setNotice('배경 사진을 바꿨어요.')} />
      </div>
      <div className="grid half">
        <StaffSetting staff={state.staff} dispatch={dispatch} />
        <LocationSetting location={settings.location} onSave={(location) => save({ location }, `매장 위치를 ${location.name}(으)로 바꿨어요.`)} />
        <HoursSetting key={`h-${settings.businessHours.open}-${settings.businessHours.close}`} value={settings.businessHours} onSave={(businessHours) => save({ businessHours }, `영업 시간을 ${businessHours.open}시~${businessHours.close}시로 저장했어요.`)} />
        <RewardSetting key={settings.rewardThreshold} value={settings.rewardThreshold} onSave={(rewardThreshold) => save({ rewardThreshold }, '쿠폰 기준을 저장했어요.')} />
        <StockSetting key={settings.shortageRate} value={settings.shortageRate} onSave={(shortageRate) => save({ shortageRate }, '재고 부족 경고 기준을 저장했어요.')} />
        <GrindSetting key={JSON.stringify(settings.grind)} grind={settings.grind} onSave={(grind) => save({ grind }, '분쇄도 기준값을 저장했어요. 추천값에 바로 반영돼요.')} />
        <ExtractSetting key={`ex-${settings.grind.targetDose}-${settings.grind.targetYield}-${settings.grind.yieldUnit}`} grind={settings.grind} onSave={(grind) => save({ grind }, '추출 기준을 저장했어요. 다음 샷 기록부터 이 값이 채워져요.')} />
        <BackupPanel state={state} dispatch={dispatch} />
      </div>
    </section>
  )
}
