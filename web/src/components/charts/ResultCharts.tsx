import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CaseResultDto, MonthResultDto, SimulationResultDto, WaterfallStepDto } from '../../api/client'
import { formatCount, formatEuroDelta, formatEuroWhole, isNegative, toPlot } from '../../lib/format'
import { caseLabels } from '../../lib/cases'
import { ChartTooltip, Legend } from './chartKit'
import { axisProps, chartColors as c, euroTick } from './chartTheme'

// Every chart keeps the API's exact strings next to the plotted numbers; tooltips and labels read the strings.

type TooltipArgs<T> = { active?: boolean; payload?: ReadonlyArray<{ payload?: T }> }
const datum = <T,>(args: TooltipArgs<T>) => args.payload?.[0]?.payload

/** Monthly difference with the baseline (bars) and the running total (line). */
export function ImpactChart({ result }: { result: CaseResultDto }) {
  const data = result.resultDifferenceByMonth.map((diff, i) => ({
    month: `M${i + 1}`,
    diff: toPlot(diff),
    cum: toPlot(result.cumulativeGapByMonth[i]),
    diffLabel: diff,
    cumLabel: result.cumulativeGapByMonth[i],
  }))
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis tickFormatter={euroTick} width={56} {...axisProps} />
          <ReferenceLine y={0} stroke={c.ink} strokeOpacity={0.25} />
          <Tooltip
            cursor={{ fill: c.grid, opacity: 0.5 }}
            content={(args: TooltipArgs<(typeof data)[number]>) => {
              const d = datum(args)
              return d ? (
                <ChartTooltip
                  active={args.active}
                  title={`Month ${d.month.slice(1)}`}
                  rows={[
                    { label: 'This month vs baseline', value: formatEuroDelta(d.diffLabel), color: c.navy },
                    { label: 'Running total', value: formatEuroDelta(d.cumLabel), color: c.amber },
                  ]}
                />
              ) : null
            }}
          />
          <Bar dataKey="diff" radius={[5, 5, 0, 0]} maxBarSize={44}>
            {data.map((d) => (
              <Cell key={d.month} fill={isNegative(d.diffLabel) ? c.bad : c.good} fillOpacity={0.8} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="cum" stroke={c.amber} strokeWidth={2.5} dot={{ r: 3, fill: c.amber, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <Legend
        items={[
          { label: 'Monthly result vs baseline', color: c.good },
          { label: 'Running total since the change', color: c.amber },
        ]}
      />
    </div>
  )
}

/** Cash at the end of each month, with and without the decision. Below the zero line = cash shortfall. */
export function CashChart({ baseline, result }: { baseline: MonthResultDto[]; result: CaseResultDto }) {
  const data = result.months.map((m, i) => ({
    month: `M${m.month}`,
    scenario: toPlot(m.cashAtEnd),
    base: toPlot(baseline[i].cashAtEnd),
    scenarioLabel: m.cashAtEnd,
    baseLabel: baseline[i].cashAtEnd,
    shortfall: m.cashShortfall,
  }))
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis tickFormatter={euroTick} width={56} {...axisProps} />
          <ReferenceLine
            y={0}
            stroke={c.bad}
            strokeDasharray="5 4"
            label={{ value: 'no cash left', position: 'insideBottomRight', fontSize: 10, fill: c.bad, fontWeight: 600 }}
          />
          <Tooltip
            content={(args: TooltipArgs<(typeof data)[number]>) => {
              const d = datum(args)
              return d ? (
                <ChartTooltip
                  active={args.active}
                  title={`End of month ${d.month.slice(1)}${d.shortfall ? ' · cash shortfall' : ''}`}
                  rows={[
                    { label: 'With the decision', value: formatEuroWhole(d.scenarioLabel), color: c.amber },
                    { label: 'Without (baseline)', value: formatEuroWhole(d.baseLabel), color: c.navy },
                  ]}
                />
              ) : null
            }}
          />
          <Line type="monotone" dataKey="base" stroke={c.navy} strokeWidth={2} strokeDasharray="6 4" dot={false} />
          <Line
            type="monotone"
            dataKey="scenario"
            stroke={c.amber}
            strokeWidth={2.5}
            dot={(props: { cx?: number; cy?: number; index?: number }) => (
              <circle
                key={props.index}
                cx={props.cx}
                cy={props.cy}
                r={data[props.index ?? 0]?.shortfall ? 5 : 3}
                fill={data[props.index ?? 0]?.shortfall ? c.bad : c.amber}
              />
            )}
          />
        </LineChart>
      </ResponsiveContainer>
      <Legend
        items={[
          { label: 'Cash with the decision', color: c.amber },
          { label: 'Cash without it', color: c.navy, dashed: true },
        ]}
      />
    </div>
  )
}

/** Total result over the horizon for the baseline and each case. */
export function CaseRangeChart({ result }: { result: SimulationResultDto }) {
  const data = [
    { name: 'Baseline', value: toPlot(result.baselineSummary.totalResult), label: result.baselineSummary.totalResult, tone: 'base' as const },
    ...(['pessimistic', 'expected', 'optimistic'] as const).map((k) => {
      const r = result.cases.find((x) => x.case === k)!
      return {
        name: caseLabels[k],
        value: toPlot(r.summary.totalResult),
        label: r.summary.totalResult,
        delta: r.difference.totalResult,
        tone: isNegative(r.difference.totalResult) ? ('bad' as const) : ('good' as const),
      }
    }),
  ]
  const fill = { base: c.navy, good: c.good, bad: c.bad }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis tickFormatter={euroTick} width={56} {...axisProps} />
        <ReferenceLine y={data[0].value} stroke={c.amber} strokeDasharray="5 3" strokeWidth={1.5} />
        <ReferenceLine y={0} stroke={c.ink} strokeOpacity={0.25} />
        <Tooltip
          cursor={{ fill: c.grid, opacity: 0.5 }}
          content={(args: TooltipArgs<(typeof data)[number]>) => {
            const d = datum(args)
            return d ? (
              <ChartTooltip
                active={args.active}
                title={d.name}
                rows={[
                  { label: `Result over ${result.horizonMonths} months`, value: formatEuroWhole(d.label) },
                  ...('delta' in d && d.delta ? [{ label: 'vs baseline', value: formatEuroDelta(d.delta) }] : []),
                ]}
              />
            ) : null
          }}
        />
        <Bar dataKey="value" radius={[7, 7, 0, 0]} maxBarSize={72}>
          {data.map((d) => (
            <Cell key={d.name} fill={fill[d.tone]} />
          ))}
          <LabelList
            dataKey="label"
            position="top"
            formatter={(v: unknown) => formatEuroWhole(String(v))}
            style={{ fontSize: 11, fontFamily: 'DM Mono', fill: c.ink }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const stepLabels: Record<string, string> = {
  baseline: 'Without the decision',
  extraVisits: 'Extra visits',
  price: 'Price effect',
  wages: 'Added wages',
  marketing: 'Marketing spend',
  scenario: 'With the decision',
}

/** From the baseline total, through each cause, to the scenario total. */
export function WaterfallChart({ steps }: { steps: WaterfallStepDto[] }) {
  const data = steps.map((s) => ({
    name: stepLabels[s.key] ?? s.key,
    range: [toPlot(s.low), toPlot(s.high)] as [number, number],
    amount: s.amount,
    total: s.key === 'baseline' || s.key === 'scenario',
    negative: isNegative(s.amount),
  }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" interval={0} {...axisProps} tick={{ fontSize: 10, fill: c.axis }} />
        <YAxis tickFormatter={euroTick} width={56} {...axisProps} />
        <ReferenceLine y={0} stroke={c.ink} strokeOpacity={0.25} />
        <Tooltip
          cursor={{ fill: c.grid, opacity: 0.5 }}
          content={(args: TooltipArgs<(typeof data)[number]>) => {
            const d = datum(args)
            return d ? (
              <ChartTooltip
                active={args.active}
                title={d.name}
                rows={[{ label: d.total ? 'Total result' : 'Effect', value: d.total ? formatEuroWhole(d.amount) : formatEuroDelta(d.amount) }]}
              />
            ) : null
          }}
        />
        <Bar dataKey="range" radius={[5, 5, 5, 5]} maxBarSize={64}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.total ? (d.negative ? c.bad : c.navy) : d.negative ? c.bad : c.good} />
          ))}
          <LabelList
            dataKey="amount"
            position="top"
            formatter={(v: unknown) => {
              const s = String(v)
              return data.find((d) => d.amount === s)?.total ? formatEuroWhole(s) : formatEuroDelta(s)
            }}
            style={{ fontSize: 10, fontFamily: 'DM Mono', fill: c.ink }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Visits wanted vs visits the team can deliver, per month. */
export function CapacityChart({ result }: { result: CaseResultDto }) {
  const data = result.months.map((m) => ({
    month: `M${m.month}`,
    demand: toPlot(m.demand),
    capacity: toPlot(m.capacity),
    served: toPlot(m.servicesDelivered),
    labels: m,
  }))
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis width={44} {...axisProps} />
          <Tooltip
            content={(args: TooltipArgs<(typeof data)[number]>) => {
              const d = datum(args)
              return d ? (
                <ChartTooltip
                  active={args.active}
                  title={`Month ${d.labels.month}`}
                  rows={[
                    { label: 'Visits wanted', value: formatCount(d.labels.demand), color: c.amber },
                    { label: 'Visits possible', value: formatCount(d.labels.capacity), color: c.navy },
                    { label: 'Visits served', value: formatCount(d.labels.servicesDelivered), color: c.good },
                  ]}
                />
              ) : null
            }}
          />
          <Line type="stepAfter" dataKey="capacity" stroke={c.navy} strokeWidth={2} strokeDasharray="6 4" dot={false} />
          <Line type="monotone" dataKey="demand" stroke={c.amber} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="served" stroke={c.good} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <Legend
        items={[
          { label: 'Visits wanted (demand)', color: c.amber },
          { label: 'Visits possible (capacity)', color: c.navy, dashed: true },
          { label: 'Visits served', color: c.good },
        ]}
      />
    </div>
  )
}
