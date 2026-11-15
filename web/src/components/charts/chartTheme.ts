/** Chart colours, matching the design tokens in index.css. */
export const chartColors = {
  accent: '#000000',
  accentSoft: '#b9d3f5',
  amber: '#c85a12',
  good: '#00a088',
  bad: '#c9381f',
  grid: '#eceef1',
  axis: '#8a8f98',
  ink: '#000000',
}

export const axisProps = {
  tick: { fontSize: 11, fill: chartColors.axis },
  axisLine: false,
  tickLine: false,
} as const

/** Compact euro ticks for axes (€12k). Axis ticks are geometry, so a plain number is fine here. */
export const euroTick = (v: number) =>
  `${v < 0 ? '−' : ''}€${new Intl.NumberFormat('en-IE', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.abs(v))}`
