# Architecture

Student channels (web chat) call the NestJS API for auth and conversations. Each message triggers the orchestrator service, which classifies intent and calls **internal tool APIs** on NestJS (never the database directly).

Modules:

1. **FAQ / course** — schedule + Qdrant RAG over enrolled courses  
2. **Video** — Android playbooks + device reports  
3. **Payment** — transaction lookup + 48h reversal guidance + mock webhooks / reconciliation worker  
4. **Refund** — agent creates `pending_approval` only; finance UI approves; worker executes mock gateway  

Human escalation is a first-class ticket state (`escalated`).