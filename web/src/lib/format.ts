/**
 * Display formatting for decimal strings from the API.
 * Intl.NumberFormat formats numeric strings exactly, so no money ever passes through JavaScript
 * number arithmetic. Never parse these values to calculate with them: calculations belong to the API.
 */
type DecimalString = `${number}`

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })
const euroWhole = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const count = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat('nl-NL', { style: 'percent', maximumFractionDigits: 0 })

export const formatEuro = (value: string) => euro.format(value as DecimalString)
export const formatEuroWhole = (value: string) => euroWhole.format(value as DecimalString)
export const formatCount = (value: string) => count.format(value as DecimalString)
export const formatPercent = (value: string) => percent.format(value as DecimalString)

/** True when a decimal string is zero ("0", "0.00", "-0"). Checked on the text, not as a float. */
export const isZero = (value: string) => /^-?0*(\.0*)?$/.test(value.trim())

/** True when a decimal string is below zero, by its sign. */
export const isNegative = (value: string) => value.trim().startsWith('-') && !isZero(value)
