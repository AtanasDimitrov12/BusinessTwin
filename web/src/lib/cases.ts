import type { CaseKey } from '../api/client'

export const caseLabels: Record<CaseKey, string> = {
  pessimistic: 'Pessimistic',
  expected: 'Expected',
  optimistic: 'Optimistic',
}
