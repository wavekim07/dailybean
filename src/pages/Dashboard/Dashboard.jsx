import PageHeader from '../../components/common/PageHeader.jsx'
import { useApp } from '../../context/AppContext.jsx'

export default function Dashboard() {
  const { state } = useApp()
  const { settings, items, shots, sales, customers } = state

  const summary = [
    { label: '등록 품목', value: items.length },
    { label: '샷 기록', value: shots.length },
    { label: '매출 기록', value: sales.length },
    { label: '고객', value: customers.length },
  ]

  return (
    <section>
      <PageHeader title="오늘의 데일리빈" description={`${settings.location.name} 매장 기준`} />
      <div className="grid">
        <div className="card">
          <h2>오늘 추천 분쇄도</h2>
          <p className="big">{settings.grind.base.toFixed(1)}</p>
          <p className="muted">날씨 연동 전 기준값이에요.</p>
        </div>
        {summary.map((s) => (
          <div className="card" key={s.label}>
            <h2>{s.label}</h2>
            <p className="big">{s.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
