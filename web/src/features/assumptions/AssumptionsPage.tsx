import { ArrowLeftRight, ArrowRight, CalendarDays, ChevronRight, Pencil, Receipt, Tag, Users, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { BaselineDto, BaselineSummaryDto, ChangeDto, EstimateDto, ScenarioDto, SourceLabel } from '../../api/client'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Badge, Card, InfoBox, PageHeader, Spinner } from '../../components/ui/primitives'
import { SourceBadge } from '../../components/ui/SourceBadge'
import {
  formatCount,
  formatCountPrecise,
  formatEuro,
  formatEuroWhole,
  formatHours,
  formatPercent,
  formatPercentPoints,
  isNegative,
} from '../../lib/format'
import { useBaseline, useBaselineSummary } from '../baseline/baseline'
import { baselineFields, formatField, type WizardStep } from '../baseline/fields'
import { useBusiness } from '../business/business'
import { changeMeta } from '../scenarios/changeForm'
import { useScenarios } from '../scenarios/scenarios'

// Read top to bottom like a story: what you told us → how it is worked out → the guesses in your plans → what no
// one can know. Every figure is a string from the API, only formatted here; nothing is calculated in the browser.

const sections = [
  { id: 'inputs', title: 'What you told us' },
  { id: 'calculation', title: 'How the numbers are worked out' },
  { id: 'plans', title: 'The guesses in your plans' },
  { id: 'unknowns', title: 'What no one can know for sure' },
] as const

