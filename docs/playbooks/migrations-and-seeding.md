# Migrations & Seeding
- Schema lives in `server/src/shared/schema.ts`.
- Generate SQL: `npm --workspace server run db:gen`
- Push: `npm --workspace server run db:push` (or paste into Supabase SQL if DNS/firewall interferes).
- Seed: add a one‑off script under `server/scripts/seed.ts` and run via `tsx`.