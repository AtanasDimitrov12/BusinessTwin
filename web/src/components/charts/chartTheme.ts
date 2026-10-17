/** Chart colours, matching the design tokens in index.css. */
export const chartColors = {
  navy: '#1b3d6e',
  navySoft: '#c5d5ec',
  amber: '#c8652a',
  good: '#2d7a4f',
  bad: '#b8392a',
  grid: '#ede9e3',
  axis: '#8f8981',
  ink: '#1c1a17',
}

export const axisProps = {
  tick: { fontSize: 11, fill: chartColors.axis },
  axisLine: false,
  tickLine: false,
} as const

/** Compact euro ticks for axes (€12k). Axis ticks are geometry, so a plain number is fine here. */
export const euroTick = (v: number) =>
  `${v < 0 ? '−' : ''}€${new Intl.NumberFormat('en-IE', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.abs(v))}`
