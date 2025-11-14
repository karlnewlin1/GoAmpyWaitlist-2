# PR-A: Security & Reliability Hardening - Implementation Plan

**Target:** Production-ready security baseline  
**Estimated Effort:** 2-3 days  
**Priority:** 🔴 CRITICAL (blocks production deployment)

---

## Overview

This PR addresses critical security vulnerabilities and reliability concerns identified in the architecture review. All changes are server-side, focusing on middleware hardening and API reliability.

---

## Changes Breakdown

### 1. Enhanced Pino HTTP Redaction

**File:** [`server/src/middleware/logger.ts`](../server/src/middleware/logger.ts)

**Current Issues:**
- ❌ `req.headers.cookie` not redacted (exposes session tokens)
- ❌ `req.body.token` not redacted (exposes OTP codes)
- ❌ Response bodies logged in production (PII leak)

**Changes:**
```typescript
export function getLoggerMiddleware() {
  return pinoHttp({
    customProps: req => ({ 
      reqId: req.headers['x-request-id'] ?? randomUUID(), 
      svc: 'goampy-bff' 
    }),
    redact: {
      paths: [
        // Headers
        'req.headers.authorization',
        'req.headers.cookie',
        // Request body PII
        'req.body.email',
        'req.body.password',
        'req.body.token',
        'req.body.code',
        'req.body.name',
        // Response body (prod only to avoid debugging pain in dev)
        ...(process.env.NODE_ENV === 'production' ? ['res.body'] : [])
      ],
      remove: true
    },
    serializers: { 
      res: (res) => ({ statusCode: res.statusCode }) 
    },
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  });
}
```

**Testing:**
```bash
# Start server with production env
NODE_ENV=production npm --workspace server run dev

# Send request with sensitive data
curl -X POST http://localhost:5177/api/waitlist/join \
  -H 'Cookie: session=secret123' \
  -H 'Authorization: Bearer token456' \
  -d '{"email":"test@example.com","name":"Test User"}' | jq .

# Verify logs don't contain:
# - "secret123"
# - "token456"
# - "test@example.com"
# - Response body in prod
```

---

### 2. Strict CORS Allowlist

**File:** [`server/src/middleware/cors.ts`](../server/src/middleware/cors.ts)

**Current Issue:**
```typescript
// DANGEROUS: Falls back to allowing ANY origin
origin: origins && origins.length > 0 ? origins : true
```

**Changes:**
```typescript
import cors from 'cors';
import { ENV } from '../config/env.js';

export function getCorsMiddleware() {
  const origins = ENV.APP_ORIGIN;
  
  // Fail fast if APP_ORIGIN not configured
  if (!origins || origins.length === 0) {
    throw new Error(
      'CORS_MISCONFIGURED: APP_ORIGIN environment variable must be set. ' +
      'Example: APP_ORIGIN=https://goampy.com,http://localhost:5000'
    );
  }
  
  return cors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'idempotency-key'],
  });
}
```

**Testing:**
```bash
# Without APP_ORIGIN - should fail to start
unset APP_ORIGIN
npm --workspace server run dev
# Expected: Error with clear message

# With APP_ORIGIN - should work
export APP_ORIGIN=http://localhost:5000,http://localhost:5177
npm --workspace server run dev

# Test CORS rejection
curl -i -H "Origin: https://evil.com" http://localhost:5177/api/health
# Expected: CORS error (Access-Control-Allow-Origin not present)

# Test CORS acceptance
curl -i -H "Origin: http://localhost:5000" http://localhost:5177/api/health
# Expected: Access-Control-Allow-Origin: http://localhost:5000
```

---

### 3. Rate Limiting for Referral Redirects

**File:** [`server/src/middleware/rateLimit.ts`](../server/src/middleware/rateLimit.ts)

**Current Issue:**
- ❌ `/r/:code` endpoint has NO rate limiting (DoS vector)

**Changes:**
```typescript
import rateLimit from 'express-rate-limit';

// Existing limiters...

export const referralClickLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 clicks per window per IP
  standardHeaders: 'draft-7', // Add RateLimit-* headers
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  message: { 
    error: { 
      code: 'rate_limit_exceeded', 
      message: 'Too many referral clicks from this IP, please try again later.' 
    }
  }
});
```

**File:** [`server/src/routes/redirects.ts`](../server/src/routes/redirects.ts)

**Changes:**
```typescript
import { Router } from 'express';
import { referralService } from '../services/referral.js';
import { asyncHandler } from '../middleware/errors.js';
import { referralClickLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Apply rate limiting BEFORE the handler
router.get('/r/:code', referralClickLimiter, asyncHandler(async (req, res) => {
  const code = req.params.code;
  
  // Log click event (fire and forget, don't block on errors)
  referralService.logClick(code).catch(err => 
    console.error('Failed to log referral click:', err)
  );
  
  // Redirect to landing with normalized code
  const normalizedCode = referralService.normCode(code);
  res.redirect(`/?ref=${encodeURIComponent(normalizedCode)}`);
}));

export default router;
```

