# BrightPath AI Support — Assignment Submission

**Candidate:** Nikhil Kumar Agarwal (`nikraj12345` · nikhilkumaragarwalk@gmail.com)  
**Repo:** https://github.com/nikraj12345/cleartax-assignment  
**Assignment:** BrightPath — “Make our support team smaller with AI”

## Summary

Built an end-to-end **grounded AI support platform**: students chat via Next.js; NestJS API runs auth, payments, refunds, and **internal tools**; an orchestrator calls OpenAI with **function tools** that only read **PostgreSQL** and **Qdrant**. Refunds stay **`pending_approval`** until finance approves in the UI.

## Plan

1. Map Exhibit A ticket types → five tool-backed modules (FAQ/schedule, video, payment, refund, login).  
2. Ship CEO demo on **web chat** + Docker full stack.  
3. Keep finance rule: **no LLM executes refunds**.

## Approach

**Tool-first agent** — the model cannot invent schedules or payment status; it must call `/internal/tools/*`. Escalations use `create_support_ticket`. See `docs/DEMO_SCRIPT.md` and `docs/ARCHITECTURE.md`.

## Run

```bash
docker compose -f docker-compose-full.yml up --build -d
```

Demo login: `student.demo@brightpath.test` / `demo1234`.

## Email to recruiter (template)

> Dear Isha,  
> Submission is in https://github.com/nikraj12345/cleartax-assignment (`docs/ASSIGNMENT_SUBMISSION.md`, README, Docker demo). Happy to walk through live.  
> — Nikhil