import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { CaseKey, CaseResultDto, SimulationResultDto } from '../../api/client'
import { InfoBox, MetricCard } from '../../components/ui/primitives'
import { caseLabels } from '../../lib/cases'
import { formatCount, formatEuroDelta, formatEuroWhole, isNegative } from '../../lib/format'
import { caseOf } from './resultHelpers'

/** The answer first: how much better or worse off, with the range of the three cases. */
export function ResultHeadline({ result, caseKey }: { result: SimulationResultDto; caseKey: CaseKey }) {
  const selected = caseOf(result, caseKey)
  const diff = selected.difference.totalResult
  const negative = isNegative(diff)
  const pess = caseOf(result, 'pessimistic').difference.totalResult
  const opt = caseOf(result, 'optimistic').difference.totalResult

  return (
    <div className={`rounded-2xl border p-6 ${negative ? 'border-bad-200 bg-bad-50' : 'border-good-200 bg-good-50'}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
        {caseLabels[caseKey]} case · over {result.horizonMonths} months
      </div>
      <div className={`mt-2 font-mono text-4xl font-medium leading-none md:text-5xl ${negative ? 'text-bad' : 'text-good-dark'}`}>
        {formatEuroDelta(diff)}
      </div>
      <p className={`mt-2 text-sm font-semibold ${negative ? 'text-bad' : 'text-good-dark'}`}>
        {negative ? 'less' : 'more'} than keeping things as they are (which earns {formatEuroWhole(result.baselineSummary.totalResult)} in this period)
      </p>
      <p className="mt-3 text-sm text-muted">
        Range: <strong className="font-mono text-ink">{formatEuroDelta(pess)}</strong> if it goes badly, up to{' '}
        <strong className="font-mono text-ink">{formatEuroDelta(opt)}</strong> if it goes well.
      </p>
    </div>
  )
}

export function KeyFacts({ result, horizonMonths }: { result: CaseResultDto; horizonMonths: number }) {
  const d = result.drivers
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Monthly result catches up"
        value={d.breakEvenMonth ? `Month ${d.breakEvenMonth}` : 'Not yet'}
        textValue
        sub={d.breakEvenMonth ? 'first month earning at least what today earns; the total can still be behind' : `not within ${horizonMonths} months`}
      />
      <MetricCard
        label="Lowest cash"
        value={formatEuroWhole(result.summary.lowestCash)}
        deltaTone={isNegative(result.summary.lowestCash) ? 'bad' : 'neutral'}
        delta={isNegative(result.summary.lowestCash) ? 'below zero' : undefined}
        sub={`in month ${result.summary.lowestCashMonth}`}
      />
      <MetricCard
        label="New visits needed"
        value={d.breakEvenNewVisitsPerMonth ? formatCount(d.breakEvenNewVisitsPerMonth) : '—'}
        sub={d.breakEvenNewVisitsPerMonth ? 'per month to cover the added costs' : 'no added monthly cost'}
      />
      <MetricCard
        label="Cash after"
        value={formatEuroWhole(result.summary.endCash)}
        delta={`${formatEuroDelta(result.difference.endCash)} vs no change`}
        deltaTone={isNegative(result.difference.endCash) ? 'bad' : 'good'}
        sub={`end of month ${horizonMonths}`}
      />
    </div>
  )
}

/** Cash shortfall flag: every case with a month below zero is named. */
export function CashWarning({ result }: { result: SimulationResultDto }) {
  const short = result.cases.filter((c) => c.shortfallMonths.length > 0)
  if (short.length === 0)
    return (
      <InfoBox tone="good" icon={<CheckCircle2 size={18} />}>
        Cash stays above zero every month, in all three cases.
      </InfoBox>
    )
  return (
    <InfoBox tone="bad" icon={<AlertTriangle size={18} />}>
      <strong>Cash could run out.</strong>
      <ul className="mt-1 space-y-0.5">
        {short.map((c) => (
          <li key={c.case}>
            {caseLabels[c.case]} case: below zero in month{c.shortfallMonths.length > 1 ? 's' : ''} {listMonths(c.shortfallMonths)}, lowest{' '}
            <span className="font-mono">{formatEuroWhole(c.summary.lowestCash)}</span> in month {c.summary.lowestCashMonth}.
          </li>
        ))}
      </ul>
    </InfoBox>
  )
}

const listMonths = (months: number[]) =>
  months.length > 4 ? `${months.slice(0, 3).join(', ')} … ${months[months.length - 1]}` : months.join(', ')

