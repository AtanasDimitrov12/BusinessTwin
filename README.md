# BusinessTwin

Business Twin is a web-based decision simulator that helps owners of small service businesses (starting with salons and barbershops) test a decision such as hiring a worker, changing a price or spending more on marketing before they make it. The owner enters today's monthly figures, adds changes, and compares sales, costs, monthly result, cash and staff capacity month by month in a pessimistic, expected and optimistic case.

Status: proof of concept in progress. Done: scenario engine with reference tests, sign-in, business and baseline, baseline dashboard. Next: scenarios and changes, results comparison.

Stack: React + TypeScript (Vite) · ASP.NET Core Web API (C#, .NET 10) · PostgreSQL · REST/JSON · EU hosting.

## Repository

```
api/                         ASP.NET Core solution (BusinessTwin.slnx)
  BusinessTwin.Api/          Endpoints, auth, validation, ownership guard, EF Core + migrations
  BusinessTwin.Engine/       Scenario engine: pure C#, no web or DB code
  BusinessTwin.Engine.Tests/ Hand-worked reference cases
  openapi/openapi.json       API contract, regenerated on every API build
web/                         React + TS SPA; src/api/schema.d.ts is generated from the contract
docker-compose.yml           Local API + PostgreSQL
docs/                        Overview, architecture, calculation model, process
```

## Running locally

Requirements: .NET 10 SDK, Node 24, and Docker (or a PostgreSQL 16+ you run yourself).

```bash
# 1. Database + API
cp .env.example .env               # set POSTGRES_PASSWORD
docker compose up --build          # API on http://localhost:5175, migrations run on start

# 2. Web app
cd web && npm install && npm run dev   # http://localhost:5173, proxies /api to the API
```

Running the API outside Docker (against any PostgreSQL):

```bash
cd api
dotnet user-secrets --project BusinessTwin.Api set ConnectionStrings:Default \
  "Host=localhost;Port=5432;Database=businesstwin;Username=businesstwin;Password=<your password>"
dotnet run --project BusinessTwin.Api        # http://localhost:5175, OpenAPI at /openapi/v1.json
```

## Everyday commands

| Task | Command |
|---|---|
| Engine tests | `cd api && dotnet test` |
| New migration | `cd api && dotnet tool restore && dotnet ef migrations add <Name> -p BusinessTwin.Api -o Data/Migrations` |
| Refresh API types in the web app | `cd api && dotnet build`, then `cd web && npm run gen:api` |
| Web build / lint | `cd web && npm run build && npm run lint` |

CI (`.github/workflows/ci.yml`) builds both apps, runs the engine tests, and fails if the OpenAPI document or the generated TypeScript types are out of date.

See [`docs/`](docs/) for the project overview, architecture, calculation model and process, and [`CLAUDE.md`](CLAUDE.md) for the context Claude Code uses in this repo.
