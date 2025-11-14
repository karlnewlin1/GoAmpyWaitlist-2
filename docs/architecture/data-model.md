# Data Model
**users** (id, email, **emailCi unique**, name, emailVerifiedAt, createdAt)
**waitlist_entries** (id, **userId unique fk**, source, referrerUserId fk, createdAt)
**referral_codes** (id, **userId fk**, **code unique**, createdAt)
**referral_events** (id, referralCodeId fk, **type in ['click','signup']**, email?, createdAt) — index (referralCodeId, createdAt)
**events** (id, userId?, eventName, payload jsonb, createdAt)