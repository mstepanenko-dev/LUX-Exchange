import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function PortfolioChart({ snapshots, range = '24h' }) {
  if (snapshots.length < 2) {
    return <p className="history-empty">Portfolio history will appear as your account activity is recorded.</p>
  }

  const data = snapshots.map((snapshot) => ({
    ...snapshot,
    time: new Date(snapshot.createdAt).getTime(),
  }))

  const formatGBP = (value) => new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

  const formatCompactGBP = (value) => {
    const number = Number(value || 0)
    const absoluteValue = Math.abs(number)
    const suffix = absoluteValue >= 1000000 ? 'M' : absoluteValue >= 1000 ? 'k' : ''
    const divisor = suffix === 'M' ? 1000000 : suffix === 'k' ? 1000 : 1
    const compactValue = absoluteValue / divisor
    const maximumFractionDigits = suffix ? 1 : 0

    return `${number < 0 ? '-' : ''}£${compactValue.toFixed(maximumFractionDigits).replace(/\.0$/, '')}${suffix}`
  }

  const formatDate = (value) => new Intl.DateTimeFormat('en-GB', range === '24h'
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short' }).format(new Date(value))

  const formatTooltipDate = (value) => new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

  return (
    <div className="portfolio-chart" role="img" aria-label="Portfolio value history chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9b76ff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#9b76ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#302c3b" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatDate} stroke="#777183" tickLine={false} axisLine={false} minTickGap={36} />
          <YAxis tickFormatter={formatCompactGBP} stroke="#777183" tickLine={false} axisLine={false} width={64} />
          <Tooltip
            labelFormatter={formatTooltipDate}
            formatter={(value) => [formatGBP(value), 'Portfolio value']}
            contentStyle={{ border: '1px solid #4e3c7c', borderRadius: '4px', color: '#f4f0ff', background: '#17151f' }}
            labelStyle={{ color: '#9590a3' }}
            itemStyle={{ color: '#b49aff' }}
          />
          <Area type="monotone" dataKey="totalGBP" stroke="#a783ff" strokeWidth={2} fill="url(#portfolioFill)" dot={{ fill: '#a783ff', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#c7b5ff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PortfolioChart