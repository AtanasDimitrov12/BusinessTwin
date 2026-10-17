import type { SourceLabel } from '../api/client'

type Source = SourceLabel | 'calculated'

const text: Record<Source, string> = {
  entered: 'Entered',
  estimated: 'Estimated',
  sample: 'Sample',
  calculated: 'Calculated',
}

/** Every value on screen says where it comes from. */
export function SourceBadge({ source }: { source: Source }) {
  return <span className={`badge badge-${source}`}>{text[source]}</span>
}
