import { Layers } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo({ to = '/', inverted = false, compact = false }: { to?: string; inverted?: boolean; compact?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="Business Twin home">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${inverted ? 'bg-white text-navy' : 'bg-navy text-white'}`}
      >
        <Layers size={18} strokeWidth={2} aria-hidden />
      </span>
      {!compact && (
        <span className={`font-display text-lg font-semibold tracking-tight ${inverted ? 'text-white' : 'text-navy'}`}>
          Business Twin
        </span>
      )}
    </Link>
  )
}
