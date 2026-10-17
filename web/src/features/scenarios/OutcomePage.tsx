import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { CaseKey, CaseResultDto, SimulationResultDto } from '../../api/client'
import { CapacityChart, CaseRangeChart, CashChart, ImpactChart, WaterfallChart } from '../../components/charts/ResultCharts'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Badge, Card, ErrorNote, Segmented, Spinner } from '../../components/ui/primitives'
import { caseLabels } from '../../lib/cases'
import { formatCount, formatEuroDelta, formatEuroWhole, formatPercent, isNegative, isZero } from '../../lib/format'
import { changeMeta, describeChange } from './changeForm'
import { CashWarning, KeyFacts, ResultHeadline } from './ResultParts'
import { caseOf } from './resultHelpers'
import { useDeleteScenario, useScenario, useScenarioResults } from './scenarios'

/** The full outcome of a saved plan: three cases, month by month, compared with the baseline and explained. */
export function OutcomePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const scenario = useScenario(id)
  const results = useScenarioResults(id)
  const remove = useDeleteScenario()
  const [caseKey, setCaseKey] = useState<CaseKey>('expected')

  if (scenario.isPending || results.isPending) return <Spinner label="Calculating your plan…" />
  if (!scenario.data) return <ErrorNote error={scenario.error ?? new Error('This plan does not exist.')} />
  if (!results.data) return <ErrorNote error={results.error} />

  const s = scenario.data
  const result = results.data
  const selected = caseOf(result, caseKey)

  const onDelete = async () => {
    if (!window.confirm(`Delete "${s.name}"? This cannot be undone.`)) return
    await remove.mutateAsync(s.id)
    navigate('/app/plans')
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/app/plans" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-navy">
          <ArrowLeft size={14} /> All plans
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold leading-tight md:text-[2.1rem]">{s.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.changes.map((c, i) => (
                <Badge key={i} tone="amber">
                  {changeMeta[c.type].short} · month {c.startMonth}
                </Badge>
              ))}
              <Badge tone="neutral">{s.horizonMonths} months</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={`/app/decide/${s.id}`} variant="secondary">
              <Pencil size={15} /> Adjust estimates
            </ButtonLink>
            <Button variant="danger" onClick={() => onDelete().catch(() => {})} aria-label="Delete plan">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Case"
          value={caseKey}
          onChange={setCaseKey}
          options={(['pessimistic', 'expected', 'optimistic'] as const).map((k) => ({ value: k, label: caseLabels[k] }))}
        />
        <p className="text-xs text-muted">Each case uses your pessimistic, expected or optimistic guesses for every change.</p>
      </div>

      <ResultHeadline result={result} caseKey={caseKey} />
      <KeyFacts result={selected} horizonMonths={result.horizonMonths} />
      <CashWarning result={result} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Month by month" sub="How each month compares with today, and the running total.">
          <ImpactChart result={selected} />
        </ChartCard>
        <ChartCard title="Three cases" sub={`Total result over ${result.horizonMonths} months. Dashed line: without the decision.`}>
          <CaseRangeChart result={result} />
        </ChartCard>
        <ChartCard title="Cash in the bank" sub="End-of-month cash. A red dot means cash is below zero.">
          <CashChart baseline={result.baseline} result={selected} />
        </ChartCard>
        <ChartCard title="What changes and why" sub="From the result without the decision to the result with it.">
          <WaterfallChart steps={selected.waterfall} />
          <DriverList result={selected} />
        </ChartCard>
      </div>

      <ChartCard title="Customers and staff time" sub="Demand and capacity are separate: you can only serve the smaller of the two.">
        <CapacityChart result={selected} />
      </ChartCard>

      <MonthTable result={result} selected={selected} />

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Your assumptions</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {s.changes.map((c, i) => (
            <li key={i}>
              <strong className="text-ink">{changeMeta[c.type].title}:</strong> {describeChange(c, formatEuroWhole)}
            </li>
          ))}
        </ul>
        <h3 className="mt-6 font-semibold">What this does not include</h3>
        <div className="mt-2 grid gap-4 text-sm leading-relaxed text-muted md:grid-cols-3">
          <p>Results rest on your estimates. Different estimates give different results, so adjust them and compare.</p>
          <p>Money is counted in the month it happens. Taxes, payment delays, holiday-allowance timing and one-off costs are not included yet.</p>
          <p>The right choice also depends on your team, your customers, timing and how much risk you can carry.</p>
        </div>
      </Card>
    </div>
  )
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-muted">{sub}</p>
      {children}
    </Card>
  )
}

