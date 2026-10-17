# Calculation model (scenario engine)

First version of the decision model, from the Design Document (17 Oct 2026). These formulas still have to be verified with hand-worked reference cases; those cases become the engine's unit tests. If a formula here changes, update this file and the tests together.

## Inputs

### Baseline (today's month)

| Field | Unit | Notes |
|---|---|---|
| Customers (visits) per month | count | |
| Average price | € per visit | decimal |
| Cost per service | € per visit | variable cost (products etc.), decimal |
| Staff hours | hours per month | productive hours of the current team |
| Service time | hours per visit | average |
| Wages | € per month | including employer costs, decimal |
| Other fixed costs | € per month | rent, utilities etc., decimal |
| Cash on hand | € | starting cash, decimal |

Each field has a source label: `entered` or `estimated` (and `sample` until replaced). Calculated values are labelled `calculated`.

### Changes (a scenario stacks one or more)

| Type | Parameters | Uncertain (three values) |
|---|---|---|
| Hire | start month, working hours, full employer cost per month | expected customers per month for the new worker, share of them that are new |
| Price | new price, start month | change in demand after the price change |
| Marketing | campaign cost (per month), start month | expected new customers |

Uncertain fields get a pessimistic, expected and optimistic value. Employer costs are entered by the owner as the full cost; the Dutch 26–40% on top of gross salary range is only guidance.

## Formulas (per month, per case)

| Quantity | Calculation |
|---|---|
| Capacity (slots) | productive staff hours ÷ average service time |
| Demand (visits) | baseline visits + new customers from a hire (expected customers × share that are new) + new customers from marketing ± demand change after a price change |
| Services delivered | min(demand, capacity); the difference is unserved demand or unused capacity |
| Utilisation | services delivered ÷ capacity |
| Revenue | services delivered × average price |
| Contribution | revenue − services delivered × cost per service |
| Fixed costs | wages incl. employer costs + other fixed costs + marketing spend |
| Monthly result | contribution − fixed costs |
| Cash | cash at start of month + monthly result; **flag when below zero** |
| Break-even new visits | added monthly fixed cost of a change ÷ contribution per visit |
| Break-even month | first month where the scenario's monthly result ≥ the baseline's monthly result |
| Cumulative gap | running total of (scenario − baseline) monthly result since the change starts |

A hire adds capacity (its hours) but no demand except its *new* customers; moved customers only shift work. Marketing adds demand but no capacity.

## Driver explanation

For each scenario the Driver Explainer splits the difference with the baseline into causes, e.g. extra revenue from new visits, added wage costs, marketing costs, and revenue lost to demand that could not be served. It also reports break-even visits, break-even month and cumulative gap.

## Engine shape

- Input: baseline + list of changes + horizon (months).
- Output: for each case (pessimistic, expected, optimistic), a list of monthly results (all quantities above, shortfall flag) and the drivers; plus the baseline run for comparison.
- Components: Demand Model, Capacity Model, Money Model, Cash-flow Simulator, Case Builder (one run per case), Driver Explainer.
- Pure C#, `decimal` for all money, no I/O. Deterministic: same input, same output.

## Prototype example (for orientation, not a test oracle)

The clickable prototype uses a salon serving 400 customers with 480 available slots (83% utilisation). The new stylist has 50 appointments in month 1, of which 20 are new and 30 move from colleagues. The hire pays for itself in month 5 (monthly result catches up with the baseline), but the business is still €3,060 behind the baseline in total after month 6. Use proper hand-worked reference cases for tests rather than these figures, since the full prototype inputs are not recorded here.

## Implementation choices (engine v1)

Made while building `BusinessTwin.Engine`, covered by `ReferenceCaseTests`:

- Months are numbered from 1; a change applies from its start month onward. Horizon is 1 to 36 months, and every change must start within it.
- Capacity is pooled: total staff hours (baseline + hires) ÷ service time. Moved customers therefore change nothing in the totals; only the new share of a hire's customers adds demand.
- The price change's demand effect is entered in **visits per month** (negative for a drop). If several price changes are stacked, the latest active one sets both the price and the demand effect.
- Demand is never below zero.
- Utilisation is 0 when capacity is 0.
- Driver split (summed over the horizon, adds up exactly to the total difference in monthly result):
  - extra visits contribution = Σ (served in scenario − served in baseline) × baseline contribution per visit
  - price effect = Σ served in scenario × (scenario price − baseline price)
  - added wage costs = − Σ employer cost of active hires
  - marketing costs = − Σ cost of active campaigns
  - Revenue lost to unserved demand (Σ unserved × price) is reported as extra information and is not part of the sum.
- Break-even new visits = added monthly fixed cost of all changes ÷ (final scenario price − cost per service); empty when there is no added fixed cost.
- Break-even month and cumulative gap are counted from the earliest change's start month.
- No rounding inside the engine.

## Simplifications in v1 (open questions)

- Revenue and costs are paid in the month they occur; no taxes.
- The difficult case combines all pessimistic values, which may exaggerate the downside when estimates are unrelated. Sensitivity per estimate is a later option.
- Payment timing, annual holiday-allowance payment and one-off costs (e.g. recruitment) are not modelled yet.
