import type { ChangeType, MonthResultDto, SimulationResultDto, CaseKey } from '../../api/client'
import type { MapKey, MapNode } from '../../components/BusinessMap'
import { formatCount, formatCountPrecise, formatEuro, formatEuroDelta, formatEuroWhole, formatPercent, isZero } from '../../lib/format'

export const caseOf = (result: SimulationResultDto, key: CaseKey) => result.cases.find((c) => c.case === key)!

/** Business-map values for one month of a run. */
export function mapNodes(m: MonthResultDto, resultDelta?: string): Record<MapKey, MapNode> {
  const unserved = !isZero(m.unservedDemand)
  return {
    demand: { value: formatCount(m.demand), sub: 'visits wanted / month' },
    capacity: { value: formatCount(m.capacity), sub: 'visits possible / month' },
    served: {
      value: formatCount(m.servicesDelivered),
      sub: unserved ? `${formatCount(m.unservedDemand)} not served` : `${formatPercent(m.utilisation)} of capacity used`,
    },
    revenue: { value: formatEuroWhole(m.revenue), sub: `${formatCountPrecise(m.servicesDelivered)} × ${formatEuro(m.averagePrice)}` },
    variableCosts: { value: formatEuroWhole(m.variableCosts), sub: 'products & supplies' },
    contribution: { value: formatEuroWhole(m.contribution), sub: 'left to pay fixed costs' },
    fixedCosts: { value: formatEuroWhole(m.fixedCosts), sub: 'wages, rent, marketing' },
    result: {
      value: formatEuroWhole(m.monthlyResult),
      sub: resultDelta && !isZero(resultDelta) ? `${formatEuroDelta(resultDelta)} vs today` : 'per month',
    },
  }
}

/** Which business-map boxes a decision changes. */
export function highlightedFor(types: ChangeType[]): MapKey[] {
  const keys = new Set<MapKey>()
  for (const t of types) {
    if (t === 'hire') ['capacity', 'demand', 'served', 'fixedCosts', 'result'].forEach((k) => keys.add(k as MapKey))
    if (t === 'price') ['demand', 'revenue', 'contribution', 'result'].forEach((k) => keys.add(k as MapKey))
    if (t === 'marketing') ['demand', 'served', 'fixedCosts', 'result'].forEach((k) => keys.add(k as MapKey))
  }
  return [...keys]
}
