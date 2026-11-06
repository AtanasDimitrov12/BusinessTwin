import { CircleCheck, CircleDashed } from 'lucide-react'
import { SourceBadge } from './SourceBadge'

type Picked = 'entered' | 'estimated'

const options = [
  { value: 'entered', label: 'I know this', icon: CircleCheck, on: 'bg-accent text-white shadow-sm' },
  { value: 'estimated', label: 'My estimate', icon: CircleDashed, on: 'bg-amber text-white shadow-sm' },
] as const

/**
 * Compact two-way toggle beside a field label: is this value known or an estimate?
 * While the value is still a sample, only the sample badge shows; typing a value of your own makes it "I know this".
 */
export function SourcePicker({
  value,
  onChange,
  label,
}: {
  value: Picked | 'sample'
  onChange: (value: Picked) => void
  label: string
}) {
  if (value === 'sample') return <SourceBadge source="sample" />

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-canvas p-0.5">
        {options.map((o) => {
          const selected = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                selected ? o.on : 'text-muted hover:bg-surface hover:text-ink'
              }`}
            >
              <o.icon size={13} aria-hidden />
              {o.label}
            </button>
          )
        })}
    </div>
  )
}