export function AssumptionsPage() {
  const business = useBusiness()
  const baseline = useBaseline()
  const summary = useBaselineSummary(!!baseline.data)
  const scenarios = useScenarios()

  if (baseline.isPending || summary.isPending) return <Spinner />
  const b = baseline.data
  const s = summary.data
  if (!b || !s) return null
  const plans = scenarios.data ?? []
  const visible = sections.filter((x) => x.id !== 'plans' || plans.length > 0)

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Assumptions"
        sub="Where every number comes from: what you told us, how Business Twin works it out, and what stays uncertain."
      />

      <nav aria-label="On this page" className="-mt-2 mb-12 flex flex-wrap gap-2">
        {visible.map((x, i) => (
          <a
            key={x.id}
            href={`#${x.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-surface py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-ink shadow-card transition-[background-color,scale] duration-150 ease-out hover:bg-accent-50 active:scale-[0.97]"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">{i + 1}</span>
            {x.title}
          </a>
        ))}
      </nav>

      <div className="space-y-16">
        <Section n={1} id="inputs" title="What you told us" intro="A normal month in your salon. Every decision you test is compared with this starting point.">
          <Inputs baseline={b} salonName={business.data?.name} staffCount={business.data?.staffCount} />
        </Section>

        <Section
          n={2}
          id="calculation"
          title="How the numbers are worked out"
          intro="Business Twin turns your figures into one month’s result, step by step. Each line uses your own numbers, so you can check it."
        >
          <Calculation baseline={b} summary={s} />
        </Section>

        {plans.length > 0 && (
          <Section
            n={3}
            id="plans"
            title="The guesses in your plans"
            intro="For anything uncertain you gave three values. The model runs once with each, which gives the three cases you see in results."
          >
            <PlanList plans={plans} />
          </Section>
        )}

        <Section
          n={plans.length > 0 ? 4 : 3}
          id="unknowns"
          title="What no one can know for sure"
          intro="These are the limits of any estimate. Keep them in mind when you read a result."
        >
          <Unknowns />
        </Section>
      </div>
    </div>
  )
}

function Section({ n, id, title, intro, children }: { n: number; id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8">
      <div className="mb-5 flex gap-4">
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white" aria-hidden>
          {n}
        </span>
        <div>
          <h2 id={`${id}-title`} className="font-display text-2xl font-bold leading-tight md:text-[1.75rem]">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted">{intro}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

// ── 1. Inputs ─────────────────────────────────────────────────────────────

const groups: { step: WizardStep; title: string }[] = [
  { step: 'customers', title: 'Customers and prices' },
  { step: 'time', title: 'Team time' },
  { step: 'costs', title: 'Costs and cash' },
]

const sourceMeaning: Record<SourceLabel, string> = {
  entered: 'you know this',
  estimated: 'your best guess',
  sample: 'from the sample salon',
}

function Inputs({ baseline, salonName, staffCount }: { baseline: BaselineDto; salonName?: string; staffCount?: number }) {
  const sourceOf = (name: (typeof baselineFields)[number]['name']) => baseline.sources[name] ?? 'entered'
  const samples = baselineFields.filter((f) => sourceOf(f.name) === 'sample')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px]">
          <strong className="font-semibold">{salonName ?? 'Your salon'}</strong>
          {staffCount !== undefined && <span className="text-muted"> · {staffCount} {staffCount === 1 ? 'person' : 'people'} serving customers</span>}
        </p>
        <ButtonLink to="/app/setup" variant="secondary" size="sm">
          <Pencil size={13} aria-hidden /> Edit salon figures
        </ButtonLink>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.step} className="p-5">
            <h3 className="mb-4 text-[13px] font-semibold text-muted">{g.title}</h3>
            <dl className="space-y-4">
              {baselineFields
                .filter((f) => f.step === g.step)
                .map((f) => (
                  <div key={f.name}>
                    <dt className="text-[13px] text-muted">{f.label}</dt>
                    <dd className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-lg font-semibold text-ink">{formatField(f, baseline[f.name])}</span>
                      <SourceBadge source={sourceOf(f.name)} />
                    </dd>
                  </div>
                ))}
            </dl>
          </Card>
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="font-medium text-ink">Labels:</span>
        {(['entered', 'estimated', 'sample'] as const).map((src) => (
          <span key={src} className="inline-flex items-center gap-1.5">
            <SourceBadge source={src} /> {sourceMeaning[src]}
          </span>
        ))}
      </p>

      {samples.length > 0 && (
        <InfoBox tone="amber">
          {samples.length === 1 ? 'One figure is' : `${samples.length} figures are`} still from the sample salon:{' '}
          <strong>{samples.map((f) => f.label.toLowerCase()).join(', ')}</strong>. Replace {samples.length === 1 ? 'it' : 'them'} with your own
          numbers so the results fit your salon.
        </InfoBox>
      )}
    </div>
  )
}

// ── 2. Calculation ────────────────────────────────────────────────────────

type Step = { label: string; value: string; formula: ReactNode; strong?: boolean; tone?: 'good' | 'bad' }

/** A value inside a formula: shown as a soft chip so the eye can tell numbers from words. */
function V({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap rounded-md bg-black/[0.045] px-1.5 py-0.5 font-mono text-[13px] font-medium text-ink">{children}</span>
}

function Calculation({ baseline: b, summary: s }: { baseline: BaselineDto; summary: BaselineSummaryDto }) {
  const resultTone = isNegative(s.monthlyResult) ? 'bad' : 'good'
  const stages: { title: string; steps: Step[] }[] = [
    {
      title: 'Customers and team time',
      steps: [
        {
          label: 'Visits your team can do',
          value: formatCount(s.capacity),
          formula: (
            <>
              <V>{formatHours(b.staffHoursPerMonth)} h</V> staff time ÷ <V>{formatHours(b.serviceTimeHours)} h</V> per visit
            </>
          ),
        },
        {
          label: 'Visits served',
          value: formatCount(s.servicesDelivered),
          formula: (
            <>
              the smaller of <V>{formatCount(b.visitsPerMonth)}</V> wanted and <V>{formatCount(s.capacity)}</V> possible
            </>
          ),
        },
        {
          label: 'Team busy',
          value: formatPercent(s.utilisation),
          formula: (
            <>
              <V>{formatCount(s.servicesDelivered)}</V> served ÷ <V>{formatCount(s.capacity)}</V> possible
            </>
          ),
        },
      ],
    },
    {
      title: 'Money in a month',
      steps: [
        {
          label: 'Sales',
          value: formatEuroWhole(s.revenue),
          formula: (
            <>
              <V>{formatCount(s.servicesDelivered)}</V> visits × <V>{formatEuro(b.averagePrice)}</V> average price
            </>
          ),
        },
        {
          label: 'Cost of services',
          value: formatEuroWhole(s.variableCosts),
          formula: (
            <>
              <V>{formatCount(s.servicesDelivered)}</V> visits × <V>{formatEuro(b.costPerService)}</V> per visit
            </>
          ),
        },
        {
          label: 'Left after cost of services',
          value: formatEuroWhole(s.contribution),
          formula: (
            <>
              <V>{formatEuroWhole(s.revenue)}</V> sales − <V>{formatEuroWhole(s.variableCosts)}</V> cost of services
            </>
          ),
        },
        {
          label: 'Fixed costs',
          value: formatEuroWhole(s.fixedCosts),
          formula: (
            <>
              <V>{formatEuroWhole(b.wagesPerMonth)}</V> wages + <V>{formatEuroWhole(b.otherFixedCostsPerMonth)}</V> other fixed costs
            </>
          ),
        },
        {
          label: 'Monthly result',
          value: formatEuroWhole(s.monthlyResult),
          strong: true,
          tone: resultTone,
          formula: (
            <>
              <V>{formatEuroWhole(s.contribution)}</V> left − <V>{formatEuroWhole(s.fixedCosts)}</V> fixed costs
            </>
          ),
        },
      ],
    },
    {
      title: 'Cash',
      steps: [
        {
          label: 'Cash after one month',
          value: formatEuroWhole(s.cashAfterOneMonth),
          tone: isNegative(s.cashAfterOneMonth) ? 'bad' : undefined,
          formula: (
            <>
              <V>{formatEuroWhole(b.cashOnHand)}</V> in the bank today + <V>{formatEuroWhole(s.monthlyResult)}</V> monthly result
            </>
          ),
        },
      ],
    },
  ]

  return (
    <Card className="divide-y divide-black/[0.06]">
      {stages.map((stage) => (
        <div key={stage.title} className="p-5 sm:p-6">
          <h3 className="mb-3 text-[13px] font-semibold text-muted">{stage.title}</h3>
          <ol className="space-y-1">
            {stage.steps.map((step) => (
              <li
                key={step.label}
                className={`grid gap-x-6 gap-y-1 rounded-2xl px-3 py-2.5 sm:grid-cols-[13rem_1fr] sm:items-baseline ${
                  step.strong ? (step.tone === 'bad' ? 'bg-bad-50' : 'bg-good-50') : ''
                }`}
              >
                <div className="flex items-baseline justify-between gap-3 sm:block">
                  <div className={`text-[15px] ${step.strong ? 'font-semibold text-ink' : 'text-ink'}`}>{step.label}</div>
                  <div
                    className={`font-mono font-semibold sm:mt-0.5 ${step.strong ? 'text-2xl' : 'text-lg'} ${
                      step.tone === 'bad' ? 'text-bad' : step.tone === 'good' ? 'text-good-dark' : 'text-ink'
                    }`}
                  >
                    {step.value}
                  </div>
                </div>
                <p className="text-sm leading-7 text-muted">
                  <span aria-hidden className="mr-1.5 text-faint">
                    =
                  </span>
                  {step.formula}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p className="flex items-center gap-2 px-5 py-4 text-xs text-muted sm:px-6">
        <SourceBadge source="calculated" /> Worked out by Business Twin from your figures, recalculated every time they change.
      </p>
    </Card>
  )
}

// ── 3. Plans ──────────────────────────────────────────────────────────────

type Fact = { label: string; value: string }
type Guess = { label: string; estimate: EstimateDto | null | undefined; format: (v: string) => string }

const visits = (v: string) => `${formatCountPrecise(v)} visits`
const share = (v: string) => `${formatCountPrecise(v)}%`

function describe(c: ChangeDto): { facts: Fact[]; guesses: Guess[] } {
  const start = { label: 'Starts', value: `Month ${c.startMonth}` }
  switch (c.type) {
    case 'hire':
      return {
        facts: [
          start,
          { label: 'Working hours', value: `${formatHours(c.hoursPerMonth ?? '0')} h / month` },
          { label: 'Full monthly cost', value: formatEuroWhole(c.employerCostPerMonth ?? '0') },
          { label: 'Fully booked', value: (c.rampUpMonths ?? 1) <= 1 ? 'From day one' : `After ${c.rampUpMonths} months` },
        ],
        guesses: [
          { label: 'Customers per month at full speed', estimate: c.customersPerMonth, format: visits },
          { label: 'Share that is new to your salon', estimate: c.newCustomerSharePercent, format: share },
        ],
      }
    case 'price':
      return {
        facts: [start, { label: 'New average price', value: formatEuro(c.newPrice ?? '0') }],
        guesses: [{ label: 'Change in visits', estimate: c.demandChangePercent, format: formatPercentPoints }],
      }
    case 'marketing':
      return {
        facts: [start, { label: 'Campaign cost', value: `${formatEuroWhole(c.costPerMonth ?? '0')} / month` }],
        guesses: [{ label: 'New customers per month', estimate: c.newCustomersPerMonth, format: visits }],
      }
  }
}

const cases = [
  { key: 'pessimistic', label: 'Pessimistic', bar: 'bg-bad' },
  { key: 'expected', label: 'Expected', bar: 'bg-accent' },
  { key: 'optimistic', label: 'Optimistic', bar: 'bg-good' },
] as const

/** With more plans than this, the rest wait behind a "Show more" button. */
const SHOWN_AT_FIRST = 5

/**
 * One row per plan, opened on demand: the owner sees every plan's name at a glance and reads the guesses of the one
 * they care about. The newest plan starts open so the section never looks empty.
 */
function PlanList({ plans }: { plans: ScenarioDto[] }) {
  const [open, setOpen] = useState<string[]>(plans[0] ? [plans[0].id] : [])
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? plans : plans.slice(0, SHOWN_AT_FIRST)
  const hidden = plans.length - visible.length
  const allOpen = visible.every((p) => open.includes(p.id))
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))

  return (
    <div className="space-y-3">
      {plans.length > 1 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setOpen(allOpen ? [] : visible.map((p) => p.id))}>
            {allOpen ? 'Close all' : 'Open all'}
          </Button>
        </div>
      )}
      <Card className="divide-y divide-black/[0.06] overflow-hidden">
        {visible.map((p) => {
          const isOpen = open.includes(p.id)
          const panel = `plan-${p.id}-guesses`
          return (
            <div key={p.id}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => toggle(p.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-black/[0.025]"
                >
                  <ChevronRight
                    size={18}
                    className={`shrink-0 text-muted transition-transform duration-200 ease-out ${isOpen ? 'rotate-90' : ''}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{p.name}</span>
                  <span className="hidden shrink-0 gap-1 sm:flex">
                    {p.changes.map((c, i) => (
                      <Badge key={i} tone="amber">
                        {changeMeta[c.type].short}
                      </Badge>
                    ))}
                  </span>
                  <span className="shrink-0 text-[13px] text-muted">{p.horizonMonths} mo</span>
                </button>
              </h3>
              {isOpen && (
                <div id={panel} className="animate-rise px-5 pb-6 sm:pl-12">
                  <PlanAssumptions plan={p} />
                </div>
              )}
            </div>
          )
        })}
      </Card>
      {(hidden > 0 || (showAll && plans.length > SHOWN_AT_FIRST)) && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => setShowAll(!showAll)}>
            {hidden > 0 ? `Show ${hidden} more plan${hidden > 1 ? 's' : ''}` : 'Show fewer plans'}
          </Button>
        </div>
      )}
    </div>
  )
}

