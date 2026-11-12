import { extractOf } from '../../utils/grindCalc.js'
import { bodyTargetOf } from '../../utils/taste.js'
import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import GrindRecommendCard from '../../components/grind/GrindRecommendCard.jsx'
import { useApp } from '../../context/AppContext.jsx'
import useGrindRecommendation from '../../hooks/useGrindRecommendation.js'
import { judgeTime, latestRoastDate, shotRecommendations } from '../../utils/grindCalc.js'
import { fetchWeatherAt } from '../../utils/weatherApi.js'
import Guard from '../../components/auth/Guard.jsx'
import { usePermission } from '../../context/AdminContext.jsx'
import ShotForm from './ShotForm.jsx'
import ShotList from './ShotList.jsx'
import ShotAverages from './ShotAverages.jsx'

export default function GrindPage() {
  const { state, dispatch } = useApp()
  const { can } = usePermission()
  const { items, shots, stockIns, settings } = state
  const beans = items.filter((i) => i.category === '원두')

  const [beanId, setBeanId] = useState(null)
  const activeBeanId = beanId ?? beans[0]?.id ?? null
  const rec = useGrindRecommendation(activeBeanId)

  const [editingShot, setEditingShot] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState({ from: '', to: '', beanId: '', status: '' })
  const [showFilter, setShowFilter] = useState(false)

  // 이 원두로 가장 최근에 맛 평가를 남긴 샷 (추천 카드에 "지난 샷 맛"으로 보여 줌)
  const lastTasted = [...shots].filter((s) => s.beanId === activeBeanId && s.taste).sort((a, b) => b.datetime.localeCompare(a.datetime))[0] || null
  const beanName = (id) => items.find((i) => i.id === id)?.name ?? '(삭제된 원두)'

  // 저장할 때 그 시각 날씨를 API로 가져와 함께 저장하고, 날씨 기반 추천값도 기록 (나중에 보정에 사용)
  const handleSubmit = async (data) => {
    setSaving(true)
    setNotice('')
    const { lat, lon } = settings.location
    let weather = editingShot?.datetime === data.datetime ? editingShot.weather : null
    if (!weather) {
      try {
        weather = await fetchWeatherAt(lat, lon, data.datetime)
      } catch {
        setNotice('날씨를 못 불러와서 날씨 없이 저장했어요.')
      }
    }
    const roastDate = latestRoastDate(stockIns.filter((s) => s.date <= data.datetime.slice(0, 10)), data.beanId)
    // 어떤 그라인더로 맞춘 기록인지 남겨서, 그라인더별 평균과 보정에 씀
    const grinder = editingShot?.grinder ?? settings.store.grinder ?? ''
    // 추천값 두 가지(날씨 기준값·화면에 보여 준 값)를 따로 저장. 계산 규칙은 grindCalc.js의 shotRecommendations
    const { baseRecommended, recommended } = shotRecommendations({ data, editingShot, weather, shots, grind: settings.grind, roastDate, grinder })
    const payload = { ...data, weather, baseRecommended, recommended, grinder }
    if (editingShot) {
      dispatch({ type: 'UPDATE_SHOT', payload: { ...payload, id: editingShot.id } })
      setEditingShot(null)
    } else {
      dispatch({ type: 'ADD_SHOT', payload })
    }
    setSaving(false)
    return true
  }

  const filtered = useMemo(
    () =>
      shots
        .filter((s) => !filter.from || s.datetime.slice(0, 10) >= filter.from)
        .filter((s) => !filter.to || s.datetime.slice(0, 10) <= filter.to)
        .filter((s) => !filter.beanId || s.beanId === filter.beanId)
        .filter((s) => !filter.status || judgeTime(s.time, settings.grind.targetTime, settings.grind.higherIsFiner).status === filter.status)
        .sort((a, b) => b.datetime.localeCompare(a.datetime)),
    [shots, filter, settings.grind.targetTime, settings.grind.higherIsFiner],
  )

  const setF = (e) => setFilter((p) => ({ ...p, [e.target.name]: e.target.value }))

  return (
    <section>
      <PageHeader photo title="분쇄도" description="오늘 날씨와 원두 숙성도로 분쇄도를 추천하고 샷을 기록해요." />
      {/* PC: 왼쪽 추천 카드, 오른쪽 넓게 샷 기록(맛 지도가 평가 옆에 들어감). 아래에 평균과 기록 목록 */}
      <div className="grind-layout">
          <GrindRecommendCard rec={rec} beans={beans} beanId={activeBeanId} onBeanChange={setBeanId} base={settings.grind.base} higherIsFiner={settings.grind.higherIsFiner !== false} grinder={settings.store.grinder} extract={extractOf(settings.grind)} targetTime={settings.grind.targetTime}
            targetBody={bodyTargetOf(items.find((i) => i.id === activeBeanId))} lastTasted={lastTasted} yieldStep={Number(settings.grind.yieldStep ?? 2)} />
          <Guard perm="shots">
          <ShotForm
            key={editingShot?.id ?? `new-${activeBeanId}-${rec.weather ? 'w' : 'n'}`}
            beans={beans}
            defaultBeanId={activeBeanId}
            suggestedGrind={rec.weather ? String(rec.value) : ''}
            editingShot={editingShot}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={() => setEditingShot(null)}
            targetTime={settings.grind.targetTime}
            higherIsFiner={settings.grind.higherIsFiner !== false}
            extract={extractOf(settings.grind)}
            targetBodyOf={(id) => bodyTargetOf(items.find((i) => i.id === id)).value}
            yieldStep={Number(settings.grind.yieldStep ?? 2)}
          />
          </Guard>
      </div>
      {notice && <p className="muted">{notice}</p>}
        <div className="grind-records">
          <div className="list-head">
            <h2>샷 기록</h2>
            <button className="btn" onClick={() => setShowFilter((v) => !v)}>{showFilter ? '검색 닫기' : '검색'}</button>
          </div>
          {showFilter && <div className="card form filters">
            <div className="row">
              <label>시작일<input className="input" type="date" name="from" value={filter.from} onChange={setF} /></label>
              <label>종료일<input className="input" type="date" name="to" value={filter.to} onChange={setF} /></label>
            </div>
            <div className="row">
              <label>
                원두
                <select className="input" name="beanId" value={filter.beanId} onChange={setF}>
                  <option value="">전체</option>
                  {beans.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label>
                추출 상태
                <select className="input" name="status" value={filter.status} onChange={setF}>
                  <option value="">전체</option>
                  <option value="fast">빠름</option>
                  <option value="ok">적정</option>
                  <option value="slow">느림</option>
                </select>
              </label>
            </div>
          </div>}
          <ShotAverages shots={shots} beanName={beanName} grinder={settings.store.grinder} extract={extractOf(settings.grind)} targetTime={settings.grind.targetTime} />
          <p className="muted count">{filtered.length}개 / 전체 {shots.length}개</p>
          <ShotList shots={filtered} beanName={beanName} targetTime={settings.grind.targetTime} higherIsFiner={settings.grind.higherIsFiner} unit={extractOf(settings.grind).unit} onEdit={can('shots') ? setEditingShot : undefined} onDelete={can('shots') ? setDeleteTarget : undefined} />
        </div>
      <ConfirmDialog
        open={!!deleteTarget}
        message="이 샷 기록을 삭제할까요?"
        onConfirm={() => { dispatch({ type: 'DELETE_SHOT', payload: deleteTarget.id }); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
