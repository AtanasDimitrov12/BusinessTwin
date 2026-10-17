import { Link } from 'react-router-dom'
import type { BaselineDto, BaselineSummaryDto } from '../../api/client'
import { SourceBadge } from '../../components/SourceBadge'
import { formatCount, formatEuro, formatPercent, isNegative, isZero } from '../../lib/format'
import { useBaselineSummary } from './baseline'
import { baselineFields } from './fields'

/** Baseline dashboard and business map: the inputs with their labels, and what the engine calculates from them. */
export function BaselineDashboard({ baseline }: { baseline: BaselineDto }) {
  const summary = useBaselineSummary(true)

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <h1>Your salon in a normal month</h1>
          <Link to="/baseline/edit" className="button secondary">
            Correct figures
          </Link>
        </div>
        {summary.isPending && <p className="muted">Calculating…</p>}
        {summary.error && <p className="form-error">{summary.error.message}</p>}
        {summary.data && <BusinessMap summary={summary.data} />}
      </section>

      <section className="card">
        <h2>What you entered</h2>
        <dl className="inputs">
          {baselineFields.map((f) => (
            <div key={f.name}>
              <dt>{f.label}</dt>
              <dd>
                {f.unit.startsWith('€') ? formatEuro(baseline[f.name]) : formatCount(baseline[f.name])}{' '}
                {!f.unit.startsWith('€') && <span className="unit">{f.unit}</span>}
                <SourceBadge source={baseline.sources[f.name] ?? 'entered'} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

function BusinessMap({ summary }: { summary: BaselineSummaryDto }) {
  const s = summary
  return (
    <>
      <h2>Staff capacity</h2>
      <p>
        Your team can serve <strong>{formatCount(s.capacity)}</strong> visits a month and serves{' '}
        <strong>{formatCount(s.servicesDelivered)}</strong> ({formatPercent(s.utilisation)} busy).
      </p>
      <div className="meter" role="img" aria-label={`Utilisation ${formatPercent(s.utilisation)}`}>
        {/* CSS does the width: no arithmetic in JavaScript. Capped at 100% by the engine (served ≤ capacity). */}
        <div className="meter-fill" style={{ width: `calc(${s.utilisation} * 100%)` }} />
      </div>
      <p className="muted">
        {!isZero(s.unservedDemand)
          ?`${formatCount(s.unservedDemand)} wanted visits could not be served.`
          : `${formatCount(s.unusedCapacity)} visits of free capacity.`}
      </p>

      <h2>Money per month</h2>
      <table className="money">
        <tbody>
          <MoneyRow label="Sales" value={s.revenue} />
          <MoneyRow label="Cost of services" value={s.variableCosts} negative />
          <MoneyRow label="Contribution" value={s.contribution} strong />
          <MoneyRow label="Fixed costs (wages, rent, other)" value={s.fixedCosts} negative />
          <MoneyRow label="Monthly result" value={s.monthlyResult} strong />
          <MoneyRow label="Cash after one month" value={s.cashAfterOneMonth} />
        </tbody>
      </table>
    </>
  )
}

function MoneyRow({ label, value, negative, strong }: { label: string; value: string; negative?: boolean; strong?: boolean }) {
  return (
    <tr className={strong ? 'strong' : undefined}>
      <th scope="row">{label}</th>
      <td className={isNegative(value) ? 'negative' : undefined}>
        {negative ? '− ' : ''}
        {formatEuro(value)}
      </td>
      <td>
        <SourceBadge source="calculated" />
      </td>
    </tr>
  )
}