**Testing:**
```bash
# Flood referral endpoint
for i in {1..105}; do
  curl -w "%{http_code}\n" http://localhost:5177/r/test-code
done

# Expected:
# - First 100: 302 (redirect)
# - Next 5: 429 (rate limit exceeded)
# - Response includes RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset headers
```

---

### 4. Idempotency-Key Enforcement

**File:** [`server/src/routes/waitlist.ts`](../server/src/routes/waitlist.ts)

**Current Issue:**
- Natural idempotency via DB constraints
- ❌ No explicit Idempotency-Key support
- ❌ Client retries on timeout could cause race conditions

**Changes:**

First, create an in-memory idempotency store:

**New File:** [`server/src/lib/idempotency.ts`](../server/src/lib/idempotency.ts)
```typescript
import { randomUUID } from 'crypto';

interface IdempotencyRecord {
  key: string;
  response: any;
  timestamp: number;
}

// Simple in-memory store (replace with Redis in production)
const store = new Map<string, IdempotencyRecord>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const TTL = 15 * 60 * 1000; // 15 minutes
  
  for (const [key, record] of store.entries()) {
    if (now - record.timestamp > TTL) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class IdempotencyService {
  /**
   * Check if request has been processed before
   * Returns cached response if found, null otherwise
   */
  check(key: string): any | null {
    const record = store.get(key);
    
    if (!record) return null;
    
    // Check if expired
    const age = Date.now() - record.timestamp;
    const TTL = 15 * 60 * 1000; // 15 minutes
    
    if (age > TTL) {
      store.delete(key);
      return null;
    }
    
    return record.response;
  }

  /**
   * Store response for future idempotency checks
   */
  store(key: string, response: any): void {
    store.set(key, {
      key,
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Extract idempotency key from request
   * Falls back to generating one from email (for backward compatibility)
   */
  extractKey(req: any): string {
    const headerKey = req.headers['idempotency-key'];
    
    if (headerKey) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(headerKey)) {
        throw new Error('Idempotency-Key must be a valid UUID');
      }
      return headerKey;
    }
    
    // Fallback: generate deterministic key from email
    // This provides natural idempotency without requiring clients to change
    const email = req.body?.email;
    if (email) {
      return `email:${email.toLowerCase().trim()}`;
    }
    
    // No email and no key - generate random (won't prevent duplicates)
    return `random:${randomUUID()}`;
  }
}

export const idempotencyService = new IdempotencyService();
```

**Update:** [`server/src/routes/waitlist.ts`](../server/src/routes/waitlist.ts)
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { users, waitlistEntries, events } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { referralService, normCode } from '../services/referral.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import { idempotencyService } from '../lib/idempotency.js';

const r = Router();
const Body = z.object({ 
  name: z.string().min(2), 
  email: z.string().email(), 
  ref: z.string().optional().nullable() 
});

const DISPOSABLE = /(^|\.)((mailinator|10minutemail|guerrillamail|tempmail)\.com)$/i;

r.post('/join', asyncHandler(async (req, res) => {
  // Extract idempotency key
  const idempotencyKey = idempotencyService.extractKey(req);
  
  // Check if we've seen this request before
  const cached = idempotencyService.check(idempotencyKey);
  if (cached) {
    return res.json(cached);
  }
  
  const { name, email, ref } = Body.parse(req.body);
  
  // Block disposable emails
  if (DISPOSABLE.test(email.split('@')[1] || '')) {
    throw new AppError(
      'Disposable email addresses are not allowed',
      'disposable_email',
      400
    );
  }
  
  const eci = email.trim().toLowerCase();
  const refCode = ref ? normCode(ref) : null;

  const result = await db.transaction(async (tx) => {
    // ... existing transaction logic ...
    
    return { code, userId: u.id };
  });

  const response = { 
    code: result.code, 
    referralLink: `/r/${result.code}` 
  };
  
  // Store for idempotency
  idempotencyService.store(idempotencyKey, response);
  
  res.json(response);
}));

export default r;
```

**Testing:**
```bash
# Test with explicit Idempotency-Key
KEY=$(uuidgen)
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Idempotency-Key: $KEY" \
  -d '{"name":"Test","email":"test@example.com"}' | jq .

# Retry with same key - should return cached response instantly
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Idempotency-Key: $KEY" \
  -d '{"name":"Test","email":"test@example.com"}' | jq .

# Test invalid UUID
curl -i -X POST http://localhost:5177/api/waitlist/join \
  -H "Idempotency-Key: not-a-uuid" \
  -d '{"name":"Test","email":"test2@example.com"}'
