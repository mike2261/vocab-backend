# vocab-server — Cloudflare Worker

Stack: **Hono** · **Cloudflare D1** · **Kysely** · **ArkType** · **Biome**

## Commands

- `pnpm dev` — local dev via `wrangler dev` (port 8787)
- `pnpm deploy` — deploy to Cloudflare
- `pnpm type-check` — TypeScript check
- `pnpm lint:fix` — auto-fix with Biome
- `pnpm test` — Vitest with Workers pool

## Conventions

- Handlers in `src/handlers/` — Hono route files
- Services in `src/services/` — business logic, Kysely queries
- `src/hxxp/` — error handling, validation middleware (ArkType), JWT middleware
- Migrations in `migrations/` — plain SQL, run via `wrangler d1 execute`
- No barrel exports — import directly from source files
- Early return over nested conditionals
- No `as` type assertions, no `!` non-null assertions

## Secrets (set via `wrangler secret put`)

`JWT_SECRET` · `JWT_REFRESH_SECRET` · `OPENROUTER_API_KEY`
Optional: `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `GOOGLE_CALLBACK_URL` · `GOOGLE_REDIRECT_FE_URL`

## Plans

Store in `docs/` with convention: `yyyy-mm-dd-plan-name.md`
