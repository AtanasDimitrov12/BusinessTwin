import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Field } from '../../components/ui/Field'
import { InfoBox } from '../../components/ui/primitives'
import { changeMeta, type ChangeForm, type HireForm, type MarketingForm, type PriceForm } from './changeForm'
import { EstimateRow } from './EstimateRow'

export function ChangeEditor({
  change,
  index,
  horizonMonths,
  onChange,
  onRemove,
}: {
  change: ChangeForm
  index: number
  horizonMonths: number
  onChange: (change: ChangeForm) => void
  onRemove: () => void
}) {
  const meta = changeMeta[change.type]
  const Icon = meta.icon
  const set = <T extends ChangeForm>(patch: Partial<T>) => onChange({ ...change, ...patch } as ChangeForm)

  return (
    <section className="animate-rise rounded-2xl border border-line bg-surface p-5 shadow-card" aria-label={`Decision ${index + 1}: ${meta.title}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber">
            <Icon size={20} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold leading-tight">{meta.title}</h2>
            <p className="text-xs text-muted">{meta.affects}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-bad-50 hover:text-bad"
          aria-label={`Remove ${meta.title}`}
        >
          <Trash2 size={16} />
        </button>
      </header>

      <div className="space-y-5">
        <StartMonth value={change.startMonth} horizonMonths={horizonMonths} onChange={(startMonth) => set({ startMonth })} />
        {change.type === 'hire' && <HireFields change={change} set={set<HireForm>} />}
        {change.type === 'price' && <PriceFields change={change} set={set<PriceForm>} />}
        {change.type === 'marketing' && <MarketingFields change={change} set={set<MarketingForm>} />}
      </div>
    </section>
  )
}

function HireFields({ change, set }: { change: HireForm; set: (patch: Partial<HireForm>) => void }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Working hours"
          hint="Hours per month with customers"
          suffix="h / month"
          inputMode="decimal"
          value={change.hoursPerMonth}
          onChange={(e) => set({ hoursPerMonth: e.target.value })}
        />
        <Field
          label="Full monthly cost"
          hint="Salary plus employer costs (often 26–40% on top in NL)"
          prefix="€"
          inputMode="decimal"
          value={change.employerCostPerMonth}
          onChange={(e) => set({ employerCostPerMonth: e.target.value })}
        />
      </div>
      <Select
        label="Time to build a client base"
        hint="Wages start straight away; customers come gradually."
        value={change.rampUpMonths}
        options={[1, 2, 3, 4, 6, 9, 12].map((n) => ({ value: n, label: n === 1 ? 'Full speed from day one' : `Full speed after ${n} months` }))}
        onChange={(rampUpMonths) => set({ rampUpMonths })}
      />
      <EstimateRow
        label="Customers per month at full speed"
        hint="All appointments the new worker will have, including customers who move from colleagues."
        unit="visits"
        value={change.customersPerMonth}
        onChange={(customersPerMonth) => set({ customersPerMonth })}
      />
      <EstimateRow
        label="Share that is new to your salon"
        hint="Customers who move from a colleague add work for the new worker, but no extra sales."
        unit="%"
        value={change.newCustomerSharePercent}
        onChange={(newCustomerSharePercent) => set({ newCustomerSharePercent })}
      />
    </>
  )
}

function PriceFields({ change, set }: { change: PriceForm; set: (patch: Partial<PriceForm>) => void }) {
  return (
    <>
      <Field
        label="New average price"
        hint="What a visit costs on average after the change"
        prefix="€"
        inputMode="decimal"
        value={change.newPrice}
        onChange={(e) => set({ newPrice: e.target.value })}
      />
      <EstimateRow
        label="Change in visits"
        hint="How many more or fewer visits you expect, as a % of today's visits. Use a minus for fewer, e.g. −5. A later price change replaces this one."
        unit="%"
        value={change.demandChangePercent}
        onChange={(demandChangePercent) => set({ demandChangePercent })}
      />
    </>
  )
}

function MarketingFields({ change, set }: { change: MarketingForm; set: (patch: Partial<MarketingForm>) => void }) {
  return (
    <>
      <Field
        label="Campaign cost"
        hint="Extra spend every month: ads, flyers, promotions"
        prefix="€"
        suffix="/ month"
        inputMode="decimal"
        value={change.costPerMonth}
        onChange={(e) => set({ costPerMonth: e.target.value })}
      />
      <EstimateRow
        label="New customers per month"
        hint="Visits from people who would not have come otherwise. Zero is a fair pessimistic case."
        unit="visits"
        value={change.newCustomersPerMonth}
        onChange={(newCustomersPerMonth) => set({ newCustomersPerMonth })}
      />
      <InfoBox tone="neutral">Marketing brings customers, not staff time. If your team is already full, extra demand cannot be served.</InfoBox>
    </>
  )
}

function StartMonth({ value, horizonMonths, onChange }: { value: number; horizonMonths: number; onChange: (v: number) => void }) {
  return (
    <Select
      label="Starts in"
      value={Math.min(value, horizonMonths)}
      options={Array.from({ length: horizonMonths }, (_, i) => ({ value: i + 1, label: `Month ${i + 1}` }))}
      onChange={onChange}
    />
  )
}

function Select({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string
  hint?: ReactNode
  value: number
  options: { value: number; label: string }[]
  onChange: (v: number) => void
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