function DriverList({ result }: { result: CaseResultDto }) {
  const d = result.drivers
  const rows = [
    { label: 'Extra visits served', value: d.extraVisitsContribution },
    { label: 'Price effect', value: d.priceEffect },
    { label: 'Added wages', value: d.addedWageCosts },
    { label: 'Marketing spend', value: d.marketingCosts },
  ].filter((r) => !isZero(r.value))
  return (
    <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-4">
          <dt className="text-muted">{r.label}</dt>
          <dd className={`font-mono ${isNegative(r.value) ? 'text-bad' : 'text-good'}`}>{formatEuroDelta(r.value)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-line pt-1.5 font-semibold">
        <dt>Total difference</dt>
        <dd className={`font-mono ${isNegative(d.totalDifference) ? 'text-bad' : 'text-good'}`}>{formatEuroDelta(d.totalDifference)}</dd>
      </div>
      {!isZero(d.revenueLostToUnservedDemand) && (
        <p className="pt-2 text-xs text-muted">
          Sales missed because the team was full: <span className="font-mono">{formatEuroWhole(d.revenueLostToUnservedDemand)}</span>
        </p>
      )}
    </dl>
  )
}

function MonthTable({ result, selected }: { result: SimulationResultDto; selected: CaseResultDto }) {
  return (
    <Card className="overflow-hidden">
      <details>
        <summary className="cursor-pointer px-5 py-4 font-display text-lg font-semibold hover:bg-canvas">All months in a table</summary>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-canvas text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>
                {['Month', 'Visits served', 'Busy', 'Sales', 'Costs', 'Result', 'vs today', 'Cash'].map((h) => (
                  <th key={h} className={`px-4 py-2.5 ${h === 'Month' ? '' : 'text-right'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft font-mono">
              {selected.months.map((m, i) => (
                <tr key={m.month} className={m.cashShortfall ? 'bg-bad-50' : undefined}>
                  <td className="px-4 py-2 font-sans font-medium">
                    {m.month}
                    {selected.drivers.breakEvenMonth === m.month && <Badge tone="good" className="ml-2">catches up</Badge>}
                  </td>
                  <td className="px-4 py-2 text-right">{formatCount(m.servicesDelivered)}</td>
                  <td className="px-4 py-2 text-right">{formatPercent(m.utilisation)}</td>
                  <td className="px-4 py-2 text-right">{formatEuroWhole(m.revenue)}</td>
                  <td className="px-4 py-2 text-right">{formatEuroWhole(m.fixedCosts)}</td>
                  <td className={`px-4 py-2 text-right ${isNegative(m.monthlyResult) ? 'text-bad' : ''}`}>{formatEuroWhole(m.monthlyResult)}</td>
                  <td className={`px-4 py-2 text-right ${isNegative(selected.resultDifferenceByMonth[i]) ? 'text-bad' : 'text-good'}`}>
                    {formatEuroDelta(selected.resultDifferenceByMonth[i])}
                  </td>
                  <td className={`px-4 py-2 text-right ${m.cashShortfall ? 'font-semibold text-bad' : ''}`}>{formatEuroWhole(m.cashAtEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-muted">
          Costs = fixed costs (wages, rent, marketing). Without the decision the result is {formatEuroWhole(result.baseline[0].monthlyResult)} every month.
        </p>
      </details>
    </Card>
  )
}
