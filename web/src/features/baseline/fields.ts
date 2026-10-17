import type { BaselineInput } from '../../api/client'

export type BaselineField = Exclude<keyof BaselineInput, 'sources'>

export interface FieldDefinition {
  name: BaselineField
  label: string
  unit: string
  hint: string
  /** Fictional sample salon, shown as "sample" until the owner replaces it. */
  sample: string
  allowNegative?: boolean
}

export const baselineFields: FieldDefinition[] = [
  { name: 'visitsPerMonth', label: 'Customers per month', unit: 'visits', hint: 'All appointments in a normal month.', sample: '400' },
  { name: 'averagePrice', label: 'Average price', unit: '€ per visit', hint: 'Sales divided by visits.', sample: '40.00' },
  { name: 'costPerService', label: 'Cost per service', unit: '€ per visit', hint: 'Products and other costs per visit.', sample: '5.00' },
  { name: 'staffHoursPerMonth', label: 'Staff hours', unit: 'hours per month', hint: 'Hours the team can spend on customers.', sample: '480' },
  { name: 'serviceTimeHours', label: 'Service time', unit: 'hours per visit', hint: 'Average time one visit takes.', sample: '1.00' },
  { name: 'wagesPerMonth', label: 'Wages', unit: '€ per month', hint: 'Including employer costs.', sample: '8000.00' },
  { name: 'otherFixedCostsPerMonth', label: 'Other fixed costs', unit: '€ per month', hint: 'Rent, utilities, software, insurance.', sample: '3000.00' },
  { name: 'cashOnHand', label: 'Cash on hand', unit: '€', hint: 'Money in the bank today.', sample: '2000.00', allowNegative: true },
]
