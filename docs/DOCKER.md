# Docker operations

## Full stack (recommended for demo)

```bash
docker compose -f docker-compose-full.yml up --build -d
npm run stack:check
```

| Service | URL | Health |
|---------|-----|--------|
| Web | http://localhost:3000 | `/` |
| API | http://localhost:3001 | `/health` · Swagger `/docs` |
| Orchestrator | http://localhost:3002 | `/health` |
| Qdrant | http://localhost:6333 | dashboard |

**Migrate** runs once per `up` (migrations + seed) and exits `0` — that is expected.

## Logs

```bash
docker compose -f docker-compose-full.yml logs api --tail 100 -f
docker compose -f docker-compose-full.yml logs web --tail 50
docker compose -f docker-compose-full.yml ps
```

## Demo auth (password `demo1234`)

- `student.demo@brightpath.test` → http://localhost:3000/login → `/student`
- `support.demo@brightpath.test` → `/support`
- `finance.demo@brightpath.test` → `/finance`
- `admin.demo@brightpath.test` → `/admin`

Docker uses `ORCHESTRATOR_SERVICE_TOKEN=docker-orchestrator-token` (see `.env.example` for E2E).

**Live AI chat:** set `OPENAI_API_KEY` in `.env` and `LLM_MODE=live` (default in compose). The orchestrator calls OpenAI with **required tool use** on the first turn; tools read **PostgreSQL** and **Qdrant** via the Nest API only.

## Rebuild after code changes

```bash
docker compose -f docker-compose-full.yml up --build -d
```

## Infra only (API/web on host)

```bash
docker compose up -d
npm run dev
```