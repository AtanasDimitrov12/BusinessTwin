import { useId } from 'react'
import type { EstimateForm } from './changeForm'

const cases = [
  { key: 'pessimistic', label: 'Pessimistic', bar: 'bg-bad' },
  { key: 'expected', label: 'Expected', bar: 'bg-navy' },
  { key: 'optimistic', label: 'Optimistic', bar: 'bg-good' },
] as const

/** One uncertain estimate entered as three values. The model runs once per case. */
export function EstimateRow({
  label,
  hint,
  unit,
  value,
  onChange,
}: {
  label: string
  hint?: string
  unit?: string
  value: EstimateForm
  onChange: (value: EstimateForm) => void
}) {
  const id = useId()
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      {hint && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
      <div className="grid grid-cols-3 gap-2">
        {cases.map((c) => (
          <div key={c.key} className="overflow-hidden rounded-xl border border-line bg-surface focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/15">
            <div className={`h-1 ${c.bar}`} aria-hidden />
            <label htmlFor={`${id}-${c.key}`} className="block px-2.5 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              {c.label}
            </label>
            <div className="flex items-baseline px-2.5 pb-1.5">
              <input
                id={`${id}-${c.key}`}
                inputMode="decimal"
                value={value[c.key]}
                onChange={(e) => onChange({ ...value, [c.key]: e.target.value })}
                className="w-full min-w-0 bg-transparent font-mono text-base text-ink focus:outline-none"
              />
              {unit && <span className="ml-1 text-xs text-muted">{unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
