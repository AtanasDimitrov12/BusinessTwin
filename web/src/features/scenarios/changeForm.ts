import { Megaphone, Tag, UserPlus, type LucideIcon } from 'lucide-react'
import type { ChangeDto, ChangeType, EstimateDto, ScenarioDto } from '../../api/client'

// Form values keep every number as a string, exactly as typed. They are sent to the API unchanged
// (comma → dot), so decimals never pass through JavaScript arithmetic.

export interface EstimateForm {
  pessimistic: string
  expected: string
  optimistic: string
}

export interface HireForm {
  type: 'hire'
  startMonth: number
  hoursPerMonth: string
  employerCostPerMonth: string
  rampUpMonths: number
  customersPerMonth: EstimateForm
  newCustomerSharePercent: EstimateForm
}

export interface PriceForm {
  type: 'price'
  startMonth: number
  newPrice: string
  demandChangePercent: EstimateForm
}

export interface MarketingForm {
  type: 'marketing'
  startMonth: number
  costPerMonth: string
  newCustomersPerMonth: EstimateForm
}

export type ChangeForm = HireForm | PriceForm | MarketingForm

export interface ScenarioForm {
  name: string
  horizonMonths: number
  changes: ChangeForm[]
}

export const horizonOptions = [6, 12, 24, 36]

export const changeMeta: Record<
  ChangeType,
  { title: string; short: string; icon: LucideIcon; description: string; affects: string; defaultName: string }
> = {
  hire: {
    title: 'Hire a worker',
    short: 'Hire',
    icon: UserPlus,
    description: 'Adds staff hours and a monthly cost. Only customers who are new to your salon add sales.',
    affects: 'Capacity, wages, new customers',
    defaultName: 'Hire a stylist',
  },
  price: {
    title: 'Change your price',
    short: 'Price',
    icon: Tag,
    description: 'Changes what every visit earns. Some customers may visit less, or more.',
    affects: 'Price per visit, demand',
    defaultName: 'New price',
  },
  marketing: {
    title: 'More marketing',
    short: 'Marketing',
    icon: Megaphone,
    description: 'Costs money every month and may bring new customers, but adds no staff time.',
    affects: 'Marketing cost, new customers',
    defaultName: 'Marketing campaign',
  },
}

const estimate = (pessimistic: string, expected: string, optimistic: string): EstimateForm => ({ pessimistic, expected, optimistic })

/** Starting values for a new change. They are suggestions the owner is expected to adjust. */
export function defaultChange(type: ChangeType, baselinePrice?: string): ChangeForm {
  switch (type) {
    case 'hire':
      return {
        type,
        startMonth: 1,
        hoursPerMonth: '120',
        employerCostPerMonth: '3500',
        rampUpMonths: 3,
        customersPerMonth: estimate('60', '80', '95'),
        newCustomerSharePercent: estimate('20', '35', '50'),
      }
    case 'price':
      return { type, startMonth: 1, newPrice: baselinePrice ?? '45', demandChangePercent: estimate('-12', '-5', '0') }
    case 'marketing':
      return { type, startMonth: 1, costPerMonth: '500', newCustomersPerMonth: estimate('0', '15', '30') }
  }
}

const dec = (s: string) => s.trim().replace(',', '.')
const est = (e: EstimateForm): EstimateDto => ({
  pessimistic: dec(e.pessimistic),
  expected: dec(e.expected),
  optimistic: dec(e.optimistic),
})

export function toChangeDto(c: ChangeForm): ChangeDto {
  switch (c.type) {
    case 'hire':
      return {
        type: 'hire',
        startMonth: c.startMonth,
        hoursPerMonth: dec(c.hoursPerMonth),
        employerCostPerMonth: dec(c.employerCostPerMonth),
        rampUpMonths: c.rampUpMonths,
        customersPerMonth: est(c.customersPerMonth),
        newCustomerSharePercent: est(c.newCustomerSharePercent),
      }
    case 'price':
      return { type: 'price', startMonth: c.startMonth, newPrice: dec(c.newPrice), demandChangePercent: est(c.demandChangePercent) }
    case 'marketing':
      return {
        type: 'marketing',
        startMonth: c.startMonth,
        costPerMonth: dec(c.costPerMonth),
        newCustomersPerMonth: est(c.newCustomersPerMonth),
      }
  }
}

const fromEst = (e: EstimateDto | null | undefined): EstimateForm => estimate(e?.pessimistic ?? '0', e?.expected ?? '0', e?.optimistic ?? '0')

export function fromChangeDto(c: ChangeDto): ChangeForm {
  switch (c.type) {
    case 'hire':
      return {
        type: 'hire',
        startMonth: c.startMonth,
        hoursPerMonth: c.hoursPerMonth ?? '0',
        employerCostPerMonth: c.employerCostPerMonth ?? '0',
        rampUpMonths: c.rampUpMonths ?? 1,
        customersPerMonth: fromEst(c.customersPerMonth),
        newCustomerSharePercent: fromEst(c.newCustomerSharePercent),
      }
    case 'price':
      return { type: 'price', startMonth: c.startMonth, newPrice: c.newPrice ?? '0', demandChangePercent: fromEst(c.demandChangePercent) }
    case 'marketing':
      return { type: 'marketing', startMonth: c.startMonth, costPerMonth: c.costPerMonth ?? '0', newCustomersPerMonth: fromEst(c.newCustomersPerMonth) }
  }
}

export const fromScenarioDto = (s: ScenarioDto): ScenarioForm => ({
  name: s.name,
  horizonMonths: s.horizonMonths,
  changes: s.changes.map(fromChangeDto),
})

/** Format check only. Ranges and pessimistic ≤ expected ≤ optimistic are validated by the API. */
const numberPattern = /^-?\d+([.,]\d+)?$/
const filled = (s: string) => numberPattern.test(s.trim())
const estFilled = (e: EstimateForm) => filled(e.pessimistic) && filled(e.expected) && filled(e.optimistic)

export function isComplete(c: ChangeForm): boolean {
  switch (c.type) {
    case 'hire':
      return filled(c.hoursPerMonth) && filled(c.employerCostPerMonth) && estFilled(c.customersPerMonth) && estFilled(c.newCustomerSharePercent)
    case 'price':
      return filled(c.newPrice) && estFilled(c.demandChangePercent)
    case 'marketing':
      return filled(c.costPerMonth) && estFilled(c.newCustomersPerMonth)
  }
}

/** One-line description of a change, for lists and the assumptions page. */
export function describeChange(c: ChangeDto, money: (s: string) => string): string {
  const range = (e: EstimateDto | null | undefined, unit = '') =>
    e ? `${e.pessimistic}${unit} / ${e.expected}${unit} / ${e.optimistic}${unit}` : '—'
  const from = `from month ${c.startMonth}`
  switch (c.type) {
    case 'hire':
      return `${c.hoursPerMonth} h/month at ${money(c.employerCostPerMonth ?? '0')}/month ${from}; ${range(c.customersPerMonth)} customers, ${range(c.newCustomerSharePercent, '%')} new; full speed after ${c.rampUpMonths ?? 1} month(s)`
    case 'price':
      return `New price ${money(c.newPrice ?? '0')} ${from}; demand change ${range(c.demandChangePercent, '%')}`
    case 'marketing':
      return `${money(c.costPerMonth ?? '0')}/month ${from}; ${range(c.newCustomersPerMonth)} new customers per month`
  }
}
