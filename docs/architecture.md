# Architecture

Condensed from the Business Twin Design Document (17 Oct 2026). It describes the **planned** design of the proof of concept; keep it in step with the code as it is built and record new decisions with their reason.

## Overview

One repository, two separated applications:

- `web/` – React + TypeScript SPA (Vite). Forms, business map, scenario builder, comparison charts. **Never calculates money.**
- `api/` – ASP.NET Core solution in C# with three projects: the API, the **scenario engine** class library, and the engine test project.
- PostgreSQL stores inputs only. Docker Compose runs the API and a local database for development.

The most important split is not frontend/backend but **scenario engine vs everything else**. The engine has no web or database code, so it can be tested on its own against reference cases and reused later.

## Key architectural decisions

| Decision | Why |
|---|---|
| One business type first: small service businesses (salon/barbershop) | A generic model would be too complex or too vague; other types later via templates, not architecture changes |
| All calculations in a separate C# scenario engine, called only by the API | One place for formulas, so numbers can't drift between browser and server; reference cases become unit tests |
| Exact money: C# `decimal`, PostgreSQL `numeric` | Binary floating point (JS default) can't represent many decimal amounts; cents drift over months × 3 cases undermines trust |
| Demand and capacity modelled separately; served = min | Salons are limited by staff time; a hire adds slots not customers, marketing adds customers not slots |
| New vs moved customers explicit on a hire | Treating all of a new stylist's customers as new overstates the benefit; no reviewed tool asks this |
| Month-by-month profit **and** cash, shortfall flag | Wages start on day one, customers arrive gradually; a one-month view hides early cash problems |
| Three cases instead of one forecast | Owner estimates are uncertain; three cases are understandable without probability |
| Every value labelled entered / estimated / calculated; Driver Explainer | Turns the model from a black box into something the owner can follow and question |
| Results recalculated, not stored | Saved plans always match their assumptions; formula fixes apply to all plans; fast enough at PoC size |
| One owner-focused web app (SPA behind login) | Adviser views plans with the owner; SSR/SEO add nothing behind a login |
| React, ASP.NET Core, PostgreSQL, REST + JSON, OpenAPI → generated TS types | Ecosystem for forms/charts; built-in decimal, strong typing, OpenAPI support; relational model + exact numeric |
| EU hosting, CI as part of the design | Business and personal data of EU users; CI builds both apps and runs engine tests on every push |

## C4 Level 1 – Context

