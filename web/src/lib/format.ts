/**
 * Display helpers for decimal strings from the API.
 *
 * Rule: the browser never calculates money. Intl.NumberFormat formats numeric strings exactly, and sign
 * checks look at the text. The only number conversion is `toPlot`, used for chart geometry and nothing else.
 */
type DecimalString = `${number}`

const locale = 'en-IE' // English with euro conventions: €12,000.50
const euro = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })
const euroWhole = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const count = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
const countPrecise = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
const hours = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })

const fmt = (f: Intl.NumberFormat, value: string) => f.format(value.trim() as DecimalString)

export const isZero = (value: string) => /^-?0*(\.0*)?$/.test(value.trim())
export const isNegative = (value: string) => value.trim().startsWith('-') && !isZero(value)
export const isPositive = (value: string) => !isNegative(value) && !isZero(value)
const abs = (value: string) => value.trim().replace(/^-/, '')

/** €1,234.50 */
export const formatEuro = (value: string) => fmt(euro, value)
/** €1,235 (rounded for headline figures) */
export const formatEuroWhole = (value: string) => fmt(euroWhole, value)
/** +€1,235 / −€1,235 / €0, for differences */
export const formatEuroDelta = (value: string) =>
  `${isNegative(value) ? '−' : isPositive(value) ? '+' : ''}${fmt(euroWhole, abs(value))}`
/** 1,234 */
export const formatCount = (value: string) => fmt(count, value)
/** 12.5 (one decimal, e.g. hours) */
export const formatCountPrecise = (value: string) => fmt(countPrecise, value)
/** +12 / −12, for differences in visits */
export const formatCountDelta = (value: string) =>
  `${isNegative(value) ? '−' : isPositive(value) ? '+' : ''}${fmt(count, abs(value))}`
/** 1.25 (hours, up to two decimals) */
export const formatHours = (value: string) => fmt(hours, value)
/** A fraction from the API (0.83) as 83% */
export const formatPercent = (value: string) => fmt(percent, value)
/** A percentage the owner entered (−5) as −5% */
export const formatPercentPoints = (value: string) =>
  `${isNegative(value) ? '−' : isPositive(value) ? '+' : ''}${fmt(countPrecise, abs(value))}%`

/** Chart geometry only: bar heights and line positions. Labels always use the original string. */
export const toPlot = (value: string) => Number(value)
