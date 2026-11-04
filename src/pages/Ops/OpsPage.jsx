import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import StockPage from '../Stock/StockPage.jsx'
import Checklist from './Checklist.jsx'
import Handoff from './Handoff.jsx'

const TABS = [
  { id: 'today', label: '오픈·마감' },
  { id: 'handoff', label: '인수인계' },
  { id: 'stock', label: '재고' },
]

// 운영: 하루 매장 운영(오픈·마감 확인, 인수인계, 재고)을 한곳에
export default function OpsPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'today'
  return (
    <section>
      <PageHeader photo title="운영" description="오픈·마감 확인, 인수인계, 재고를 한곳에서 관리해요." />
      <div className="tabs page-tabs">
        {TABS.map((t) => <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setParams({ tab: t.id })}>{t.label}</button>)}
      </div>
      {tab === 'today' && <Checklist />}
      {tab === 'handoff' && <Handoff />}
      {tab === 'stock' && <StockPage embedded />}
    </section>
  )
}
