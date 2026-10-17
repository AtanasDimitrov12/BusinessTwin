import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode
  hint?: ReactNode
  prefix?: string
  suffix?: string
  error?: string
  aside?: ReactNode
}

/** Labelled input with optional unit prefix/suffix. Works with react-hook-form's `register`. */
export function Field({ label, hint, prefix, suffix, error, aside, className = '', ...input }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const radius = prefix && suffix ? '' : prefix ? 'rounded-r-xl' : suffix ? 'rounded-l-xl' : 'rounded-xl'

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
        </label>
        {aside}
      </div>
      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      <div className="flex">
        {prefix && <Affix side="left">{prefix}</Affix>}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={`w-full min-w-0 border bg-surface px-3 py-2.5 text-sm text-ink transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 ${radius} ${
            error ? 'border-bad' : 'border-line'
          }`}
          {...input}
        />
        {suffix && <Affix side="right">{suffix}</Affix>}
      </div>
      {error && (
        <p id={errorId} className="text-xs font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  )
}

function Affix({ side, children }: { side: 'left' | 'right'; children: ReactNode }) {
  return (
    <span
      className={`flex items-center whitespace-nowrap border border-line bg-canvas px-3 text-sm font-medium text-muted ${
        side === 'left' ? 'rounded-l-xl border-r-0' : 'rounded-r-xl border-l-0'
      }`}
    >
      {children}
    </span>
  )
}
