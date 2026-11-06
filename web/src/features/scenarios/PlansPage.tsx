import { AlertTriangle, ArrowRight, Check, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { CaseKey, ScenarioDto, SimulationResultDto } from '../../api/client'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Badge, Card, ErrorNote, InfoBox, PageHeader, Segmented, Spinner } from '../../components/ui/primitives'
import { Tooltip } from '../../components/ui/Tooltip'
import { caseLabels } from '../../lib/cases'
import { compareDecimal, formatCountDelta, formatEuroDelta, formatEuroWhole, formatPercent, isNegative, isPositive } from '../../lib/format'
import { changeMeta } from './changeForm'
import { caseOf } from './resultHelpers'
import { PlanPicker } from './PlanPicker'
import { useAllScenarioResults, useScenarios } from './scenarios'

type Period = 'common' | 'own'
type SortKey = 'newest' | 'result' | 'cash' | 'name'
type HighlightKey = 'better' | 'cashSafe' | 'catchesUp' | 'moreVisits'

/** With more than this many plans, only the newest are selected at first so the table stays readable. */
const DEFAULT_SELECTED = 4

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'result', label: 'Best result' },
  { value: 'cash', label: 'Safest cash' },
  { value: 'name', label: 'Name A–Z' },
]

/** Questions an owner asks of a set of plans. Sign checks look at the text; nothing is calculated here. */
const highlights: { key: HighlightKey; label: string; hint: string; test: (r: SimulationResultDto, c: CaseKey) => boolean }[] = [
  {
    key: 'better',
    label: 'Better than no change',
    hint: 'Total result is above keeping things as they are',
    test: (r, c) => isPositive(caseOf(r, c).difference.totalResult),
  },
  {
    key: 'cashSafe',
    label: 'Cash stays above zero',
    hint: 'No month below zero in any of the three cases',
    test: (r) => r.cases.every((x) => x.shortfallMonths.length === 0),
  },
  {
    key: 'catchesUp',
    label: 'Catches up in time',
    hint: 'The monthly result gets back to today’s level within the period',
    test: (r, c) => caseOf(r, c).drivers.breakEvenMonth != null,
  },
  {
    key: 'moreVisits',
    label: 'Serves more customers',
    hint: 'More visits served than without the decision',
    test: (r, c) => isPositive(caseOf(r, c).difference.totalServed),
  },
]

/**
 * Saved plans side by side: same measures, same units, all compared with not changing anything.
 * The owner picks which plans to compare (the rest stay saved), can sort them and highlight the ones that meet a
 * condition. Plans of different lengths are compared over their common months by default, because a 24-month total
 * next to a 12-month total is not a fair comparison.
 */
