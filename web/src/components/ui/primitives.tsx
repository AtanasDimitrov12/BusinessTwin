import type { ReactNode } from 'react'

export type Tone = 'neutral' | 'accent' | 'amber' | 'good' | 'bad'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[var(--radius-card)] bg-surface shadow-card ${className}`}>{children}</div>
}

const badgeTones: Record<Tone, string> = {
  neutral: 'bg-line-soft text-muted',
  accent: 'bg-accent-50 text-accent',
  amber: 'bg-amber-50 text-amber-dark',
  good: 'bg-good-50 text-good-dark',
  bad: 'bg-bad-50 text-bad',
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]} ${className}`}>
      {children}
    </span>
  )
}

const infoTones: Record<Tone, string> = {
  neutral: 'bg-black/[0.035] text-muted',
  accent: 'bg-accent-50 text-accent-dark',
  amber: 'bg-amber-50 text-amber-dark',
  good: 'bg-good-50 text-good-dark',
  bad: 'bg-bad-50 text-bad',
}

export function InfoBox({ children, tone = 'accent', icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <div className={`flex gap-3 rounded-2xl p-4 text-sm leading-relaxed ${infoTones[tone]}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-[13px] font-semibold ${className}`}>{children}</div>
}

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[2rem] font-bold leading-[1.08] text-ink md:text-[2.5rem]">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-[17px] leading-snug text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const deltaTones: Record<Tone, string> = {
  neutral: 'text-muted',
  accent: 'text-accent',
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
    <Card className={`p-5 ${accent ? 'ring-2 ring-accent/25' : ''}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Eyebrow className="text-muted">{label}</Eyebrow>
        {badge}
      </div>
      <div
        className={`leading-none tracking-tight text-ink ${
          textValue ? 'font-display text-[1.5rem] font-bold' : 'font-mono text-[1.75rem] font-semibold'
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
      className={`gap-0.5 rounded-[11px] bg-black/[0.055] p-[3px] ${fullWidth ? 'grid' : 'inline-flex flex-wrap'}`}
      style={fullWidth ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-[color,background-color,box-shadow,translate,scale] duration-150 ease-out active:scale-[0.97] ${
            value === o.value ? 'bg-surface text-ink shadow-[0_0_0_0.5px_rgb(0_0_0/0.04),0_3px_8px_rgb(0_0_0/0.12)]' : 'text-ink/70 hover:text-ink'
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
      <span className="size-4 animate-spin rounded-full [animation-duration:700ms] border-2 border-black/10 border-t-muted" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorNote({ error }: { error: Error | null | undefined }) {
  if (!error) return null
  return (
    <p role="alert" className="rounded-2xl bg-bad-50 px-4 py-3 text-sm text-bad">
      {error.message}
    </p>
  )
}
