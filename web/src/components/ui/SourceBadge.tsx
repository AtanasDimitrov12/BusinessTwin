import type { SourceLabel } from '../../api/client'
import { Badge, type Tone } from './primitives'

export type Source = SourceLabel | 'calculated'

const meta: Record<Source, { label: string; tone: Tone; title: string }> = {
  entered: { label: 'Entered', tone: 'accent', title: 'You entered this value.' },
  estimated: { label: 'Estimated', tone: 'amber', title: 'Your estimate: not sure of the exact value.' },
  sample: { label: 'Sample', tone: 'neutral', title: 'Value from a sample salon. Replace it with your own.' },
  calculated: { label: 'Calculated', tone: 'good', title: 'Calculated by Business Twin from your inputs.' },
}

/** Every value on screen says where it comes from. */
export function SourceBadge({ source }: { source: Source }) {
  const m = meta[source]
  return (
    <Badge tone={m.tone} className="px-2 py-px text-[11px]">
      <span title={m.title}>{m.label}</span>
    </Badge>
  )
}
