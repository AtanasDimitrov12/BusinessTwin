import type { ReactNode } from 'react'

export interface TooltipRow {
  label: string
  value: string
  color?: string
}

/** Tooltip that shows exact, pre-formatted strings from the API instead of plotted numbers. */
export function ChartTooltip({
  active,
  title,
  rows,
}: {
  active?: boolean
  title?: ReactNode
  rows: TooltipRow[]
}) {
  if (!active || rows.length === 0) return null
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lift">
      {title && <div className="mb-1 font-semibold text-ink">{title}</div>}
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted">
            {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="font-mono font-medium text-ink">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4"
            style={{ background: i.dashed ? `repeating-linear-gradient(90deg, ${i.color} 0 4px, transparent 4px 7px)` : i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
