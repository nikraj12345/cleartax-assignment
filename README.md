# BrightPath AI Student Support Automation Platform

Monorepo for the BrightPath case study: NestJS API, LangGraph-style orchestrator (fixture mode by default), Next.js UI, PostgreSQL, Redis, Qdrant, and mock payments.

## Prerequisites

- Node.js 20+
- Docker (for Postgres, Redis, Qdrant)

## Quick start (infra in Docker, apps on host)

```bash
cp .env.example .env
docker compose up -d
npm install
npm run build -w @brightpath/shared
cd apps/api && npx prisma migrate dev --name init && npm run seed && cd ../..
npm run rag:ingest
npm run dev
```

- Web: http://localhost:3000  
- API: http://localhost:3001 (Swagger: `/docs`)  
- Orchestrator: http://localhost:3002  

Demo logins (password `demo1234`):

| Role | Email |
|------|--------|
| Student | `student.demo@brightpath.test` |
| Support lead | `support.demo@brightpath.test` |
| Finance | `finance.demo@brightpath.test` |
| Admin | `admin.demo@brightpath.test` |

After login you land in a **role-specific workspace** (sidebar nav, dashboards, live API data). Re-run `npm run db:seed` after pulling to create support/admin demo users.

## Full stack in Docker

```bash
docker compose -f docker-compose-full.yml up --build -d
npm run stack:check
```

If `api` exits, check logs: `docker compose -f docker-compose-full.yml logs api --tail 100`

Infra only (Postgres/Redis/Qdrant on host ports):

```bash
docker compose up -d
```

## Tests

```bash
# Unit (refund FSM)
npm test -w @brightpath/api

# API E2E (requires running api + orchestrator + seeded DB)
npm run test:api-e2e
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

## Engineering rules

See [SKILL.md](SKILL.md) for migration, RAG, payment/refund safety, and definition of done.