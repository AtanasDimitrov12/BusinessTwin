import { Popover } from '@base-ui/react/popover'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeType, ScenarioDto } from '../../api/client'
import { buttonClass } from '../../components/ui/buttonClass'
import { changeMeta } from './changeForm'

type TypeFilter = 'all' | ChangeType

/**
 * Choose which saved plans to compare. A select-like trigger that fits on one line however many plans exist; the list
 * lives in a popover (Base UI: focus management, Escape, outside click, collision-aware placement) with search and a
 * filter by change type, so 20 plans are as easy to handle as 3. Rows keep their order while ticking, so nothing jumps.
 */
export function PlanPicker({
  plans,
  selectedIds,
  onChange,
  open,
  onOpenChange,
}: {
  plans: ScenarioDto[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const search = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TypeFilter>('all')

  const types = (Object.keys(changeMeta) as ChangeType[]).filter((t) => plans.some((p) => p.changes.some((c) => c.type === t)))
  const q = query.trim().toLowerCase()
  const shown = plans.filter((p) => (!q || p.name.toLowerCase().includes(q)) && (type === 'all' || p.changes.some((c) => c.type === type)))
  const selected = new Set(selectedIds)
  const toggle = (id: string) => onChange(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  const allShownSelected = shown.length > 0 && shown.every((p) => selected.has(p.id))
  const filtering = !!q || type !== 'all'

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setQuery('')
          setType('all')
        }
      }}
    >
      <Popover.Trigger className="group inline-flex min-w-[12.5rem] items-center justify-between gap-3 rounded-[11px] border border-black/[0.12] bg-surface py-2 pl-3 pr-2.5 text-[13px] font-medium text-ink transition-[border-color,box-shadow,scale] duration-150 ease-out hover:border-black/25 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 active:scale-[0.98] data-[popup-open]:border-accent data-[popup-open]:ring-4 data-[popup-open]:ring-accent/15">
        <span>
          <span className="font-mono font-semibold">{selectedIds.length}</span> of {plans.length} plans
        </span>
        <ChevronDown size={15} className="text-muted transition-transform duration-200 ease-out group-data-[popup-open]:rotate-180" aria-hidden />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={12} className="z-50">
          <Popover.Popup
            initialFocus={search}
            className="popover flex max-h-[min(32rem,var(--available-height))] w-[min(24rem,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl bg-surface shadow-lift outline-none"
          >
            <div className="space-y-2.5 border-b border-black/[0.06] p-3">
              <div className="flex items-baseline justify-between gap-2 px-1">
                <Popover.Title className="text-[15px] font-semibold">Plans to compare</Popover.Title>
                <span className="text-xs text-muted" aria-live="polite">
                  {selectedIds.length} selected
                </span>
              </div>
              <label className="relative block">
                <span className="sr-only">Find a plan</span>
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
                <input
                  ref={search}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a plan"
                  className="w-full rounded-[10px] bg-black/[0.05] py-2 pl-9 pr-3 text-[15px] text-ink placeholder:text-faint focus:outline-none focus:ring-4 focus:ring-accent/15"
                />
              </label>
              {types.length > 1 && (
                <div className="flex gap-1" role="radiogroup" aria-label="Show plans with">
                  {(['all', ...types] as TypeFilter[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={type === t}
                      onClick={() => setType(t)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-[color,background-color] duration-150 ${
                        type === t ? 'bg-ink text-white' : 'text-muted hover:bg-black/[0.05] hover:text-ink'
                      }`}
                    >
                      {t === 'all' ? 'All' : changeMeta[t].short}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5" role="group" aria-label="Plans">
              {shown.map((p) => {
                const on = selected.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(p.id)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-black/[0.04] focus-visible:bg-black/[0.04]"
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-150 ${
                        on ? 'bg-accent text-white' : 'shadow-[inset_0_0_0_1.5px_rgb(0_0_0/0.2)]'
                      }`}
                      aria-hidden
                    >
                      {on && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">{p.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {p.changes.map((c) => changeMeta[c.type].short).join(' + ')} · {p.horizonMonths} months
                      </span>
                    </span>
                  </button>
                )
              })}
              {shown.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">No plan matches your search.</p>}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] p-2">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => onChange([...new Set([...selectedIds, ...shown.map((p) => p.id)])])}
                  disabled={allShownSelected}
                  className={buttonClass('ghost', 'sm')}
                >
                  {filtering ? 'Select shown' : 'Select all'}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(filtering ? selectedIds.filter((id) => !shown.some((p) => p.id === id)) : [])}
                  disabled={!shown.some((p) => selected.has(p.id))}
                  className={buttonClass('ghost', 'sm')}
                >
                  {filtering ? 'Clear shown' : 'Clear'}
                </button>
              </div>
              <Popover.Close className={buttonClass('primary', 'sm')}>Done</Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
