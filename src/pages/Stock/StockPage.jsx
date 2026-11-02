import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { toDateStr } from '../../utils/date.js'
import { usageRows } from '../../utils/stockCalc.js'
import StockInForm from './StockInForm.jsx'
import DailyCountForm from './DailyCountForm.jsx'
import UsageTable from './UsageTable.jsx'

export default function StockPage() {
  const { state, dispatch } = useApp()
  const { items, stockIns, counts } = state
  const [date, setDate] = useState(toDateStr())

  const rows = useMemo(() => usageRows(items, stockIns, counts, date), [items, stockIns, counts, date])
  const dayIns = stockIns.filter((s) => s.date === date)
  const nameOf = (id) => items.find((i) => i.id === id)?.name ?? '(삭제된 품목)'

  return (
    <section>
      <PageHeader title="재고" description="입고를 기록하고 마감 때 남은 재고를 입력해요." />
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
    </section>
  )
}