- **Salon owner** (primary): gathers current figures, enters the baseline, adds changes, compares scenarios, saves plans.
- **Adviser** (optional): accountant or coach who looks at a saved plan with the owner (owner's session now; read-only view later).
- Business Twin complements booking, sales and bookkeeping tools. The owner reads past figures there and enters them manually; automatic import is a future dependency.

## C4 Level 2 – Containers

| Container | Tech | Responsibility |
|---|---|---|
| Web application | React + TS, Vite SPA | Baseline form, business map, scenario builder, comparison dashboard, charts; every number labelled |
| API application | ASP.NET Core Web API (C#) | Sign-in, validation, ownership checks, REST endpoints; hosts the scenario engine |
| Database | PostgreSQL | Users, businesses, baselines, scenarios, changes, estimates (inputs only) |
| API contract | OpenAPI | TypeScript types generated for the web app |

Web ↔ API: REST over HTTPS, JSON, HTTP-only session cookie. API ↔ DB: EF Core over an encrypted connection. The DB is never reachable from the browser.

## C4 Level 3 – API components

- **Authentication** – sign-up, sign-in, password hashing via ASP.NET Core Identity; HTTP-only session cookie.
- **Business & Baseline endpoints** – save/read the business and the monthly baseline with source labels; return the baseline summary for dashboard and business map.
- **Scenario & Change endpoints** – create scenarios on a baseline; add, adjust, remove hire/price/marketing changes with their three-case estimates.
- **Results endpoint** – load baseline + changes, call the engine, return month-by-month results for three cases, cash shortfall flags and key drivers.
- **Validation & Ownership guard** – check ranges and units before the engine; limit every query to the signed-in owner's business.
- **Scenario engine** (class library) – Demand Model, Capacity Model, Money Model, Cash-flow Simulator, Case Builder, Driver Explainer. See `calculation-model.md`.
- **Data access** – EF Core context with migrations.

## Data model (first version)

| Table | Contents |
|---|---|
| `users` | Account identity and password hash (ASP.NET Core Identity) |
| `businesses` | The owner's salon, business type, staff count. One business per owner in the PoC |
| `baselines` | Customers/month, average price, cost per service, staff hours, service time, wages, other fixed costs, cash on hand (money as `numeric`), plus `input_sources` recording entered/estimated per field |
| `scenarios` | Named what-if on a baseline, horizon in months, status draft or saved |
| `changes` | One change in a scenario: type (hire, price, marketing), start month, type-specific parameters as `jsonb` (new change types need no new table) |
| `estimates` | Pessimistic, expected and optimistic value of each uncertain field of a change |

Each table matches a step in the BPMN process. No results table: results are always recalculated.

## Security and privacy

Roles: `owner` (PoC); `adviser` planned, read-only on plans an owner explicitly shares.

Mapped to OWASP Top 10:2025:

- Broken access control – every query filtered by the signed-in owner's business.
- Authentication failures – ASP.NET Core Identity, no custom password code; HTTP-only cookie.
- Injection – EF Core parameterised queries; every request validated before the engine.
- Security misconfiguration – HTTPS only, CORS limited to the app's own domain, secrets in environment variables.

Privacy: collect only the figures the model needs, fictional/anonymised data in tests, owner can delete their business with all scenarios, and the UI states that results are estimates, not financial advice.

## Implementation decisions (PoC build, 17 Oct 2026)

Decisions made while setting up the code, with their reason.

| Decision | Why |
|---|---|
| .NET 10 (LTS), solution file `BusinessTwin.slnx` | Current LTS release; `.slnx` is the SDK's default solution format |
| Decimals travel as JSON **strings** (`"1234.50"`), via `DecimalStringConverter`; OpenAPI describes them as `string`, format `decimal` | JSON numbers become binary floats in JavaScript. Strings keep money exact, and the generated TS type (`string`) stops accidental arithmetic. The web app formats them with `Intl.NumberFormat`, which formats numeric strings exactly |
| Engine values are exact, with no rounding inside the engine | Rounding is a display concern; rounding in between would let cents drift over months × cases |
| OpenAPI document written to `api/openapi/openapi.json` on every build; web types generated with `openapi-typescript`, calls via `openapi-fetch` | Contract-first without running the API; CI fails when either file is stale |
| Auth: ASP.NET Core Identity API endpoints under `/api/auth`, cookie mode (`login?useCookies=true`), cookie `bt_session` HttpOnly, SameSite=Strict, Secure outside development | No custom password code; SameSite=Strict plus JSON-only endpoints covers CSRF for a same-origin SPA |
| In development Vite proxies `/api` to the API | Same origin, so the cookie stays first-party and CORS is not needed. CORS is only enabled when `Cors:AllowedOrigins` is set |
| Ownership guard = `OwnerScope` service; controllers read owner data only through its pre-filtered queries | One place enforces the ownership rule; another owner's data returns 404 |
| Snake_case tables and columns (`EFCore.NamingConventions`), Identity tables renamed (`users`, `roles`, `user_claims` …) | Matches the data model names and PostgreSQL conventions |
| Change parameters (`changes.parameters`) and baseline source labels (`baselines.input_sources`) stored as `jsonb` | As designed: new change types need no new table |
| Money columns `numeric(14,2)`; quantities, service time and estimates `numeric(12,4)` | Exact storage; estimates include shares such as 0.35 |
| Migrations run on start-up only when `Database:MigrateOnStartup` is true (development) | Convenient locally; production applies migrations deliberately |
| Connection string only from configuration (env var `ConnectionStrings__Default`, user-secrets locally, `.env` for Compose) | No secrets in the repo. Production connection strings must use `SSL Mode=Require` (encrypted API ↔ DB link) |
| `react-router-dom` added for routing in the SPA | Not in the original stack list; it is the conventional choice and the app has several screens |
| Scenario endpoints: CRUD on `/api/scenarios`, `GET /api/scenarios/{id}/results`, and `POST /api/scenarios/simulate` (runs unsaved changes, nothing stored) | The builder shows a live preview while the owner types, without saving drafts and without calculating in the browser (debounced, ~450 ms) |
| Results DTO includes every derived figure the screens need: totals, scenario − baseline differences, per-month differences, waterfall bar positions | The browser never subtracts or adds money; it only formats strings and draws |
| Charts: decimal strings are converted to numbers **only for chart geometry** (`toPlot`); tooltips and labels show the API's exact strings | Recharts needs numbers to position bars; the displayed values stay exact |
| Changes stored flat: certain parameters in `changes.parameters` (jsonb), uncertain ones as `estimates` rows (`customersPerMonth`, `newCustomerSharePercent`, `demandChangePercent`, `newCustomersPerMonth`) | As designed; one `ChangeDto` with nullable type-specific fields keeps OpenAPI and TS types simple |
| Frontend styling: Tailwind CSS v4 with design tokens in `web/src/index.css`, palette and type from the Figma Make prototype, navy from the logo; light theme only | Same visual language as the prototype the owner tested; tokens keep colours consistent across UI and charts |
| Fonts self-hosted via `@fontsource`; icons from `lucide-react` | No requests to Google Fonts (GDPR, see `ux-design-research.md`) |
| Public landing page at `/`, sign-in at `/login` and `/register`, owner area under `/app` (lazy-loaded) | Explains the product before sign-up; the landing page does not download the charting library |
| Landing-page example figures are real engine output for a labelled sample salon, pasted in as text | No invented marketing numbers; nothing is calculated in the browser |

## Open design questions

- Build hire first, then price and marketing? Follow research and usability-test evidence.
- How to combine the three cases (all-pessimistic may exaggerate downside); sensitivity charts later.
- Timing of money: payment timing, annual holiday allowance, one-off recruitment costs.
- Adviser role: a sharing table and a second role check if advisers prove important.
- Data import and other business types stay roadmap items.
