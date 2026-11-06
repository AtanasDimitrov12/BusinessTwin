/** Chart colours, matching the design tokens in index.css. */
export const chartColors = {
  accent: '#0071e3',
  accentSoft: '#b4d3f5',
  amber: '#f56300',
  good: '#28a745',
  bad: '#e0262f',
  grid: '#ececf0',
  axis: '#86868b',
  ink: '#1d1d1f',
}

export const axisProps = {
  tick: { fontSize: 11, fill: chartColors.axis },
  axisLine: false,
  tickLine: false,
} as const

/** Compact euro ticks for axes (€12k). Axis ticks are geometry, so a plain number is fine here. */
export const euroTick = (v: number) =>
  `${v < 0 ? '−' : ''}€${new Intl.NumberFormat('en-IE', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.abs(v))}`
