# HTTP Contract (BFF)

All responses MAY include `{ error: { code, message } }`.

**POST /api/waitlist/join**  
Body `{ name, email, ref? }` → `200 { referralLink: "/r/<code>" }`  
Txn: upsert user, ensure waitlist entry, ensure referral code, events; if `ref`, set `referrerUserId` + log `signup` (deduped).

**GET /r/:code**  
Log `click` then `302` to `/?ref=<code>`.

**GET /share/:code**  
An HTML page with OG tags; meta‑refreshes to `/?ref=<code>` for humans.

**GET /api/me/summary?email=<email>`**  
`200 { points, referrals, rank?, verified? }` (points = 10 + 20*verified + 10*signups)

**POST /api/auth/otp/send** → `{ ok:true }`  
**POST /api/auth/otp/verify** → `{ verified:true }`