import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { toDateStr } from '../../utils/date.js'
import { usageRows } from '../../utils/stockCalc.js'
import StockInForm from './StockInForm.jsx'
import DailyCountForm from './DailyCountForm.jsx'
import UsageTable from './UsageTable.jsx'
import ItemsPanel from './ItemsPanel.jsx'

export default function StockPage() {
  const { state, dispatch } = useApp()
  const { items, stockIns, counts, settings } = state
  const [date, setDate] = useState(toDateStr())
  const [tab, setTab] = useState('items')

  const rows = useMemo(() => usageRows(items, stockIns, counts, date, settings.shortageRate), [items, stockIns, counts, date, settings.shortageRate])
  const dayIns = stockIns.filter((s) => s.date === date)
  const nameOf = (id) => items.find((i) => i.id === id)?.name ?? '(삭제된 품목)'

  return (
    <section>
      <PageHeader photo title="재고" description="품목과 현재 재고를 관리하고, 입고와 마감 실사를 기록해요." />
      <div className="tabs page-tabs">
        <button className={`tab ${tab === 'items' ? 'active' : ''}`} onClick={() => setTab('items')}>품목·현재 재고</button>
        <button className={`tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>입고·마감 실사</button>
      </div>
      {tab === 'items' ? <ItemsPanel /> : (
      <>
      <div className="toolbar">
        <label className="inline">
          기준 날짜
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <div className="two-col">
        <div className="stack">
          <StockInForm items={items} onSubmit={(data) => dispatch({ type: 'ADD_STOCK_IN', payload: data })} />
          {dayIns.length > 0 && (
            <div className="card">
              <h2>{date} 입고</h2>
              <ul className="list plain">
                {dayIns.map((s) => (
                  <li key={s.id} className="list-row compact">
                    <span>
                      {nameOf(s.itemId)} +{s.qty}
                      {s.roastDate && <span className="muted"> · 로스팅 {s.roastDate}</span>}
                    </span>
                    <button className="btn danger" onClick={() => dispatch({ type: 'DELETE_STOCK_IN', payload: s.id })}>삭제</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="stack">
          <DailyCountForm
            key={date + items.length}
            date={date}
            items={items}
            counts={counts}
            onSubmit={(quantities) => dispatch({ type: 'SAVE_DAILY_COUNT', payload: { date, quantities } })}
          />
          <UsageTable rows={rows} />
        </div>
      </div>
      </>
      )}
    </section>
  )
}
