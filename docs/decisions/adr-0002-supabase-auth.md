# ADR-0002 Supabase Auth (OTP/Magic Link)
**Decision:** Use Supabase OTP/magic link for email verification.  
**Why:** Low friction verification (+20 points), protects referral integrity, easy server integration with service role.  
**Impact:** `/api/auth/otp/send|verify`; sets `users.emailVerifiedAt`; points reflect verification.