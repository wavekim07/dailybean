import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { manwon, won } from '../../utils/format.js'

const CARD = '#6f4e37'
const CASH = '#d4a373'

export function SalesBarChart({ rows }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee4d8" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tickFormatter={manwon} tick={{ fontSize: 11 }} width={44} />
          <Tooltip formatter={(v) => won(v)} />
          <Legend />
          <Bar dataKey="card" name="카드" stackId="a" fill={CARD} />
          <Bar dataKey="cash" name="현금" stackId="a" fill={CASH} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PaymentPieChart({ card, cash }) {
  if (card + cash === 0) return <p className="muted">이 기간 매출이 없어요.</p>
  const data = [
    { name: '카드', value: card },
    { name: '현금', value: cash },
  ]
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" isAnimationActive={false} innerRadius={50} outerRadius={80} label={({ percent }) => `${Math.round(percent * 100)}%`}>
            <Cell fill={CARD} />
            <Cell fill={CASH} />
          </Pie>
          <Tooltip formatter={(v) => won(v)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function WeatherSalesChart({ rows }) {
  if (rows.every((r) => r.days === 0)) return <p className="muted">날씨가 기록된 매출이 쌓이면 보여드려요.</p>
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee4d8" />
          <XAxis type="number" tickFormatter={manwon} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
          <Tooltip formatter={(v, _n, item) => [`${won(v)} (${item.payload.days}일)`, '하루 평균']} />
          <Bar dataKey="avg" fill={CARD} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
