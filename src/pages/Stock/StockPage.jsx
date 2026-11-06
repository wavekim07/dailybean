import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { toDateStr } from '../../utils/date.js'
import { usageRows } from '../../utils/stockCalc.js'
import DailyCountForm from './DailyCountForm.jsx'
import UsageTable from './UsageTable.jsx'
import ItemsPanel from './ItemsPanel.jsx'
import Guard from '../../components/auth/Guard.jsx'
import { usePermission } from '../../context/AdminContext.jsx'

// 재고 화면 하나로 합침: 위는 품목 목록(줄마다 입고·수량 입력), 아래는 가끔 여는 '마감 실사 한 번에'와 '날짜별 기록'
export default function StockPage({ embedded = false }) {
  const { state, dispatch } = useApp()
  const { can } = usePermission()
  const { items, stockIns, counts, settings } = state
  const [date, setDate] = useState(toDateStr())
  const [panel, setPanel] = useState(null) // null | 'count' | 'log'

  const rows = useMemo(() => usageRows(items, stockIns, counts, date, settings.shortageRate), [items, stockIns, counts, date, settings.shortageRate])
  const dayIns = stockIns.filter((s) => s.date === date)
  const nameOf = (id) => items.find((i) => i.id === id)?.name ?? '(삭제된 품목)'
  const toggle = (p) => setPanel((v) => (v === p ? null : p))

  return (
    <section>
      {!embedded && <PageHeader photo title="재고" description="품목과 현재 재고를 관리하고, 입고와 마감 재고를 기록해요." />}
      <ItemsPanel />

      {items.length > 0 && (
        <Guard perm="stock">
          <div className="stock-more">
            <button className={`btn ${panel === 'count' ? 'primary' : ''}`} onClick={() => toggle('count')}>마감 재고 한 번에 입력</button>
            <button className={`btn ${panel === 'log' ? 'primary' : ''}`} onClick={() => toggle('log')}>날짜별 입고·사용량</button>
            {panel && (
              <label className="inline">
                날짜
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
            )}
          </div>

          {panel === 'count' && (
            <DailyCountForm
              key={date + items.length}
              date={date}
              items={items}
              counts={counts}
              onSubmit={(quantities) => dispatch({ type: 'SAVE_DAILY_COUNT', payload: { date, quantities } })}
            />
          )}

          {panel === 'log' && (
            <div className="two-col">
              <div className="card">
                <h2>{date} 입고</h2>
                {dayIns.length === 0 ? <p className="muted">이 날 입고 기록이 없어요.</p> : (
                  <ul className="list plain">
                    {dayIns.map((s) => (
                      <li key={s.id} className="list-row compact">
                        <span>
                          {nameOf(s.itemId)} +{s.qty}
                          {s.roastDate && <span className="muted"> · 로스팅 {s.roastDate}</span>}
                          {s.orderId && <span className="muted"> · 발주</span>}
                        </span>
                        {can('stock') && <button className="btn danger" onClick={() => dispatch({ type: 'DELETE_STOCK_IN', payload: s.id })}>삭제</button>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <UsageTable rows={rows} />
            </div>
          )}
        </Guard>
      )}
    </section>
  )
}
