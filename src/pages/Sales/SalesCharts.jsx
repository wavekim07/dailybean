import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { manwon, won } from '../../utils/format.js'

const CARD = '#6f4e37'
const CASH = '#d4a373'

export function SalesBarChart({ rows }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee4d8" />
          {/* 날짜를 모두 보이게: 칸이 많으면 기울여서 겹치지 않게 */}
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={rows.length > 7 ? -45 : 0} textAnchor={rows.length > 7 ? 'end' : 'middle'} height={rows.length > 7 ? 48 : 28} />
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

// 그 달 시간대별 평균: 가장 바쁜 시간대는 진하게
export function HourlyAvgChart({ rows, days }) {
  if (!days) return <p className="muted">이 달에 시간대별 금액을 넣은 날이 없어요. 매출 입력에서 "시간대별 금액 넣기"를 눌러 포스기 숫자를 옮겨 적으면 보여요.</p>
  const max = Math.max(...rows.map((r) => r.avg))
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee4d8" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={rows.length > 10 ? -45 : 0} textAnchor={rows.length > 10 ? 'end' : 'middle'} height={rows.length > 10 ? 40 : 24} />
          <YAxis tickFormatter={manwon} tick={{ fontSize: 11 }} width={44} />
          <Tooltip formatter={(v) => [won(v), '하루 평균']} labelFormatter={(_l, p) => p?.[0]?.payload.range ?? ''} />
          <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
            {rows.map((r) => <Cell key={r.hour} fill={r.avg === max && max > 0 ? CARD : CASH} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
