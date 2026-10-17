import type { ReactNode } from 'react'

export type Tone = 'neutral' | 'navy' | 'amber' | 'good' | 'bad'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}>{children}</div>
}

const badgeTones: Record<Tone, string> = {
  neutral: 'bg-line-soft text-muted',
  navy: 'bg-navy-50 text-navy',
  amber: 'bg-amber-50 text-amber-dark',
  good: 'bg-good-50 text-good-dark',
  bad: 'bg-bad-50 text-bad',
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]} ${className}`}>
      {children}
    </span>
  )
}

const infoTones: Record<Tone, string> = {
  neutral: 'bg-canvas border-line text-muted',
  navy: 'bg-navy-50 border-navy-200 text-navy',
  amber: 'bg-amber-50 border-amber-200 text-amber-dark',
  good: 'bg-good-50 border-good-200 text-good-dark',
  bad: 'bg-bad-50 border-bad-200 text-bad',
}

export function InfoBox({ children, tone = 'navy', icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${infoTones[tone]}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-[11px] font-bold uppercase tracking-[0.14em] ${className}`}>{children}</div>
}

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink md:text-[2.1rem]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const deltaTones: Record<Tone, string> = {
  neutral: 'text-muted',
  navy: 'text-navy',
  amber: 'text-amber-dark',
  good: 'text-good',
  bad: 'text-bad',
}

export function MetricCard({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  sub,
  accent = false,
  badge,
  textValue = false,
}: {
  label: string
  value: ReactNode
  delta?: string
  deltaTone?: Tone
  sub?: ReactNode
  accent?: boolean
  badge?: ReactNode
  /** The value is words ("Not yet"), not a number: show it in the display font. */
  textValue?: boolean
}) {
  return (
    <Card className={`p-4 ${accent ? 'ring-2 ring-navy/20' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Eyebrow className="text-muted">{label}</Eyebrow>
        {badge}
      </div>
      <div
        className={`leading-none tracking-tight text-ink ${
          textValue ? 'font-display text-[1.4rem] font-semibold' : 'font-mono text-[1.55rem] font-medium'
        }`}
      >
        {value}
      </div>
      {delta && <div className={`mt-1.5 text-xs font-semibold ${deltaTones[deltaTone]}`}>{delta}</div>}
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </Card>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  fullWidth = false,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (value: T) => void
  label: string
  fullWidth?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`gap-1 rounded-2xl bg-line-soft p-1 ${fullWidth ? 'grid' : 'inline-flex flex-wrap'}`}
      style={fullWidth ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            value === o.value ? 'bg-surface text-navy shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 p-6 text-sm text-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-navy-200 border-t-navy" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorNote({ error }: { error: Error | null | undefined }) {
  if (!error) return null
  return (
    <p role="alert" className="rounded-xl border border-bad-200 bg-bad-50 px-4 py-3 text-sm text-bad">
      {error.message}
    </p>
  )
}
