# Security & Privacy
- Secrets only in Replit App Secrets; never in git.
- Supabase service role: server‑only; never to client.
- CORS: `APP_ORIGIN` allowlist for prod, permissive in dev.
- Rate limit: join + auth endpoints (e.g., 60 / 15m).
- Logs: redact auth headers, cookies, emails; never log OTP tokens or response bodies.