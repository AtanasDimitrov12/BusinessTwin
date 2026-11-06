import { AlertTriangle, ArrowRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CaseKey, ScenarioDto, SimulationResultDto } from '../../api/client'
import { ButtonLink } from '../../components/ui/Button'
import { Badge, Card, ErrorNote, InfoBox, PageHeader, Segmented, Spinner } from '../../components/ui/primitives'
import { Tooltip } from '../../components/ui/Tooltip'
import { caseLabels } from '../../lib/cases'
import { formatCountDelta, formatEuroDelta, formatEuroWhole, formatPercent, isNegative } from '../../lib/format'
import { changeMeta } from './changeForm'
import { caseOf } from './resultHelpers'
import { useAllScenarioResults, useScenarios } from './scenarios'

type Period = 'common' | 'own'

/**
 * Saved plans side by side: same measures, same units, all compared with not changing anything.
 * Plans of different lengths are compared over their common months by default, because a 24-month total
 * next to a 12-month total is not a fair comparison. The owner can switch to each plan's own length.
 */
export function PlansPage() {
  const scenarios = useScenarios()
  const plans = scenarios.data ?? []
  const [caseKey, setCaseKey] = useState<CaseKey>('expected')
  const [period, setPeriod] = useState<Period>('common')

  // Month counts are whole numbers, not money: picking the shortest is safe in the browser.
  const horizons = plans.map((p) => p.horizonMonths)
  const shortest = horizons.length ? Math.min(...horizons) : 0
  const mixed = new Set(horizons).size > 1
  const commonMonths = mixed && period === 'common' ? shortest : undefined
  const results = useAllScenarioResults(
    plans.map((p) => p.id),
    commonMonths,
  )

  if (scenarios.isPending) return <Spinner />
  if (scenarios.error) return <ErrorNote error={scenarios.error} />

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
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="block text-[13px] font-medium text-muted">Show the</span>
              <Segmented
                label="Case"
                value={caseKey}
                onChange={setCaseKey}
                options={(['pessimistic', 'expected', 'optimistic'] as const).map((k) => ({ value: k, label: `${caseLabels[k]} case` }))}
              />
            </div>
            {mixed && (
              <div className="space-y-1.5">
                <span className="block text-[13px] font-medium text-muted">Compare over</span>
                <Segmented
                  label="Comparison period"
                  value={period}
                  onChange={setPeriod}
                  options={[
                    { value: 'common', label: `First ${shortest} months (fair)` },
                    { value: 'own', label: 'Each plan’s own length' },
                  ]}
                />
              </div>
            )}
          </div>

          {mixed && (
            <div className="mb-4">
              <InfoBox tone={period === 'common' ? 'accent' : 'amber'} icon={<AlertTriangle size={16} />}>
                {period === 'common' ? (
                  <>
                    Your plans look ahead for different lengths of time, so every plan is shown over its <strong>first {shortest} months</strong>{' '}
                    to keep the totals comparable. Changes that start later are not counted here.
                  </>
                ) : (
                  <>
                    Each plan is shown over its own length. Totals over a longer period are naturally larger, so{' '}
                    <strong>do not compare the totals directly</strong>.
                  </>
                )}
              </InfoBox>
            </div>
          )}

          <CompareTable plans={plans} results={results} caseKey={caseKey} commonMonths={commonMonths} />
          <div className="mt-4">
            <InfoBox tone="neutral">
              The table shows the <strong>{caseLabels[caseKey].toLowerCase()}</strong> case; the range row always shows the pessimistic to
              optimistic spread, and ⚠ marks a cash shortfall in any case. Open a plan for month-by-month detail.
            </InfoBox>
          </div>
        </>
      )}
    </div>
  )
}

type ResultQuery = { data?: SimulationResultDto; error: Error | null; isPending: boolean }

function CompareTable({
  plans,
  results,
  caseKey,
  commonMonths,
}: {
  plans: ScenarioDto[]
  results: ResultQuery[]
  caseKey: CaseKey
  commonMonths: number | undefined
}) {
  const rows: { label: string; render: (r: SimulationResultDto) => React.ReactNode }[] = [
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

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="sr-only">
          Saved plans compared, {caseLabels[caseKey].toLowerCase()} case{commonMonths ? `, first ${commonMonths} months` : ''}
        </caption>
        <thead>
          <tr className="border-b border-line bg-canvas">
            <th scope="col" className="w-56 p-4 text-left text-xs font-semibold text-muted">
              Measure
            </th>
            {plans.map((p) => (
              <th key={p.id} scope="col" className="border-l border-line-soft p-4 text-left align-top">
                <Link to={`/app/plans/${p.id}`} className="font-semibold text-ink hover:text-accent hover:underline">
                  {p.name}
                </Link>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.changes.map((c, i) => (
                    <Badge key={i} tone="amber">
                      {changeMeta[c.type].short}
                    </Badge>
                  ))}
                  <Badge>{commonMonths && commonMonths < p.horizonMonths ? `first ${commonMonths} of ${p.horizonMonths} mo` : `${p.horizonMonths} mo`}</Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.label} className="border-b border-line-soft last:border-0">
              <th scope="row" className="p-4 text-left font-medium text-muted">
                {row.label}
              </th>
              {plans.map((p, i) => {
                const q = results[i]
                return (
                  <td key={p.id} className="border-l border-line-soft p-4 font-mono">
                    {q?.data ? (
                      row.render(q.data)
                    ) : q?.error ? (
                      // Say it once per plan, in the first row, instead of a silent "…" in every cell.
                      rowIndex === 0 ? <span className="font-sans text-xs text-bad">Could not calculate: {q.error.message}</span> : null
                    ) : (
                      <span className="text-faint" aria-label="Calculating">…</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function Delta({ value, strong = false }: { value: string; strong?: boolean }) {
  return <span className={`${isNegative(value) ? 'text-bad' : 'text-good'} ${strong ? 'text-base font-semibold' : ''}`}>{formatEuroDelta(value)}</span>
}
