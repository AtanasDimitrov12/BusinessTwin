import type { BaselineInput } from '../../api/client'
import { formatCount, formatEuro, formatHours } from '../../lib/format'

export type BaselineField = Exclude<keyof BaselineInput, 'sources'>
export type WizardStep = 'customers' | 'time' | 'costs'

export interface FieldDefinition {
  name: BaselineField
  step: WizardStep
  label: string
  hint: string
  kind: 'money' | 'count' | 'hours'
  prefix?: string
  suffix?: string
  /** Fictional sample salon, marked "sample" until the owner replaces it. */
  sample: string
  allowNegative?: boolean
}

export const baselineFields: FieldDefinition[] = [
  { name: 'visitsPerMonth', step: 'customers', label: 'Customers per month', hint: 'All appointments in a normal month. Your booking system shows this.', kind: 'count', suffix: 'visits', sample: '420' },
  { name: 'averagePrice', step: 'customers', label: 'Average price per visit', hint: 'Monthly sales divided by the number of visits.', kind: 'money', prefix: '€', sample: '42.00' },
  { name: 'costPerService', step: 'customers', label: 'Cost per visit', hint: 'Products, supplies and card fees used for one visit.', kind: 'money', prefix: '€', sample: '6.00' },
  { name: 'staffHoursPerMonth', step: 'time', label: 'Staff hours with customers', hint: 'Hours your whole team can spend on customers in a month, owner included.', kind: 'hours', suffix: 'h / month', sample: '560' },
  { name: 'serviceTimeHours', step: 'time', label: 'Time per visit', hint: 'Average length of one appointment, e.g. 1.25 for 75 minutes.', kind: 'hours', suffix: 'hours', sample: '1.25' },
  { name: 'wagesPerMonth', step: 'costs', label: 'Wages', hint: 'All wages per month, including employer costs.', kind: 'money', prefix: '€', suffix: '/ month', sample: '9000.00' },
  { name: 'otherFixedCostsPerMonth', step: 'costs', label: 'Other fixed costs', hint: 'Rent, energy, software, insurance: costs that stay the same each month.', kind: 'money', prefix: '€', suffix: '/ month', sample: '3500.00' },
  { name: 'cashOnHand', step: 'costs', label: 'Cash in the bank today', hint: 'Used to check whether cash could run short in the coming months.', kind: 'money', prefix: '€', sample: '6000.00', allowNegative: true },
]

export function formatField(f: FieldDefinition, value: string): string {
  if (f.kind === 'money') return formatEuro(value)
  if (f.kind === 'hours') return `${formatHours(value)} ${f.suffix === 'hours' ? 'h' : 'h / month'}`
  return formatCount(value)
}
