/**
 * Reading numbers as owners type them. The result is a plain decimal string for the API; no arithmetic happens here.
 *
 * Dutch owners write "9.000" for nine thousand, English writing uses "9,000". Both used to be read as 9, because a
 * comma is accepted as the decimal separator. A separator followed by exactly three digits is therefore treated as
 * ambiguous and rejected with a suggestion, instead of silently saving a value a thousand times too small.
 */
export type ParsedNumber = { ok: true; value: string } | { ok: false; error: string }

export interface NumberRules {
  allowNegative?: boolean
  /** 2 for euros; more for small quantities such as hours per visit. */
  maxDecimals?: number
  /** A value that is never in the thousands (time per visit): "1.125" is a decimal, not a thousands separator. */
  small?: boolean
}

export function parseTypedNumber(raw: string, { allowNegative = false, maxDecimals = 2, small = false }: NumberRules = {}): ParsedNumber {
  // Accept the typographic minus (shown in hints, e.g. "−5") and a leading plus.
  const text = raw.trim().replace(/^[−–]/, '-').replace(/^\+/, '')
  if (text === '') return { ok: false, error: 'Enter a number.' }

  if (!small && /^-?[1-9]\d{0,2}([.,]\d{3})+$/.test(text)) {
    const whole = text.replace(/[.,]/g, '')
    return { ok: false, error: `Write ${whole} without a dot or comma between the thousands (or use at most two decimals).` }
  }
  if (/\s/.test(text) || /^-?\d{1,3}([.,]\d{3}){1,}[.,]\d+$/.test(text)) {
    return { ok: false, error: 'Write the number without spaces or thousands separators, e.g. 9000.50.' }
  }
  if (!/^-?\d+([.,]\d+)?$/.test(text)) {
    return { ok: false, error: allowNegative ? 'Enter a number, e.g. 2000 or -500.' : 'Enter a number, e.g. 40.50.' }
  }
  if (!allowNegative && text.startsWith('-')) return { ok: false, error: 'Use a number of zero or more.' }

  const value = text.replace(',', '.')
  const decimals = value.split('.')[1]?.length ?? 0
  if (decimals > maxDecimals) return { ok: false, error: `Use at most ${maxDecimals} decimals.` }
  return { ok: true, value }
}

/** The error to show under a field, or undefined. Empty fields are not flagged while the owner is still typing. */
export function typedNumberError(raw: string, rules?: NumberRules): string | undefined {
  if (raw.trim() === '') return undefined
  const r = parseTypedNumber(raw, rules)
  return r.ok ? undefined : r.error
}
