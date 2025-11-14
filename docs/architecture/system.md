# System Overview
Client (React 19 + Vite) → BFF (Express + Drizzle) → Supabase Postgres. Referral loop:
Join → create/ensure user+waitlist+code (txn) → link `/r/:code` → click logs → `/?ref=code` → referred signup logs "signup".