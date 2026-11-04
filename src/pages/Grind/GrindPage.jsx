import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import GrindRecommendCard from '../../components/grind/GrindRecommendCard.jsx'
import { useApp } from '../../context/AppContext.jsx'
import useGrindRecommendation from '../../hooks/useGrindRecommendation.js'
import { calcGrind, judgeTime, latestRoastDate } from '../../utils/grindCalc.js'
import { fetchWeatherAt } from '../../utils/weatherApi.js'
import ShotForm from './ShotForm.jsx'
import ShotList from './ShotList.jsx'
import ShotAverages from './ShotAverages.jsx'

export default function GrindPage() {
  const { state, dispatch } = useApp()
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
    const recommended = weather ? calcGrind(weather, settings.grind, { roastDate, onDate: data.datetime.slice(0, 10) }).value : null
    // 어떤 그라인더로 맞춘 기록인지 남겨서, 그라인더별 평균과 보정에 씀
    const grinder = editingShot?.grinder ?? settings.store.grinder ?? ''
    const payload = { ...data, weather, recommended, grinder }
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
      <div className="two-col">
        <div className="stack">
          <GrindRecommendCard rec={rec} beans={beans} beanId={activeBeanId} onBeanChange={setBeanId} base={settings.grind.base} higherIsFiner={settings.grind.higherIsFiner !== false} grinder={settings.store.grinder} />
          <ShotForm
            key={editingShot?.id ?? `new-${activeBeanId}-${rec.weather ? 'w' : 'n'}`}
            beans={beans}
            defaultBeanId={activeBeanId}
            suggestedGrind={rec.weather ? String(rec.value) : ''}
            editingShot={editingShot}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={() => setEditingShot(null)}
          />
          {notice && <p className="muted">{notice}</p>}
        </div>
        <div>
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
          <ShotAverages shots={shots} beanName={beanName} grinder={settings.store.grinder} />
          <p className="muted count">{filtered.length}개 / 전체 {shots.length}개</p>
          <ShotList shots={filtered} beanName={beanName} targetTime={settings.grind.targetTime} higherIsFiner={settings.grind.higherIsFiner} onEdit={setEditingShot} onDelete={setDeleteTarget} />
        </div>
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
