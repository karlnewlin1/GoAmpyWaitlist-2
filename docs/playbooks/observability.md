# Observability
- `pino-http` with redaction (no email bodies, no tokens). Add `x-request-id` to responses.
- `/api/health` → `{ ok, db, svc, version, ts }`.
- Log metadata only; no response bodies or OTP tokens.