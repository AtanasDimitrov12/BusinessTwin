import { useId } from 'react'
import { typedNumberError } from '../../lib/numberInput'
import type { EstimateForm } from './changeForm'

const cases = [
  { key: 'pessimistic', label: 'Pessimistic', bar: 'bg-bad' },
  { key: 'expected', label: 'Expected', bar: 'bg-accent' },
  { key: 'optimistic', label: 'Optimistic', bar: 'bg-good' },
] as const

/** One uncertain estimate entered as three values. The model runs once per case. */
export function EstimateRow({
  label,
  hint,
  unit,
  value,
  onChange,
  signed = false,
}: {
  label: string
  hint?: string
  unit?: string
  /** Negative values allowed (e.g. fewer visits). iOS decimal keypads have no minus key, so these get a full keyboard. */
  signed?: boolean
  value: EstimateForm
  onChange: (value: EstimateForm) => void
}) {
  const id = useId()
  const errors = cases.map((c) => typedNumberError(value[c.key], { allowNegative: signed }))
  const firstError = errors.find(Boolean)
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      {hint && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
      <div className="grid grid-cols-3 gap-2">
        {cases.map((c, i) => (
          <div
            key={c.key}
            className={`overflow-hidden rounded-[14px] border bg-surface ${errors[i] ? 'border-bad' : 'border-black/[0.12]'} transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15`}
          >
            <div className={`h-1 ${c.bar}`} aria-hidden />
            <label htmlFor={`${id}-${c.key}`} className="block px-2.5 pt-1.5 text-xs font-semibold text-muted">
              {c.label}
            </label>
            <div className="flex items-baseline px-2.5 pb-1.5">
              <input
                id={`${id}-${c.key}`}
                inputMode={signed ? 'text' : 'decimal'}
                value={value[c.key]}
                aria-invalid={errors[i] ? true : undefined}
                aria-describedby={errors[i] ? `${id}-error` : undefined}
                onChange={(e) => onChange({ ...value, [c.key]: e.target.value })}
                className="w-full min-w-0 bg-transparent font-mono text-base text-ink focus:outline-none"
              />
              {unit && <span className="ml-1 text-xs text-muted">{unit}</span>}
            </div>
          </div>
        ))}
      </div>
      {firstError && (
        <p id={`${id}-error`} className="text-xs font-medium text-bad">
          {firstError}
        </p>
      )}
    </fieldset>
  )
}
