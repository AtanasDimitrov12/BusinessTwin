import { ArrowRight, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { BaselineDto, BaselineSummaryDto, BusinessDto } from '../../api/client'
import { BusinessMap } from '../../components/BusinessMap'
import { ButtonLink } from '../../components/ui/Button'
import { Card, ErrorNote, InfoBox, MetricCard, PageHeader, Spinner } from '../../components/ui/primitives'
import { SourceBadge } from '../../components/ui/SourceBadge'
import { formatCount, formatEuro, formatEuroWhole, formatPercent, isNegative, isZero } from '../../lib/format'
import { useScenarios } from '../scenarios/scenarios'
import { useBaselineSummary } from './baseline'
import { baselineFields, formatField } from './fields'

/** Baseline dashboard and business map (BPMN: show baseline → owner checks it). */
export function BaselinePage({ business, baseline }: { business: BusinessDto; baseline: BaselineDto }) {
  const summary = useBaselineSummary(true)
  const plans = useScenarios()
  const samples = baselineFields.filter((f) => baseline.sources[f.name] === 'sample').length

  return (
    <div>
      <PageHeader
        title={business.name}
        sub="Your salon in a normal month: the starting point every decision is compared with."
        actions={
          <>
            <ButtonLink to="/app/setup" variant="secondary">
              <Pencil size={15} /> Correct figures
            </ButtonLink>
            <ButtonLink to="/app/decide">
              Test a decision <ArrowRight size={16} />
            </ButtonLink>
          </>
        }
      />

      {samples > 0 && (
        <div className="mb-6">
          <InfoBox tone="amber">
            {samples} value{samples > 1 ? 's come' : ' comes'} from the sample salon.{' '}
            <Link to="/app/setup" className="font-semibold underline">
              Replace them with your own figures
            </Link>{' '}
            for results that fit your salon.
          </InfoBox>
        </div>
      )}

      {summary.isPending && <Spinner label="Calculating…" />}
      <ErrorNote error={summary.error} />
      {summary.data && <Overview baseline={baseline} summary={summary.data} planCount={plans.data?.length ?? 0} />}

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-semibold">What you entered</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {baselineFields.map((f) => (
            <div key={f.name}>
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-mono text-ink">
                {formatField(f, baseline[f.name])}
                <SourceBadge source={baseline.sources[f.name] ?? 'entered'} />
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}

function Overview({ baseline, summary: s, planCount }: { baseline: BaselineDto; summary: BaselineSummaryDto; planCount: number }) {
  const limited = !isZero(s.unservedDemand)
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Customers served" value={formatCount(s.servicesDelivered)} sub={`${formatPercent(s.utilisation)} of team time used`} />
        <MetricCard label="Sales" value={formatEuroWhole(s.revenue)} sub={`${formatCount(s.servicesDelivered)} × ${formatEuro(baseline.averagePrice)}`} />
        <MetricCard label="Contribution" value={formatEuroWhole(s.contribution)} sub="sales − cost of services" />
        <MetricCard
          label="Monthly result"
          value={formatEuroWhole(s.monthlyResult)}
          accent
          sub="contribution − fixed costs"
          deltaTone={isNegative(s.monthlyResult) ? 'bad' : 'good'}
          delta={isNegative(s.monthlyResult) ? 'loss per month' : 'profit per month'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-7">
          <h2 className="font-display text-lg font-semibold">Business map</h2>
          <p className="mb-5 text-xs text-muted">How your numbers connect, from customers to the monthly result.</p>
          <BusinessMap
            capacityLimited={limited}
            resultTone={isNegative(s.monthlyResult) ? 'bad' : 'navy'}
            nodes={{
              demand: { value: formatCount(baseline.visitsPerMonth), sub: 'visits wanted / month' },
              capacity: { value: formatCount(s.capacity), sub: 'visits possible / month' },
              served: {
                value: formatCount(s.servicesDelivered),
                sub: limited ? `${formatCount(s.unservedDemand)} not served` : `${formatPercent(s.utilisation)} of capacity`,
              },
              revenue: { value: formatEuroWhole(s.revenue), sub: `× ${formatEuro(baseline.averagePrice)} per visit` },
              variableCosts: { value: formatEuroWhole(s.variableCosts), sub: `× ${formatEuro(baseline.costPerService)} per visit` },
              contribution: { value: formatEuroWhole(s.contribution), sub: 'left to pay fixed costs' },
              fixedCosts: { value: formatEuroWhole(s.fixedCosts), sub: 'wages, rent, other' },
              result: { value: formatEuroWhole(s.monthlyResult), sub: 'per month' },
            }}
          />
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold">Monthly breakdown</h3>
            <dl className="space-y-2.5 text-sm">
              <Line label="Sales" value={formatEuroWhole(s.revenue)} />
              <Line label="Cost of services" value={`− ${formatEuroWhole(s.variableCosts)}`} tone="bad" />
              <Line label="Contribution" value={formatEuroWhole(s.contribution)} strong />
              <Line label="Fixed costs" value={`− ${formatEuroWhole(s.fixedCosts)}`} tone="bad" />
              <Line label="Monthly result" value={formatEuroWhole(s.monthlyResult)} strong tone={isNegative(s.monthlyResult) ? 'bad' : 'good'} />
              <Line label="Cash after one month" value={formatEuroWhole(s.cashAfterOneMonth)} />
            </dl>
            <p className="mt-4 text-[11px] text-muted">
              All figures <SourceBadge source="calculated" /> from your inputs.
            </p>
          </Card>

          <div className="rounded-2xl bg-navy p-6 text-white shadow-lift">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">{limited ? 'Customers you cannot serve' : 'Free capacity'}</div>
            <div className="mt-1 font-mono text-4xl font-medium">{formatCount(limited ? s.unservedDemand : s.unusedCapacity)}</div>
            <div className="mb-6 mt-1 text-sm text-white/70">
              {limited ? 'visits a month: your team is fully booked' : `visits a month unused (${formatPercent(s.utilisation)} booked)`}
            </div>
            <ButtonLink to="/app/decide" variant="light" className="w-full">
              Test a decision <ArrowRight size={16} />
            </ButtonLink>
            {planCount > 0 && (
              <Link to="/app/plans" className="mt-3 block text-center text-sm text-white/75 hover:text-white">
                Compare your {planCount} saved plan{planCount > 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'good' | 'bad' }) {
  return (
    <div className={`flex justify-between ${strong ? 'border-t border-line pt-2 font-semibold' : ''}`}>
      <dt className={strong ? 'text-ink' : 'text-muted'}>{label}</dt>
      <dd className={`font-mono ${tone === 'bad' ? 'text-bad' : tone === 'good' ? 'text-good' : 'text-ink'}`}>{value}</dd>
    </div>
  )
}