# Expected: 400 with validation error
```

---

### 5. Health Check with Git SHA

**File:** [`server/src/config/env.ts`](../server/src/config/env.ts)

**Changes:**
```typescript
export const ENV = {
  // ... existing config ...
  
  // Version tracking
  GIT_SHA: process.env.GIT_SHA || process.env.REPL_SLUG || 'dev',
};
```

**File:** [`package.json`](../package.json) - Add build script

**Changes:**
```json
{
  "scripts": {
    "dev": "concurrently -k -n server,client -c magenta,cyan \"npm --workspace server run dev\" \"npm --workspace client run dev\"",
    "build": "export GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown') && npm --workspace client run build && npm --workspace server run build",
    "build:replit": "npm run build"
  }
}
```

**File:** [`server/src/routes/health.ts`](../server/src/routes/health.ts)

**Current vs New:**
```typescript
// Current
router.get('/health', asyncHandler(async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({
      ok: true,
      db: true,
      svc: 'goampy-bff',
      version: ENV.GIT_SHA,  // Currently 'dev'
      ts: new Date().toISOString()
    });
  } catch {
    return res.status(500).json({ ok: false, db: false });
  }
}));

// New - add more diagnostics
router.get('/health', asyncHandler(async (_req, res) => {
  let dbHealthy = false;
  let dbError: string | undefined;
  
  try {
    await db.execute(sql`select 1`);
    dbHealthy = true;
  } catch (error: any) {
    dbError = error.message;
  }
  
  const health = {
    ok: dbHealthy,
    db: dbHealthy,
    svc: 'goampy-bff',
    version: ENV.GIT_SHA,
    env: ENV.NODE_ENV,
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    ...(dbError && { dbError })
  };
  
  res
    .status(dbHealthy ? 200 : 503)
    .json(health);
}));
```

**Testing:**
```bash
# Build with SHA
npm run build

# Check health includes SHA
curl http://localhost:5177/api/health | jq .
# Expected: { "version": "abc1234", ... }

# Test with DB down
# (stop database or use invalid DATABASE_URL)
curl -i http://localhost:5177/api/health
# Expected: 503 with { "ok": false, "db": false, ... }
```

---

## Testing Checklist

### Security Testing
- [ ] PII not in logs when `NODE_ENV=production`
  - [ ] Authorization header redacted
  - [ ] Cookie header redacted
  - [ ] Email in request body redacted
  - [ ] Token/code in request body redacted
  - [ ] Response body not logged in prod
- [ ] CORS strictly enforced
  - [ ] Server fails to start without `APP_ORIGIN`
  - [ ] Requests from allowed origins succeed
  - [ ] Requests from other origins rejected
- [ ] Rate limiting works
  - [ ] `/api/waitlist/join` limited to 60/15min
  - [ ] `/api/auth/*` limited to 60/15min
  - [ ] `/r/:code` limited to 100/15min
  - [ ] Rate-limit headers present in responses

### Reliability Testing
- [ ] Idempotency prevents duplicates
  - [ ] Same Idempotency-Key returns cached response
  - [ ] Invalid UUID rejected with clear error
  - [ ] Email-based fallback works
  - [ ] Cached responses expire after 15 minutes
- [ ] Health check accuracy
  - [ ] Returns 200 when DB healthy
  - [ ] Returns 503 when DB down
  - [ ] Includes actual git SHA
  - [ ] Includes uptime and env

### Load Testing
```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 http://localhost:5177/api/health
ab -n 200 -c 5 http://localhost:5177/r/test-code

# Verify:
# - Rate limits trigger appropriately
# - No errors under normal load
# - Response times acceptable (<100ms p95)
```

---

## Migration Notes

### Environment Variables
After deploying PR-A, ensure these are set:

```bash
# Required (new validation will enforce)
APP_ORIGIN=https://goampy.com,https://www.goampy.com

# Optional (for version tracking)
GIT_SHA=<commit-sha>  # Auto-set in build

# Existing (ensure set)
DATABASE_URL=postgresql://...
SESSION_SECRET=<32+ char random string>
```

### Breaking Changes
❌ **BREAKING:** `APP_ORIGIN` is now required. Server will not start without it.

**Migration:** Set `APP_ORIGIN` in Replit Secrets before deploying.

### Backward Compatibility
✅ All other changes are backward compatible:
- Idempotency-Key is optional (falls back to email-based)
- Additional log redaction doesn't break existing logs
- Rate limiting allows generous limits
- Health check adds fields but maintains existing structure

---

## Rollback Plan

If issues arise:
1. Revert Git commit
2. Redeploy previous version
3. Keep `APP_ORIGIN` set (safe to leave)

**Low Risk:** All changes are additive except CORS enforcement (which should be set regardless).

---

## Success Criteria

- [ ] All tests pass
- [ ] No PII in production logs
- [ ] CORS properly restricts origins
- [ ] Rate limiting prevents abuse
- [ ] Idempotency prevents duplicate joins
- [ ] Health check shows real version
- [ ] No performance degradation
- [ ] Code review approved by 2+ reviewers

---

## Next Steps After PR-A

1. Deploy to staging environment
2. Run security audit with OWASP ZAP
3. Monitor logs for 24h
4. Proceed with PR-B (PWA enhancements)