export function PlansPage() {
  const scenarios = useScenarios()
  const plans = scenarios.data ?? []
  const [params, setParams] = useSearchParams()
  const [caseKey, setCaseKey] = useState<CaseKey>('expected')
  const [period, setPeriod] = useState<Period>('common')
  const [sort, setSort] = useState<SortKey>('newest')
  const [active, setActive] = useState<HighlightKey[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)

  // Selection lives in the URL (?compare=id,id), so back, refresh and a shared link keep it.
  const fromUrl = params.get('compare')
  const selectedIds = fromUrl === null ? plans.slice(0, DEFAULT_SELECTED).map((p) => p.id) : fromUrl.split(',').filter(Boolean)
  const selected = plans.filter((p) => selectedIds.includes(p.id))
  const setSelected = (ids: string[]) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('compare', ids.join(','))
        return next
      },
      { replace: true },
    )

  // Month counts are whole numbers, not money: picking the shortest is safe in the browser.
  const horizons = selected.map((p) => p.horizonMonths)
  const shortest = horizons.length ? Math.min(...horizons) : 0
  const mixed = new Set(horizons).size > 1
  const commonMonths = mixed && period === 'common' ? shortest : undefined
  // Only the selected plans are calculated.
  const queries = useAllScenarioResults(
    selected.map((p) => p.id),
    commonMonths,
  )
  const columns = sortColumns(
    selected.map((plan, i) => ({ plan, query: queries[i] })),
    sort,
    caseKey,
  )

  if (scenarios.isPending) return <Spinner />
  if (scenarios.error) return <ErrorNote error={scenarios.error} />

  const matches = (r: SimulationResultDto | undefined) => !!r && active.every((k) => highlights.find((h) => h.key === k)!.test(r, caseKey))
  const matchCount = columns.filter((c) => matches(c.query?.data)).length

  return (
    <div>
      <PageHeader
        title="Your plans"
        sub="Every plan is compared with keeping things as they are. Numbers are recalculated each time from your current salon figures."
        actions={
          <ButtonLink to="/app/decide">
            <Plus size={16} /> Test a decision
          </ButtonLink>
        }
      />

      {plans.length === 0 ? (
        <Card className="border-2 border-dashed border-black/[0.1] p-12 text-center">
          <p className="mb-5 text-muted">No plans yet. Test a decision and save it to compare it here.</p>
          <ButtonLink to="/app/decide">
            Test a decision <ArrowRight size={16} />
          </ButtonLink>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <Control label="Comparing">
              <PlanPicker plans={plans} selectedIds={selected.map((p) => p.id)} onChange={setSelected} open={pickerOpen} onOpenChange={setPickerOpen} />
            </Control>
            {selected.length > 0 && (
              <>
                <Control label="Show the">
                  <Segmented
                    label="Case"
                    value={caseKey}
                    onChange={setCaseKey}
                    options={(['pessimistic', 'expected', 'optimistic'] as const).map((k) => ({ value: k, label: caseLabels[k] }))}
                  />
                </Control>
                {mixed && (
                  <Control label="Compare over">
                    <Segmented
                      label="Comparison period"
                      value={period}
                      onChange={setPeriod}
                      options={[
                        { value: 'common', label: `First ${shortest} months` },
                        { value: 'own', label: 'Each plan’s own length' },
                      ]}
                    />
                  </Control>
                )}
                {selected.length > 1 && (
                  <Control label="Sort by">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="rounded-[11px] border border-black/[0.12] bg-surface py-2 pl-3 pr-8 text-[13px] font-medium text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                    >
                      {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Control>
                )}
              </>
            )}
          </div>

          {selected.length === 0 ? (
            <Card className="flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-[15px] text-muted">No plans selected. Your plans are still saved: choose the ones you want to compare.</p>
              <Button variant="secondary" onClick={() => setPickerOpen(true)}>
                Choose plans
              </Button>
            </Card>
          ) : (
            <>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[13px] font-medium text-muted">Highlight plans that</span>
                  {highlights.map((h) => {
                    const on = active.includes(h.key)
                    return (
                      <Tooltip key={h.key} label={h.hint}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => setActive(on ? active.filter((k) => k !== h.key) : [...active, h.key])}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97] ${
                            on ? 'bg-good-50 text-good-dark ring-1 ring-good/30' : 'bg-black/[0.045] text-ink/80 hover:bg-black/[0.07]'
                          }`}
                        >
                          {on && <Check size={13} aria-hidden />}
                          {h.label.toLowerCase()}
                        </button>
                      </Tooltip>
                    )
                  })}
                  {active.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setActive([])}>
                      Clear
                    </Button>
                  )}
                </div>
                {active.length > 0 && (
                  <p className="text-[13px] text-muted" role="status">
                    {matchCount === 0
                      ? 'No selected plan meets all highlighted conditions.'
                      : `${matchCount} of ${columns.length} plan${columns.length > 1 ? 's' : ''} meet${matchCount === 1 ? 's' : ''} all highlighted conditions.`}
                  </p>
                )}
              </div>

              {mixed && (
                <InfoBox tone={period === 'common' ? 'accent' : 'amber'} icon={<AlertTriangle size={16} />}>
                  {period === 'common' ? (
                    <>
                      These plans look ahead for different lengths of time, so each is shown over its <strong>first {shortest} months</strong> to
                      keep the totals comparable. Changes that start later are not counted here.
                    </>
                  ) : (
                    <>
                      Each plan is shown over its own length. Totals over a longer period are naturally larger, so{' '}
                      <strong>do not compare the totals directly</strong>.
                    </>
                  )}
                </InfoBox>
              )}

              <CompareTable
                columns={columns}
                caseKey={caseKey}
                commonMonths={commonMonths}
                highlighting={active.length > 0}
                matches={matches}
                onRemove={(id) => setSelected(selected.map((p) => p.id).filter((x) => x !== id))}
              />

              <InfoBox tone="neutral">
                The table shows the <strong>{caseLabels[caseKey].toLowerCase()}</strong> case; the range row always shows the pessimistic to
                optimistic spread, and ⚠ marks a cash shortfall in any case. Open a plan for month-by-month detail.
              </InfoBox>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    // A flex column, so inline controls get no extra line-box space and all toolbar items align on their bottom edge.
    <div className="flex flex-col items-start gap-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
    </div>
  )
}

// ── Table ────────────────────────────────────────────────────────────────

type ResultQuery = { data?: SimulationResultDto; error: Error | null; isPending: boolean }
type Column = { plan: ScenarioDto; query: ResultQuery | undefined }

/** Sorting compares decimal strings exactly (compareDecimal); plans still calculating go last. */
function sortColumns(columns: Column[], sort: SortKey, caseKey: CaseKey): Column[] {
  if (sort === 'newest') return columns
  if (sort === 'name') return [...columns].sort((a, b) => a.plan.name.localeCompare(b.plan.name))
  const valueOf = (c: Column) => {
    const r = c.query?.data
    if (!r) return undefined
    return sort === 'result' ? caseOf(r, caseKey).difference.totalResult : caseOf(r, caseKey).summary.lowestCash
  }
  return [...columns].sort((a, b) => {
    const x = valueOf(a)
    const y = valueOf(b)
    if (x === undefined || y === undefined) return x === undefined ? (y === undefined ? 0 : 1) : -1
    return compareDecimal(y, x) // highest first
  })
}

/** Whether the scroll area has more content to the left or right, for the edge fades. */
function useScrollEdges() {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])
  return { ref, edges }
}

function CompareTable({
  columns,
  caseKey,
  commonMonths,
  highlighting,
  matches,
  onRemove,
}: {
  columns: Column[]
  caseKey: CaseKey
  commonMonths: number | undefined
  highlighting: boolean
  matches: (r: SimulationResultDto | undefined) => boolean
  onRemove: (id: string) => void
}) {
  const { ref, edges } = useScrollEdges()
  const rows: { label: string; render: (r: SimulationResultDto) => ReactNode }[] = [
    {
      label: 'Total result vs no change',
      render: (r) => <Delta value={caseOf(r, caseKey).difference.totalResult} strong />,
    },
    {
      label: 'Range (pessimistic → optimistic)',
      render: (r) => (
        <span>
          {formatEuroDelta(caseOf(r, 'pessimistic').difference.totalResult)} → {formatEuroDelta(caseOf(r, 'optimistic').difference.totalResult)}
        </span>
      ),
    },
    {
      label: 'Monthly result catches up',
      render: (r) => {
        const m = caseOf(r, caseKey).drivers.breakEvenMonth
        return <span className="font-sans">{m ? `Month ${m}` : <span className="text-muted">Not within {r.horizonMonths} months</span>}</span>
      },
    },
    {
      label: 'Lowest cash',
      render: (r) => {
        const s = caseOf(r, caseKey).summary
        const anyShort = r.cases.some((c) => c.shortfallMonths.length > 0)
        return (
          <span className="inline-flex flex-wrap items-center gap-x-1.5">
            <span className={isNegative(s.lowestCash) ? 'text-bad' : ''}>{formatEuroWhole(s.lowestCash)}</span>
            <span className="font-sans text-xs text-muted">in month {s.lowestCashMonth}</span>
            {anyShort && (
              <Tooltip label="Cash drops below zero in at least one case">
                <span className="text-bad">
                  <AlertTriangle size={14} role="img" aria-label="Cash drops below zero in at least one case" />
                </span>
              </Tooltip>
            )}
          </span>
        )
      },
    },
    { label: 'Cash at the end vs no change', render: (r) => <Delta value={caseOf(r, caseKey).difference.endCash} /> },
    {
      label: 'Extra visits served',
      render: (r) => {
        const v = caseOf(r, caseKey).difference.totalServed
        return <span className={isNegative(v) ? 'text-bad' : 'text-good'}>{formatCountDelta(v)}</span>
      },
    },
    { label: 'Staff busy in the last month', render: (r) => formatPercent(caseOf(r, caseKey).summary.lastMonthUtilisation) },
  ]

  // A column fades back while highlights are on and the plan does not meet them.
  const dim = (c: Column) => highlighting && !matches(c.query?.data)
  // Pinned label column: stays in place while the plan columns scroll sideways.
  const pinned = `sticky left-0 z-10 w-44 min-w-44 bg-surface p-4 text-left sm:w-56 sm:min-w-56 ${edges.left ? 'shadow-[6px_0_12px_-8px_rgb(0_0_0/0.25)]' : ''}`

  return (
    <div>
      <div className="relative">
      <Card className="overflow-hidden">
        <div ref={ref} className="overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label="Plan comparison, scrolls sideways">
          <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
            <caption className="sr-only">
              Selected plans compared, {caseLabels[caseKey].toLowerCase()} case{commonMonths ? `, first ${commonMonths} months` : ''}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={`${pinned} border-b border-line !bg-canvas text-xs font-semibold text-muted`}>
                  Measure
                </th>
                {columns.map((c) => {
                  const p = c.plan
                  const hit = highlighting && matches(c.query?.data)
                  return (
                    <th
                      key={p.id}
                      scope="col"
                      className={`w-60 min-w-60 border-b border-l border-line border-l-line-soft bg-canvas p-4 text-left align-top transition-opacity duration-200 ${
                        dim(c) ? 'opacity-40' : ''
                      } ${hit ? 'shadow-[inset_0_3px_0_var(--color-good)]' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/app/plans/${p.id}`} className="font-semibold text-ink hover:text-accent hover:underline">
                          {p.name}
                        </Link>
                        <Tooltip label="Remove from comparison">
                          <button
                            type="button"
                            onClick={() => onRemove(p.id)}
                            aria-label={`Remove ${p.name} from comparison`}
                            className="-mr-1.5 -mt-1 shrink-0 rounded-full p-1 text-faint transition-[color,background-color,scale] duration-150 ease-out hover:bg-black/[0.06] hover:text-ink active:scale-[0.9]"
                          >
                            <X size={14} aria-hidden />
                          </button>
                        </Tooltip>
                      </div>
                      {hit && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-good-50 px-2 py-0.5 text-[11px] font-medium text-good-dark">
                          <Check size={11} aria-hidden /> Matches
                        </span>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.changes.map((ch, i) => (
                          <Badge key={i} tone="amber">
                            {changeMeta[ch.type].short}
                          </Badge>
                        ))}
                        <Badge>{commonMonths && commonMonths < p.horizonMonths ? `first ${commonMonths} of ${p.horizonMonths} mo` : `${p.horizonMonths} mo`}</Badge>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.label} className="group">
                  <th scope="row" className={`${pinned} border-b border-line-soft font-medium text-muted group-last:border-0`}>
                    {row.label}
                  </th>
                  {columns.map((c) => {
                    const q = c.query
                    return (
                      <td
                        key={c.plan.id}
                        className={`border-b border-l border-line-soft p-4 font-mono transition-opacity duration-200 group-last:border-b-0 ${dim(c) ? 'opacity-40' : ''}`}
                      >
                        {q?.data ? (
                          row.render(q.data)
                        ) : q?.error ? (
                          // Said once per plan, in the first row, instead of a silent "…" in every cell.
                          rowIndex === 0 ? <span className="font-sans text-xs text-bad">Could not calculate: {q.error.message}</span> : null
                        ) : (
                          <span className="text-faint" aria-label="Calculating">
                            …
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Edge fade: there is more to the right. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-12 rounded-r-[var(--radius-card)] bg-gradient-to-l from-surface to-transparent transition-opacity duration-200 ${
          edges.right ? 'opacity-100' : 'opacity-0'
        }`}
      />
      </div>
      {(edges.left || edges.right) && <p className="mt-2 text-center text-xs text-muted">Scroll sideways to see every selected plan.</p>}
    </div>
  )
}

function Delta({ value, strong = false }: { value: string; strong?: boolean }) {
  return <span className={`${isNegative(value) ? 'text-bad' : 'text-good'} ${strong ? 'text-base font-semibold' : ''}`}>{formatEuroDelta(value)}</span>
}
