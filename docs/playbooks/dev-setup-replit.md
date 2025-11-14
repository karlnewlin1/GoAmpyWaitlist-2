# Dev Setup (Replit)
Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler, sslmode=require), `APP_ORIGIN` (prod allowlist).

**Run**
```bash
pkill -f "tsx watch" || true; pkill -f "vite" || true
npm run dev # client:5000, server:5177
open http://localhost:5000 and http://localhost:5177/api/health
```

**Migrations**
```bash
npm --workspace server run db:gen
NODE_OPTIONS=--dns-result-order=ipv4first npm --workspace server run db:push
# || NODE_OPTIONS=--dns-result-order=ipv6first npm --workspace server run db:push
```

**Smoke**
```bash
curl -s http://localhost:5177/api/health
curl -s -X POST http://localhost:5177/api/waitlist/join \
  -H 'content-type: application/json' -d '{"name":"Ada","email":"ada@example.com"}'
curl -s 'http://localhost:5177/api/me/summary?email=ada@example.com'
```