function PlanAssumptions({ plan }: { plan: ScenarioDto }) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-1">
        <div className="-ml-3 flex gap-1">
          <ButtonLink to={`/app/decide/${plan.id}`} variant="ghost" size="sm">
            <Pencil size={13} aria-hidden /> Adjust
          </ButtonLink>
          <ButtonLink to={`/app/plans/${plan.id}`} variant="ghost" size="sm">
            Results <ArrowRight size={13} aria-hidden />
          </ButtonLink>
        </div>
      </div>

      <div className="space-y-6">
        {plan.changes.map((c, i) => {
          const meta = changeMeta[c.type]
          const { facts, guesses } = describe(c)
          return (
            <div key={i} className={i > 0 ? 'border-t border-black/[0.06] pt-6' : ''}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-amber-50 text-amber" aria-hidden>
                  <meta.icon size={16} />
                </span>
                <span className="font-semibold">{meta.title}</span>
              </div>

              <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs text-muted">{f.label}</dt>
                    <dd className="mt-0.5 text-[15px] font-medium text-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="space-y-3">
                {guesses.map((g) => (
                  <div key={g.label}>
                    <div className="mb-1.5 flex items-center gap-2 text-sm text-ink">
                      {g.label} <SourceBadge source="estimated" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {cases.map((k) => (
                        <div key={k.key} className="overflow-hidden rounded-xl bg-canvas">
                          <div className={`h-1 ${k.bar}`} aria-hidden />
                          <div className="px-3 py-2">
                            <div className="text-xs text-muted">{k.label}</div>
                            <div className="font-mono text-[15px] font-semibold text-ink">{g.estimate ? g.format(g.estimate[k.key]) : '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 4. Unknowns ───────────────────────────────────────────────────────────

const unknowns: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Users,
    title: 'How many new customers come',
    text: 'The biggest unknown for a hire or a campaign. That is why you give a pessimistic, expected and optimistic guess.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Whether moved customers stay',
    text: 'Customers who move to a new colleague may stay with the salon, or some may leave.',
  },
  { icon: Tag, title: 'How customers react to a new price', text: 'The change in visits is your own estimate, not a prediction.' },
  { icon: CalendarDays, title: 'Unusual months', text: 'Seasons, holidays and one-off events make some months busier or quieter than normal.' },
  {
    icon: Receipt,
    title: 'When money moves',
    text: 'Payment delays, taxes, the timing of holiday allowance and one-off costs are not included yet.',
  },
]

function Unknowns() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {unknowns.map((u) => (
          <Card key={u.title} className="flex gap-4 p-5 sm:last:odd:col-span-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent" aria-hidden>
              <u.icon size={18} />
            </span>
            <div>
              <h3 className="font-semibold">{u.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{u.text}</p>
            </div>
          </Card>
        ))}
      </div>
      <InfoBox tone="neutral">
        Business Twin shows what <em>could</em> happen with your own numbers. It does not predict the future or tell you what to decide: that
        stays your call, ideally talked through with your accountant or adviser.
      </InfoBox>
    </div>
  )
}
