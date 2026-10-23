import { AlertTriangle, ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ScenarioDto, SimulationResultDto } from '../../api/client'
import { ButtonLink } from '../../components/ui/Button'
import { Badge, Card, ErrorNote, InfoBox, PageHeader, Spinner } from '../../components/ui/primitives'
import { formatCountDelta, formatEuroDelta, formatEuroWhole, formatPercent, isNegative } from '../../lib/format'
import { changeMeta } from './changeForm'
import { caseOf } from './resultHelpers'
import { useAllScenarioResults, useScenarios } from './scenarios'

/** Saved plans side by side: same measures, same units, all compared with not changing anything. */
export function PlansPage() {
  const scenarios = useScenarios()
  const ids = scenarios.data?.map((s) => s.id) ?? []
  const results = useAllScenarioResults(ids)

  if (scenarios.isPending) return <Spinner />
  if (scenarios.error) return <ErrorNote error={scenarios.error} />

  const plans = scenarios.data ?? []
  return (
    <div>
      <PageHeader
        title="Your plans"
        sub="Every plan is compared with keeping things as they are. Numbers are recalculated each time from your current baseline."
        actions={
          <ButtonLink to="/app/decide">
            <Plus size={16} /> Test a decision
          </ButtonLink>
        }
      />

      {plans.length === 0 ? (
        <Card className="border-2 border-dashed p-12 text-center">
          <p className="mb-5 text-muted">No plans yet. Test a decision and save it to compare it here.</p>
          <ButtonLink to="/app/decide">
            Test a decision <ArrowRight size={16} />
          </ButtonLink>
        </Card>
      ) : (
        <>
          <CompareTable plans={plans} results={results.map((r) => r.data)} />
          <div className="mt-4">
            <InfoBox tone="neutral">
              The table shows the <strong>expected</strong> case; the range row shows the pessimistic to optimistic spread. Open a plan
              for month-by-month detail.
            </InfoBox>
          </div>
        </>
      )}
    </div>
  )
}

function CompareTable({ plans, results }: { plans: ScenarioDto[]; results: (SimulationResultDto | undefined)[] }) {
  const rows: { label: string; render: (r: SimulationResultDto) => React.ReactNode }[] = [
    {
      label: 'Total result vs no change',
      render: (r) => <Delta value={caseOf(r, 'expected').difference.totalResult} strong />,
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
        const m = caseOf(r, 'expected').drivers.breakEvenMonth
        return <span className="font-sans">{m ? `Month ${m}` : <span className="text-muted">Not within {r.horizonMonths} months</span>}</span>
      },
    },
    {
      label: 'Lowest cash',
      render: (r) => {
        const s = caseOf(r, 'expected').summary
        const anyShort = r.cases.some((c) => c.shortfallMonths.length > 0)
        return (
          <span className="inline-flex items-center gap-1.5">
            <span className={isNegative(s.lowestCash) ? 'text-bad' : ''}>{formatEuroWhole(s.lowestCash)}</span>
            <span className="font-sans text-xs text-muted">m{s.lowestCashMonth}</span>
            {anyShort && (
              <span title="Cash drops below zero in at least one case" className="text-bad">
                <AlertTriangle size={14} aria-label="Cash shortfall in at least one case" />
              </span>
            )}
          </span>
        )
      },
    },
    { label: 'Cash at the end vs no change', render: (r) => <Delta value={caseOf(r, 'expected').difference.endCash} /> },
    {
      label: 'Extra visits served',
      render: (r) => {
        const v = caseOf(r, 'expected').difference.totalServed
        return <span className={isNegative(v) ? 'text-bad' : 'text-good'}>{formatCountDelta(v)}</span>
      },
    },
    { label: 'Staff busy in the last month', render: (r) => formatPercent(caseOf(r, 'expected').summary.lastMonthUtilisation) },
  ]

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas">
            <th className="w-56 p-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted">Measure</th>
            {plans.map((p) => (
              <th key={p.id} className="border-l border-line-soft p-4 text-left align-top">
                <Link to={`/app/plans/${p.id}`} className="font-semibold text-ink hover:text-navy hover:underline">
                  {p.name}
                </Link>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.changes.map((c, i) => (
                    <Badge key={i} tone="amber">
                      {changeMeta[c.type].short}
                    </Badge>
                  ))}
                  <Badge>{p.horizonMonths} mo</Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line-soft last:border-0">
              <td className="p-4 font-medium text-muted">{row.label}</td>
              {plans.map((p, i) => (
                <td key={p.id} className="border-l border-line-soft p-4 font-mono">
                  {results[i] ? row.render(results[i]!) : <span className="text-faint">…</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function Delta({ value, strong = false }: { value: string; strong?: boolean }) {
  return <span className={`${isNegative(value) ? 'text-bad' : 'text-good'} ${strong ? 'text-base font-medium' : ''}`}>{formatEuroDelta(value)}</span>
}
