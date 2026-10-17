# CLAUDE.md

Context for Claude Code working in this repository. Read this first; the `docs/` folder has the detail.

## What Business Twin is

Business Twin is a web-based **decision simulator for owners of small service businesses**, with a small salon or barbershop (about 3 to 10 staff, Netherlands) as the first example. The owner enters a monthly picture of the business as it is today (the *baseline*), adds one or more *changes* (hire a worker, change a price, spend more on marketing), and compares how sales, costs, monthly result, cash and staff capacity might develop over the coming months in a **pessimistic, expected and optimistic case**.

It supports the owner's judgement; it never predicts or recommends. Results are estimates, not financial advice, and the UI must say so.

This is Atanas (Krasi) Dimitrov's Fontys S7 Open Learning personal project. The project is research-heavy: of a 140-hour budget, only about 22 hours are reserved for the web proof of concept (PoC). **Keep the code small, conventional and easy to test.** Prefer the simplest thing that satisfies the design over generality.

The motivating example (Design Challenge): a salon with 4 workers at ~100 customers/month each hires a 5th. Wages start in month 1, but the new worker sees ~50 customers at first, and only part of those are new to the salon (the rest move from colleagues). Does it pay off, when, and does cash run short first?

## Status

- Done (outside this repo): project plan, design challenge, gap analysis, BPMN to-be process (v2), tech stack research, clickable prototype, design document (17 Oct 2026).
- **Not built yet: the web PoC. This repo starts empty.** Build it against the design in `docs/architecture.md`.
- Next research step: verify the calculation model with hand-worked reference cases, which become the engine's unit tests.

## Tech stack (decided)

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript, Vite SPA, TanStack Query (server state), React Hook Form + Zod (forms), Recharts (charts) |
| Backend | ASP.NET Core Web API in **C#**, Entity Framework Core, ASP.NET Core Identity |
| Database | PostgreSQL (money as `numeric`) |
| Contract | REST + JSON over HTTPS; API publishes OpenAPI, TypeScript types are generated from it |
| Dev env | Docker Compose runs the API + local PostgreSQL with one command |
| Hosting | API and DB in an **EU region** (GDPR) |
| CI | Build both apps and run engine tests on every push |

Runner-up backend was NestJS; it is not being used.

## Planned repository layout

```
web/                     React + TS SPA (Vite)
api/
  BusinessTwin.sln
  BusinessTwin.Api/      ASP.NET Core Web API: endpoints, auth, validation, EF Core
  BusinessTwin.Engine/   Scenario engine class library: pure C#, NO web or DB code
  BusinessTwin.Engine.Tests/  Unit tests against hand-worked reference cases
docker-compose.yml
docs/
```

Project names above are a suggestion; keep the three-project split.

## Rules that matter (from the design document)

1. **All calculations live in the scenario engine.** The engine takes a baseline + list of changes and returns month-by-month results for three cases plus driver explanations. It has no ASP.NET, EF Core or HTTP dependencies.
2. **The browser never calculates money.** The web app shows what the API returns, so browser and server can never disagree.
3. **Money is `decimal` end to end**: C# `decimal`, PostgreSQL `numeric`, and strings or exact values in JSON. Never `double`/`float` for money, and never JavaScript number arithmetic on money in the frontend.
4. **Demand and capacity are separate.** Services delivered = min(demand, capacity). Show unserved demand or unused capacity.
5. **New vs moved customers is an explicit input** on a hire. Moved customers add work for the new worker but no demand for the business.
6. **Profit and cash are simulated separately, month by month**, and every month with cash below zero is flagged.
7. **Three cases, not one forecast.** Each uncertain estimate has pessimistic / expected / optimistic values; the model runs once per case.
8. **Every value carries a source label**: entered, estimated, or calculated. Sample values are marked as samples until the owner replaces them.
9. **Results are recalculated, never stored.** The DB stores inputs only (baseline, scenarios, changes, estimates).
10. **Ownership checks on every query**: filter by the signed-in owner's business, so one salon can never load another's data.
11. Engine changes come with tests. Formulas are checked against hand-worked reference cases.

See `docs/calculation-model.md` for the formulas and `docs/architecture.md` for components, data model and security.

## Scope of the PoC

In: one owner-focused web app behind a login; one business per owner; baseline form + baseline dashboard/business map; scenarios with hire, price and marketing changes; three-case month-by-month comparison with the baseline; cash shortfall flag; driver explanation (break-even visits, break-even month, cumulative gap); saved plans.

Out: accounting, bookkeeping, tax, payroll; bank/booking/accounting integrations; AI forecasting or recommendations; other business types; native mobile apps; subscription billing; production-scale deployment; a separate adviser app (adviser views a plan in the owner's session for now).

Open question: the research may show it is better to build the **hire decision first** and add price and marketing after. If unsure what to build first, start with baseline + hire.

## Working conventions

- Code, identifiers, commits and docs in English.
- Keep `docs/` in step with the code; update `docs/architecture.md` when a design decision changes and record why.
- Krasi wants **APA 7 citations** with links for any factual claim in project documents.
- Use fictional or anonymised data in tests and seed data. Secrets go in environment variables, never in the repo.

## Docs index

- `docs/project-overview.md` – problem, target users, decisions covered, scope, research questions
- `docs/architecture.md` – architecture decisions, C4 views, components, data model, security
- `docs/calculation-model.md` – inputs, formulas and indicators of the scenario engine
- `docs/process-bpmn.md` – the to-be decision process and how it maps to screens and endpoints
- `docs/bpmn/Business_Twin_BPMN_v2.bpmn` – BPMN source file
