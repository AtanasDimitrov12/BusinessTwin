/**
 * The landing-page story: one fictional salon hires a fifth employee. Every figure is real Business Twin engine
 * output for these inputs, pasted in (nothing is calculated in the browser; numbers are used for chart geometry and
 * formatted for display only).
 *
 * Salon: 4 employees, 400 visits a month at €38 (cost per visit €5), 480 staff hours, 1 h per visit,
 * wages €9,600, other fixed costs €2,500, €2,000 in the bank.
 * Hire from month 1: 120 h a month, €2,400 a month, full speed after 5 months,
 * 120 / 150 / 170 customers a month at full speed, of whom 40% / 60% / 80% are new to the salon.
 */
export type CaseKey = 'pessimistic' | 'expected' | 'optimistic'

export const caseOrder: CaseKey[] = ['pessimistic', 'expected', 'optimistic']

/** Running total compared with not hiring, month 0 to 12 (month 0 is the moment of the decision). */
export const runningTotal: Record<CaseKey, number[]> = {
  pessimistic: [0, -2083, -3850, -5299, -6432, -7248, -8064, -8880, -9696, -10512, -11328, -12144, -12960],
  expected: [0, -1806, -3018, -3636, -3660, -3090, -2520, -1950, -1380, -810, -240, 330, 900],
  optimistic: [0, -1502, -2107, -1814, -624, 1464, 3552, 5640, 7728, 9816, 11904, 13992, 16080],
}

/** Cash in the bank at the end of each month, month 0 to 12. */
export const cash: Record<CaseKey | 'withoutHire', number[]> = {
  withoutHire: [2000, 3100, 4200, 5300, 6400, 7500, 8600, 9700, 10800, 11900, 13000, 14100, 15200],
  pessimistic: [2000, 1017, 350, 1, -32, 252, 536, 820, 1104, 1388, 1672, 1956, 2240],
  expected: [2000, 1294, 1182, 1664, 2740, 4410, 6080, 7750, 9420, 11090, 12760, 14430, 16100],
  optimistic: [2000, 1598, 2093, 3486, 5776, 8964, 12152, 15340, 18528, 21716, 24904, 28092, 31280],
}

/** New visits a month the salon needs to cover the hire's cost (€2,400 ÷ €33 left per visit). */
export const breakEvenNewVisits = 73
