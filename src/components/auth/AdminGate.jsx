import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import { hashSecret, recoveryCode, verifySecret } from '../../utils/auth.js'

const MIN_LEN = 8
const MAX_TRY = 5
const LOCK_MS = 60 * 1000

// 관리자만 볼 수 있는 화면을 감싸요. 관리자가 없으면 만들고, 있으면 비밀번호를 물어요.
export default function AdminGate({ children, title = '관리자 전용' }) {
  const { isAdmin, hasAdmin } = useAdmin()
  const [shownCode, setShownCode] = useState(null) // 관리자를 만든 직후 복구 코드를 한 번 보여 줌
  if (shownCode) return <RecoveryShown code={shownCode} onDone={() => setShownCode(null)} />
  if (isAdmin) return children
  return (
    <section className="gate">
      <div className="card form gate-card">
        <h2>🔒 {title}</h2>
        {hasAdmin ? <LoginForm onReset={setShownCode} /> : <CreateForm onCreated={setShownCode} />}
      </div>
    </section>
  )
}

function PasswordPair({ pw, setPw, pw2, setPw2 }) {
  return (
    <>
      <label>비밀번호 ({MIN_LEN}자 이상)<input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <label>비밀번호 확인<input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
    </>
  )
}

const checkPair = (pw, pw2) => (pw.length < MIN_LEN ? `비밀번호는 ${MIN_LEN}자 이상으로 정해 주세요.` : pw !== pw2 ? '두 비밀번호가 달라요.' : '')

// 처음: 관리자 비밀번호 만들기
function CreateForm({ onCreated }) {
  const { dispatch } = useApp()
  const { enter } = useAdmin()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    const err = checkPair(pw, pw2)
    if (err) return setMsg(err)
    setBusy(true)
    const code = recoveryCode()
    const [secret, recovery] = await Promise.all([hashSecret(pw), hashSecret(code)])
    dispatch({ type: 'SET_ADMIN', payload: { ...secret, recovery, createdAt: new Date().toISOString() } })
    enter()
    setBusy(false)
    onCreated(code)
  }
  return (
    <form className="form" onSubmit={submit}>
      <p className="muted">설정은 관리자만 바꿀 수 있어요. 아직 관리자가 없어서, 지금 비밀번호를 정하면 이 기기의 관리자가 돼요. 비밀번호는 그대로 저장하지 않고 되돌릴 수 없게 섞은 값(해시)만 저장해요.</p>
      <PasswordPair pw={pw} setPw={(v) => { setPw(v); setMsg('') }} pw2={pw2} setPw2={(v) => { setPw2(v); setMsg('') }} />
      {msg && <p className="error">{msg}</p>}
      <div className="actions"><button className="btn primary" type="submit" disabled={busy}>{busy ? '만드는 중…' : '관리자 만들기'}</button></div>
    </form>
  )
}

// 관리자 로그인 + 비밀번호를 잊었을 때 복구 코드로 다시 정하기
function LoginForm({ onReset }) {
  const { state, dispatch } = useApp()
  const { login, enter } = useAdmin()
  const [mode, setMode] = useState('login')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [fails, setFails] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)

  const locked = () => {
    const left = lockedUntil - Date.now()
    if (left > 0) { setMsg(`${MAX_TRY}번 틀려서 잠겼어요. ${Math.ceil(left / 1000)}초 뒤에 다시 해 주세요.`); return true }
    return false
  }
  const fail = (text) => {
    const n = fails + 1
    setFails(n)
    if (n >= MAX_TRY) { setLockedUntil(Date.now() + LOCK_MS); setFails(0); setMsg(`${MAX_TRY}번 틀려서 1분 동안 잠겼어요.`) } else setMsg(`${text} (${n}/${MAX_TRY})`)
  }

  const submitLogin = async (e) => {
    e.preventDefault()
    if (locked() || !pw) return
    setBusy(true)
    const ok = await login(pw)
    setBusy(false)
    if (!ok) { setPw(''); fail('비밀번호가 달라요.') }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    if (locked()) return
    const err = checkPair(pw, pw2)
    if (err) return setMsg(err)
    setBusy(true)
    const ok = await verifySecret(code.trim().toUpperCase(), state.auth.admin.recovery)
    if (!ok) { setBusy(false); return fail('복구 코드가 달라요.') }
    const next = recoveryCode()
    const [secret, recovery] = await Promise.all([hashSecret(pw), hashSecret(next)])
    dispatch({ type: 'SET_ADMIN', payload: { ...state.auth.admin, ...secret, recovery } })
    enter()
    setBusy(false)
    onReset(next) // 쓴 복구 코드는 버리고 새 코드를 보여 줌
  }

  if (mode === 'reset') {
    return (
      <form className="form" onSubmit={submitReset}>
        <p className="muted">관리자를 만들 때 받은 복구 코드를 넣고 새 비밀번호를 정해요.</p>
        <label>복구 코드<input className="input" value={code} onChange={(e) => { setCode(e.target.value); setMsg('') }} placeholder="XXXX-XXXX-XXXX" autoCapitalize="characters" /></label>
        <PasswordPair pw={pw} setPw={(v) => { setPw(v); setMsg('') }} pw2={pw2} setPw2={(v) => { setPw2(v); setMsg('') }} />
        {msg && <p className="error">{msg}</p>}
        <div className="actions">
          <button type="button" className="btn" onClick={() => { setMode('login'); setMsg('') }}>돌아가기</button>
          <button className="btn primary" type="submit" disabled={busy}>{busy ? '확인 중…' : '새 비밀번호 저장'}</button>
        </div>
      </form>
    )
  }
  return (
    <form className="form" onSubmit={submitLogin}>
      <p className="muted">설정은 관리자만 바꿀 수 있어요. 관리자 모드는 10분 동안 손대지 않으면 자동으로 끝나요.</p>
      <label>관리자 비밀번호<input className="input" type="password" autoComplete="current-password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setMsg('') }} /></label>
      {msg && <p className="error">{msg}</p>}
      <div className="actions">
        <button type="button" className="link-btn" onClick={() => { setMode('reset'); setPw(''); setMsg('') }}>비밀번호를 잊었어요</button>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? '확인 중…' : '관리자 로그인'}</button>
      </div>
    </form>
  )
}

function RecoveryShown({ code, onDone }) {
  const [ok, setOk] = useState(false)
  return (
    <section className="gate">
      <div className="card form gate-card">
        <h2>복구 코드를 적어 두세요</h2>
        <p className="muted">관리자 비밀번호를 잊었을 때 이 코드로 새 비밀번호를 정할 수 있어요. 코드는 지금 한 번만 보여요. 앱에도 해시로만 저장돼서 다시 볼 수 없어요.</p>
        <p className="recovery-code">{code}</p>
        <label className="inline"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> 안전한 곳에 적어 뒀어요</label>
        <div className="actions"><button className="btn primary" disabled={!ok} onClick={onDone}>설정으로 가기</button></div>
      </div>
    </section>
  )
}
