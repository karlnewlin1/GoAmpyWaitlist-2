# Backend BFF
Node 20 + Express + Drizzle (postgres-js). Supabase pooler **requires** `prepare:false` and `ssl:'require'`. `app.set('trust proxy',1)`, CORS allowlist via `APP_ORIGIN`, `helmet`, and `pino-http` with PII redaction.

**Key routes**
- `POST /api/waitlist/join` → **transaction**: user + waitlist + code + events; self‑referral guard; dedupe signup
- `GET /r/:code` → log click; 302 → `/?ref=<code>`
- `GET /share/:code` → OG HTML for LinkedIn unfurl; meta refresh to `/?ref=<code>`
- `GET /api/me/summary` → points/referrals/(rank)
- `POST /api/auth/otp/send|verify` → Supabase OTP; sets `emailVerifiedAt`