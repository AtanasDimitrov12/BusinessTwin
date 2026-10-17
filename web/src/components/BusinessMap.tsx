import { ArrowDown } from 'lucide-react'
import type { ReactNode } from 'react'

export type MapKey = 'demand' | 'capacity' | 'served' | 'revenue' | 'variableCosts' | 'contribution' | 'fixedCosts' | 'result'

export interface MapNode {
  value: string
  sub: ReactNode
}

const labels: Record<MapKey, string> = {
  demand: 'Customer demand',
  capacity: 'Team capacity',
  served: 'Customers served',
  revenue: 'Sales',
  variableCosts: 'Cost of services',
  contribution: 'Contribution',
  fixedCosts: 'Fixed costs',
  result: 'Monthly result',
}

/**
 * How the numbers connect: demand and capacity meet in visits served, which drive sales and costs,
 * down to the monthly result. Inputs are white, calculated values tinted, the result filled.
 * Values are pre-formatted strings; the map only lays them out.
 */
export function BusinessMap({
  nodes,
  highlighted = [],
  resultTone = 'navy',
  capacityLimited = false,
}: {
  nodes: Record<MapKey, MapNode>
  highlighted?: MapKey[]
  resultTone?: 'navy' | 'good' | 'bad'
  capacityLimited?: boolean
}) {
  const node = (k: MapKey, kind: 'input' | 'derived' | 'result') => (
    <Node key={k} label={labels[k]} {...nodes[k]} kind={kind} highlighted={highlighted.includes(k)} tone={resultTone} />
  )

  return (
    <div className="mx-auto grid max-w-xl gap-1.5" aria-label="Business map">
      <div className="grid grid-cols-2 gap-3">
        {node('demand', 'input')}
        {node('capacity', 'input')}
      </div>
      <Connector label={capacityLimited ? 'capacity is the limit' : 'the smaller of the two'} warn={capacityLimited} />
      <div className="mx-auto w-full sm:w-1/2">{node('served', 'derived')}</div>
      <Connector />
      <div className="grid grid-cols-2 gap-3">
        {node('revenue', 'derived')}
        {node('variableCosts', 'derived')}
      </div>
      <Connector label="sales − cost of services" />
      <div className="mx-auto w-full sm:w-1/2">{node('contribution', 'derived')}</div>
      <Connector label="contribution − fixed costs" />
      <div className="grid grid-cols-2 gap-3">
        {node('fixedCosts', 'input')}
        {node('result', 'result')}
      </div>
    </div>
  )
}

function Node({
  label,
  value,
  sub,
  kind,
  highlighted,
  tone,
}: MapNode & { label: string; kind: 'input' | 'derived' | 'result'; highlighted: boolean; tone: 'navy' | 'good' | 'bad' }) {
  const resultBg = { navy: 'bg-navy border-navy', good: 'bg-good-dark border-good-dark', bad: 'bg-bad border-bad' }[tone]
  const style =
    kind === 'result'
      ? `${resultBg} text-white shadow-lift`
      : highlighted
        ? 'border-amber bg-amber-50 ring-2 ring-amber/25'
        : kind === 'derived'
          ? 'border-navy-200 bg-navy-50'
          : 'border-line bg-surface'

  return (
    <div className={`relative rounded-xl border px-3 py-2.5 text-center transition-colors ${style}`}>
      {highlighted && kind !== 'result' && <span className="absolute inset-y-3 left-0 w-1 rounded-r bg-amber" aria-hidden />}
      <div
        className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
          kind === 'result' ? 'text-white/75' : highlighted ? 'text-amber-dark' : 'text-muted'
        }`}
      >
        {label}
        {highlighted && kind !== 'result' && <span className="sr-only"> (changed by this decision)</span>}
      </div>
      <div className={`font-mono text-lg font-medium sm:text-xl ${kind === 'result' ? 'text-white' : 'text-navy'}`}>{value}</div>
      <div className={`text-[11px] ${kind === 'result' ? 'text-white/75' : 'text-muted'}`}>{sub}</div>
    </div>
  )
}

function Connector({ label, warn = false }: { label?: string; warn?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${warn ? 'text-bad' : 'text-faint'}`}>
      <ArrowDown size={14} aria-hidden />
      {label && <span>{label}</span>}
    </div>
  )
}
