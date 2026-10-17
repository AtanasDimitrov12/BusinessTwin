import { Card, PageHeader, Spinner } from '../../components/ui/primitives'
import { SourceBadge } from '../../components/ui/SourceBadge'
import { formatCount, formatCountPrecise, formatEuro, formatEuroWhole, formatPercent } from '../../lib/format'
import { useBaseline, useBaselineSummary } from '../baseline/baseline'
import { baselineFields, formatField } from '../baseline/fields'
import { useBusiness } from '../business/business'
import { changeMeta, describeChange } from '../scenarios/changeForm'
import { useScenarios } from '../scenarios/scenarios'

/** Every number comes from somewhere: what was entered, what was calculated, and what stays uncertain. */
export function AssumptionsPage() {
  const business = useBusiness()
  const baseline = useBaseline()
  const summary = useBaselineSummary(!!baseline.data)
  const scenarios = useScenarios()

  if (baseline.isPending || summary.isPending) return <Spinner />
  const b = baseline.data
  const s = summary.data
  if (!b || !s) return null

  const calculated = [
    { label: 'Visits possible per month', value: formatCount(s.capacity), method: `${formatCountPrecise(b.staffHoursPerMonth)} staff hours ÷ ${formatCountPrecise(b.serviceTimeHours)} h per visit` },
    { label: 'Visits served', value: formatCount(s.servicesDelivered), method: 'The smaller of visits wanted and visits possible' },
    { label: 'Staff busy', value: formatPercent(s.utilisation), method: 'Visits served ÷ visits possible' },
    { label: 'Sales', value: formatEuroWhole(s.revenue), method: `Visits served × ${formatEuro(b.averagePrice)}` },
    { label: 'Cost of services', value: formatEuroWhole(s.variableCosts), method: `Visits served × ${formatEuro(b.costPerService)}` },
    { label: 'Contribution', value: formatEuroWhole(s.contribution), method: 'Sales − cost of services' },
    { label: 'Fixed costs', value: formatEuroWhole(s.fixedCosts), method: 'Wages + other fixed costs' },
    { label: 'Monthly result', value: formatEuroWhole(s.monthlyResult), method: 'Contribution − fixed costs' },
    { label: 'Cash after one month', value: formatEuroWhole(s.cashAfterOneMonth), method: 'Cash today + monthly result' },
  ]

  return (
    <div className="max-w-4xl">
      <PageHeader title="Assumptions" sub="Every number comes from somewhere. Here is what you entered, what Business Twin calculated, and what stays uncertain." />

      <Section title="What you told us">
        <Table head={['Input', 'Value', 'Source']}>
          <Row cells={['Salon', business.data?.name ?? '—', <SourceBadge key="s" source="entered" />]} />
          <Row cells={['Staff', String(business.data?.staffCount ?? '—'), <SourceBadge key="s" source="entered" />]} />
          {baselineFields.map((f) => (
            <Row key={f.name} cells={[f.label, formatField(f, b[f.name]), <SourceBadge key="s" source={b.sources[f.name] ?? 'entered'} />]} />
          ))}
        </Table>
      </Section>

      <Section title="What was calculated">
        <Table head={['Figure', 'Value', 'How']}>
          {calculated.map((c) => (
            <Row key={c.label} cells={[c.label, c.value, <span key="m" className="text-xs text-muted">{c.method}</span>]} />
          ))}
        </Table>
      </Section>

      {scenarios.data && scenarios.data.length > 0 && (
        <Section title="Plan assumptions">
          <div className="space-y-3">
            {scenarios.data.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="mb-1 font-semibold">{p.name}</div>
                <ul className="space-y-1 text-sm text-muted">
                  {p.changes.map((c, i) => (
                    <li key={i}>
                      <span className="font-medium text-ink">{changeMeta[c.type].short}:</span> {describeChange(c, formatEuroWhole)}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section title="What stays uncertain">
        <Card className="p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-muted">
            {[
              'How many new customers a hire or a campaign brings. This is the central unknown, which is why you enter three values.',
              'Whether customers who move to a new colleague stay, and whether some leave.',
              'How customers react to a price change. This is your estimate, not a prediction.',
              'Seasons, holidays and one-off events that make a month unusual.',
              'Payment timing, taxes, holiday allowance timing and one-off costs, which are not modelled yet.',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 font-bold text-amber">—</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="border-b border-line bg-canvas">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`p-3.5 text-[11px] font-bold uppercase tracking-wider text-muted ${i === 1 ? 'text-right' : 'text-left'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">{children}</tbody>
      </table>
    </Card>
  )
}

function Row({ cells }: { cells: React.ReactNode[] }) {
  return (
    <tr>
      <td className="p-3.5">{cells[0]}</td>
      <td className="p-3.5 text-right font-mono text-navy">{cells[1]}</td>
      <td className="p-3.5">{cells[2]}</td>
    </tr>
  )
}
