# Project overview

Summary of the Project Plan, Design Challenge and Gap Analysis for Business Twin (Fontys S7 Open Learning, Atanas Dimitrov). The original documents live in the project folder outside this repo.

## Problem

Owners of small service businesses regularly decide about hiring, prices and marketing, but their tools show the past rather than what a decision could do next:

- Booking software (e.g. Salonized) reports past bookings and income.
- The accountant explains results after the fact.
- A spreadsheet needs the owner to build the relationships between customers, staff time, costs and cash themselves.
- Online salon calculators answer one question each.
- General planning tools (LivePlan, Float) do scenarios but are built around finance, not staff time.

None of them links demand, staff capacity and cash for one salon decision.

## Design challenge

> How might we help owners of small service businesses explore how a planned decision could affect income, costs, and staff capacity, using information they already have, so they can compare possible outcomes and understand why they differ?

## Target users

| User | Role | Need |
|---|---|---|
| Small service-business owner (salon/barbershop, ~3–10 staff, NL) | Primary user | Understand trade-offs, test alternatives, know what must happen for a decision to work |
| Aspiring entrepreneur | Secondary | Test assumptions before committing time or money |
| Adviser / accountant / coach | Supporting | A shared, transparent plan to discuss with the owner |

Why this group: the Dutch hairdressing sector had 31,920 businesses at the end of 2024; 5,910 have staff and about 2,890 work with 3 to under 10 FTE (Schippers & Beulen, 2025). For them one hire changes the cost base noticeably: Dutch employer costs add roughly 26–40% on top of gross salary (Multiplier, 2026), including at least 8% holiday allowance (Business.gov.nl, n.d.). Small firms hold little cash buffer: median 27 days, personal-services firms 21 days (US data; Farrell & Wheat, 2016).

## Gaps Business Twin closes

| # | Gap | How Business Twin closes it |
|---|---|---|
| 1 | No forward-looking view of a decision | Scenario engine with month-by-month results |
| 2 | Demand not linked to staff time | Capacity and utilisation per month; served = min(demand, capacity) |
| 3 | Hidden assumption that all extra customers are new | Explicit share of new vs moved customers |
| 4 | No early warning of a cash shortfall | Cash simulation and shortfall flag |
| 5 | One number, no range | Pessimistic / expected / optimistic cases |
| 6 | Owner can't see why a result changes | Labelled inputs and driver explanation |
| 7 | Too much effort to set up a model | Guided baseline form with sample salon values |
| 8 | Options looked at in isolation | Several scenarios compared against the baseline |

## Decisions in the PoC

The Design Challenge narrows the PoC to three decisions: **hire a worker, change a price, spend more on marketing**. Hiring is modelled first. The Project Plan also lists changing working hours, introducing a service and a demand decrease; these are later candidates, not PoC scope.

## Software scope (from the Project Plan)

- Create a simplified business profile.
- Store baseline values and clearly label user assumptions.
- Create at least three decision scenarios and compare them with the baseline.
- Calculate revenue, variable costs, fixed costs, contribution, profit, break-even requirements, capacity, utilisation and a simplified cash-flow effect.
- Show optimistic, realistic and pessimistic outcomes.
- Explain the main factors that cause the difference between scenarios.
- Present results through a clear dashboard and scenario comparison view.

## Out of scope

- Accounting, bookkeeping, tax or financial-advice platform; certified forecasts.
- Integrations with banks, accounting packages, POS or booking systems, external market data.
- Inventory-heavy, manufacturing, enterprise or highly regulated businesses; one-person salons; chains.
- AI forecasting, automated decision making, real-time optimisation.
- Native mobile apps, subscription billing, production-scale deployment.

## Research questions

Main: *How can a web-based business decision simulator help small service-business owners evaluate the possible operational and financial consequences of a decision before applying it in practice?*

1. Which decisions and uncertainties create the greatest need for scenario analysis?
2. What minimum information is needed for a useful but understandable model of a small service business?
3. Which indicators give the most decision value, and how should their relationships be modelled and explained?
4. How should assumptions, uncertainty and the three cases be communicated to users without a financial background?
5. Which value proposition, feature set and revenue model could make Business Twin commercially relevant?
6. To what extent does the PoC help users compare alternatives, understand trade-offs and trust the results?

Approach: Design Science Research with short iterative development cycles.

## Time budget

140 hours total. Phase 6 (web PoC: profile, baseline, scenario engine, comparison dashboard, calculation tests) is time-boxed to about **22 hours**. Phase 4 (decision model and reference calculations, 24 h) comes before it.

## Future development (roadmap, not PoC)

Sector templates, data imports, richer cash-flow planning (payment timing, holiday allowance timing, one-off costs), sensitivity charts, read-only adviser sharing, historical comparisons, integrations, subscription model.

## References

Business.gov.nl. (n.d.). *Paying holiday allowance to your staff*. Retrieved October 10, 2026, from https://business.gov.nl/regulation/holiday-allowance/

Farrell, D., & Wheat, C. (2016). *Cash is king: Flows, balances, and buffer days. Evidence from 600,000 small businesses*. JPMorgan Chase Institute. https://www.jpmorganchase.com/institute/all-topics/business-growth-and-entrepreneurship/report-cash-flows-balances-and-buffer-days

Multiplier. (2026, August 25). *Cost of hiring in the Netherlands: Employer costs (2026)*. https://www.usemultiplier.com/netherlands/cost-of-employment

Schippers, G., & Beulen, M. (2025). *Monitor kerndata kappers 2025: Rapportage* [Core data monitor for hairdressers 2025: Report]. Panteia; Brancheplatform Kappers. https://brancheplatformkappers.nl/wp-content/uploads/2025/09/Rapportage-Monitor-Kerndata-Kappers-editie-2025.pdf
