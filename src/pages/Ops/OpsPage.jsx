import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import StockPage from '../Stock/StockPage.jsx'
import Checklist from './Checklist.jsx'
import Handoff from './Handoff.jsx'
import OrderList from './OrderList.jsx'
import Guard from '../../components/auth/Guard.jsx'

const TABS = [
  { id: 'today', label: '오늘 (체크·인수인계)' },
  { id: 'stock', label: '재고' },
  { id: 'order', label: '발주' },
]

// 운영: 하루 매장 운영(오픈·마감 확인, 인수인계, 재고, 발주)을 한곳에
export default function OpsPage() {
  const [params, setParams] = useSearchParams()
  // 예전 주소 ?tab=handoff는 '오늘' 탭으로 (오픈·마감 체크와 인수인계를 한 화면으로 합침)
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'today'
  return (
    <section>
      <PageHeader photo title="운영" description="오픈·마감 확인, 인수인계, 재고, 발주를 한곳에서 관리해요." />
      <div className="tabs page-tabs">
        {TABS.map((t) => <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setParams({ tab: t.id })}>{t.label}</button>)}
      </div>
      {tab === 'today' && <div className="eq-row"><Checklist /><Handoff /></div>}
      {tab === 'stock' && <StockPage embedded />}
      {tab === 'order' && <Guard perm="orders"><OrderList /></Guard>}
    </section>
  )
}
