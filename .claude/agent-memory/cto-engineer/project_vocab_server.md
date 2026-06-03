---
name: project-vocab-server
description: Core project context for vocab-server — stack, schema design, milestones, infrastructure decisions
metadata:
  type: project
---

Spaced-repetition vocabulary learning backend. Goal is both to ship a working product AND to learn backend engineering practices hands-on (Docker, CI/CD, REST API, Prisma migrations, auth).

**Stack (decided):** Node.js v24 + TypeScript + Fastify + Prisma + PostgreSQL + pnpm v11 + Vitest

**Schema (SCHEMA.md is authoritative):** User → Vocabulary → Meaning[] → Example[]; plus VocabularyTag, ReviewState (with stage 1-5), ReviewLog, UserSettings (stageThresholds JSON). Cambridge Dictionary-style multi-meaning model. Stage system is stored (not computed) to enable DB filtering.

**Auth strategy:** JWT access token (Bearer) + httpOnly cookie refresh token. bcrypt or argon2 for password hashing (TBD at session start).

**Milestone order:** Health check → Prisma+PG → Vocab CRUD → Review state/due/action → Auth → Tests → Docker prod → CI/CD → Cloudflare Tunnel

**Phase 5 (deferred):** Redis + BullMQ for background jobs (AI story gen, quiz, daily reminder). Do NOT add in MVP.

**Docker situation:** Docker NOT installed on dev machine as of 2026-06-02. Docker required for Postgres in local dev. Install Docker Engine (not Desktop) on Linux first.

**CI/CD:** GitHub Actions with self-hosted runner on Ubuntu server (server behind NAT/CGNAT — runner connects outward). Deploy: pnpm install → typecheck → test → prisma migrate deploy → docker compose up -d --build.

**Why:** Learning project by duc.mai@icetea.io — prioritize clarity and explicit patterns over magic.
