# PR-C: OpenAPI Contract & Documentation - Implementation Plan

**Target:** Developer-friendly API documentation  
**Estimated Effort:** 1-2 days  
**Priority:** 🟢 MEDIUM (improves developer experience)

---

## Overview

This PR creates a comprehensive OpenAPI 3.1 specification for the GoAmpy BFF API, making it easier for developers to integrate, understand error handling, and maintain API contracts. Includes a self-hosted Redoc documentation site.

---

## Changes Breakdown

### 1. OpenAPI 3.1 Specification

**New File:** [`docs/api/openapi.yaml`](../docs/api/openapi.yaml)

**Full Specification:**
```yaml
openapi: 3.1.0
info:
  title: GoAmpy BFF API
  version: 1.0.0
  description: |
    Backend-for-Frontend API for the GoAmpy waitlist and referral system.
    
    ## Features
    - Email-based waitlist with referral tracking
    - Points system (10 base + 20 verified + 10 per referral)
    - Cryptographically secure referral codes
    - Anti-abuse measures (rate limiting, self-referral prevention)
    - OTP email verification (planned)
    
    ## Rate Limiting
    All endpoints include rate limit headers:
    - `RateLimit-Limit`: Maximum requests per window
    - `RateLimit-Remaining`: Remaining requests in current window
    - `RateLimit-Reset`: Unix timestamp when window resets
    
    ## Idempotency
    POST endpoints support idempotency via `Idempotency-Key` header (UUID format).
    Duplicate requests return cached response with 200 status.
    
    ## Error Handling
    All errors follow a consistent format with machine-readable codes.
    See Error Taxonomy section below.
    
  contact:
    name: GoAmpy API Support
    url: https://goampy.com/support
    email: support@goampy.com
  license:
    name: Proprietary
    
servers:
  - url: http://localhost:5177
    description: Local development
  - url: https://goampy.replit.app
    description: Staging (Replit)
  - url: https://api.goampy.com
    description: Production

tags:
  - name: health
    description: Service health monitoring
  - name: waitlist
    description: Waitlist join and management
  - name: referral
    description: Referral tracking and attribution
  - name: user
    description: User profile and points
  - name: auth
    description: Authentication and verification
  - name: leaderboard
    description: Top users by points

paths:
  /api/health:
    get:
      summary: Health check
      description: Returns service health status and version information
      tags: [health]
      operationId: getHealth
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                required: [ok, db, svc, version, ts]
                properties:
                  ok:
                    type: boolean
                    example: true
                  db:
                    type: boolean
                    example: true
                    description: Database connection healthy
                  svc:
                    type: string
                    example: goampy-bff
                  version:
                    type: string
                    example: abc1234
                    description: Git commit SHA
                  env:
                    type: string
                    example: production
                  ts:
                    type: string
                    format: date-time
                    example: "2025-11-14T17:00:00.000Z"
                  uptime:
                    type: number
                    example: 3600.5
                    description: Process uptime in seconds
        '503':
          description: Service unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthError'

  /api/waitlist/join:
    post:
      summary: Join waitlist
      description: |
        Register for the waitlist with optional referral attribution.
        This endpoint is idempotent - repeated calls return the same referral code.
        
        **Anti-Abuse:**
        - Blocks disposable email domains
        - Prevents self-referral (400 error)
        - Rate limited to 60 requests per 15 minutes per IP
        
        **Idempotency:**
        Supports `Idempotency-Key` header or falls back to email-based deduplication.
      tags: [waitlist]
      operationId: joinWaitlist
      parameters:
        - name: Idempotency-Key
          in: header
          description: UUID for request deduplication (optional but recommended)
          required: false
          schema:
            type: string
            format: uuid
            example: "550e8400-e29b-41d4-a716-446655440000"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, email]
              properties:
                name:
                  type: string
                  minLength: 2
                  example: Ada Lovelace
                email:
                  type: string
                  format: email
                  example: ada@example.com
                ref:
                  type: string
                  nullable: true
                  example: ada-lovelace-x7q3vg
                  description: Referral code from inviter
      responses:
        '200':
          description: Successfully joined waitlist
          headers:
            RateLimit-Limit:
              $ref: '#/components/headers/RateLimit-Limit'
            RateLimit-Remaining:
              $ref: '#/components/headers/RateLimit-Remaining'
            RateLimit-Reset:
              $ref: '#/components/headers/RateLimit-Reset'
          content:
            application/json:
              schema:
                type: object
                required: [code, referralLink]
                properties:
                  code:
                    type: string
                    example: ada-lovelace-x7q3vg
                    description: User's unique referral code
                  referralLink:
                    type: string
                    example: /r/ada-lovelace-x7q3vg
                    description: Shareable referral link (relative path)
        '400':
          description: Validation error or business logic error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              examples:
                disposable_email:
                  value:
                    error:
                      code: disposable_email
                      message: Disposable email addresses are not allowed
                self_referral:
                  value:
                    error:
                      code: self_referral
                      message: You cannot use your own referral code
                validation_error:
                  value:
                    error:
                      code: validation_error
                      message: Invalid email format
        '429':
          description: Rate limit exceeded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /r/{code}:
    get:
      summary: Referral redirect
      description: |
        Tracks referral click and redirects to landing page with ref parameter.
        Rate limited to prevent abuse (100 clicks per 15 minutes per IP).
      tags: [referral]
      operationId: referralRedirect
      parameters:
        - name: code
          in: path
          required: true
          description: Referral code to track
          schema:
            type: string
            example: ada-lovelace-x7q3vg
      responses:
        '302':
          description: Redirect to landing page
          headers:
            Location:
              schema:
                type: string
                example: /?ref=ada-lovelace-x7q3vg
            RateLimit-Limit:
              $ref: '#/components/headers/RateLimit-Limit'
            RateLimit-Remaining:
              $ref: '#/components/headers/RateLimit-Remaining'
        '429':
          description: Too many clicks from this IP
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /share/{code}:
    get:
      summary: Social share page
      description: |
        HTML page with Open Graph tags optimized for social media sharing.
        Includes rich preview (1200x630 image) and auto-redirects to landing page.
        
        **Caching:** 10 minute TTL (600 seconds) for social media crawlers
      tags: [referral]
      operationId: sharePage
      parameters:
        - name: code
          in: path
          required: true
          description: Referral code to share
          schema:
            type: string
            example: ada-lovelace-x7q3vg
      responses:
        '200':
          description: HTML page with OG tags
          headers:
            Cache-Control:
              schema:
                type: string
                example: public, max-age=600, s-maxage=600
          content:
            text/html:
              example: |
                <!doctype html>
                <html>
                <head>
                  <meta property="og:title" content="Ada invited you to join GoAmpy">
                  <meta property="og:image" content="https://goampy.com/og/ampy-card.png">
                  ...

  /api/me/summary:
    get:
      summary: Get user summary
      description: |
        Returns user's points, referral count, and rank.
        
        **Points Calculation:**
        - Base: 10 points
        - Email verified: +20 points
        - Per referral: +10 points
        
        Total = 10 + (verified ? 20 : 0) + (referrals × 10)
      tags: [user]
      operationId: getUserSummary
      parameters:
        - name: email
          in: query
          required: true
          description: User's email address
          schema:
            type: string
            format: email
            example: ada@example.com
      responses:
        '200':
          description: User summary
          content:
            application/json:
              schema:
                type: object
                required: [points, referrals]
                properties:
                  points:
                    type: integer
                    example: 50
                    description: Total points earned
                  referrals:
                    type: integer
                    example: 3
                    description: Number of successful referrals
                  rank:
                    type: integer
                    nullable: true
                    example: 42
                    description: Position on leaderboard (1-based)
                  verified:
                    type: boolean
                    example: true
                    description: Email verification status
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/leaderboard/top:
    get:
      summary: Get leaderboard
      description: Returns top users by points with caching
      tags: [leaderboard]
      operationId: getLeaderboard
      parameters:
        - name: limit
          in: query
          required: false
          description: Number of top users to return
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
      responses:
        '200':
          description: Top users
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  required: [rank, name, points, referrals]
                  properties:
                    rank:
                      type: integer
                      example: 1
                    name:
                      type: string
                      example: Ada L.
                    points:
                      type: integer
                      example: 150
                    referrals:
                      type: integer
                      example: 12

  /api/auth/otp/send:
    post:
      summary: Send OTP code
      description: |
        Send a one-time password to user's email for verification.
        Rate limited to 5 requests per 15 minutes per IP.
      tags: [auth]
      operationId: sendOTP
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email:
                  type: string
                  format: email
                  example: ada@example.com
      responses:
        '200':
          description: OTP sent successfully
          headers:
            RateLimit-Limit:
              $ref: '#/components/headers/RateLimit-Limit'
            RateLimit-Remaining:
              $ref: '#/components/headers/RateLimit-Remaining'
          content:
            application/json:
              schema:
                type: object
                required: [ok]
                properties:
                  ok:
                    type: boolean
                    example: true
        '429':
          description: Too many OTP requests
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/auth/otp/verify:
    post:
      summary: Verify OTP code
      description: |
        Verify the one-time password sent to user's email.
        Rate limited to 10 requests per 15 minutes per IP.
      tags: [auth]
      operationId: verifyOTP
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, code]
              properties:
                email:
                  type: string
                  format: email
                  example: ada@example.com
                code:
                  type: string
                  pattern: '^\d{6}$'
                  example: "123456"
      responses:
        '200':
          description: OTP verified successfully
          content:
            application/json:
              schema:
                type: object
                required: [verified]
                properties:
                  verified:
                    type: boolean
                    example: true
        '400':
          description: Invalid or expired code
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  headers:
    RateLimit-Limit:
      description: Maximum requests per window
      schema:
        type: integer
        example: 60
    RateLimit-Remaining:
      description: Remaining requests in current window
      schema:
        type: integer
        example: 45
    RateLimit-Reset:
      description: Unix timestamp when window resets
      schema:
        type: integer
        example: 1699987200

  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
              description: Machine-readable error code
              enum:
                - validation_error
                - disposable_email
                - self_referral
                - rate_limit_exceeded
                - duplicate_request
                - not_found
                - internal_error
                - unauthorized
                - forbidden
              example: self_referral
            message:
              type: string
              description: Human-readable error message
              example: You cannot use your own referral code
            details:
              type: object
              description: Additional error context (optional)
              additionalProperties: true
    
    HealthError:
      type: object
      required: [ok, db]
      properties:
        ok:
          type: boolean
          example: false
        db:
          type: boolean
          example: false
        dbError:
          type: string
          example: Connection timeout
          
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: session
      description: Session cookie (future use)

# Error Code Taxonomy
x-error-codes:
  validation_error:
    description: Request validation failed (invalid email, missing fields, etc.)
    status: 400
    retry: false
  
  disposable_email:
    description: Email domain is on disposable/temporary email blocklist
    status: 400
    retry: false
  
  self_referral:
    description: User attempted to use their own referral code
    status: 400
    retry: false
  
  rate_limit_exceeded:
    description: Too many requests from this IP address
    status: 429
    retry: true
    retry_after: Check RateLimit-Reset header
  
  duplicate_request:
    description: Request with same Idempotency-Key already processed
    status: 409
    retry: false
  
  not_found:
    description: Resource not found (user, referral code, etc.)
    status: 404
    retry: false
  
  internal_error:
    description: Unexpected server error
    status: 500
    retry: true
    retry_after: Exponential backoff recommended
  
  unauthorized:
    description: Authentication required but not provided
    status: 401
    retry: false
  
  forbidden:
    description: Authenticated but not authorized for this resource
    status: 403
    retry: false
```

---

### 2. Redoc Documentation Endpoint

**New File:** [`server/src/routes/docs.ts`](../server/src/routes/docs.ts)

```typescript
import { Router } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve OpenAPI spec
router.get('/openapi.yaml', (_req, res) => {
  const specPath = join(__dirname, '../../../docs/api/openapi.yaml');
  const spec = readFileSync(specPath, 'utf-8');
  res.type('yaml').send(spec);
});

// Serve Redoc UI
router.get('/', (_req, res) => {
  res.type('html').send(`
<!DOCTYPE html>
<html>
<head>
  <title>GoAmpy API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <redoc spec-url="/api/docs/openapi.yaml"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>
  `);
});

export default router;
```

**Update:** [`server/src/app.ts`](../server/src/app.ts)

```typescript
import docs from './routes/docs.js';

export function createApp() {
  const app = express();
  
  // ... existing middleware ...
  
  // API docs (dev only)
  if (ENV.NODE_ENV !== 'production') {
    app.use('/api/docs', docs);
  }
  
  // ... rest of routes ...
}
```

---

### 3. Update API Documentation

**Update:** [`docs/api/README.md`](../docs/api/README.md)

```markdown
# GoAmpy API Documentation

## Interactive Documentation

- **Development:** http://localhost:5177/api/docs
- **Staging:** https://goampy.replit.app/api/docs
- **OpenAPI Spec:** [openapi.yaml](./openapi.yaml)

## Quick Links

- [HTTP Contract](./http-contract.md) - Human-readable API overview
- [OpenAPI Spec](./openapi.yaml) - Machine-readable specification
- [Error Codes](#error-codes) - Complete error taxonomy

## Base URLs

- **Local:** `http://localhost:5177`
- **Staging:** `https://goampy.replit.app`
- **Production:** `https://api.goampy.com`

## Authentication

Currently, the API is public for waitlist operations. Session-based authentication will be added for user-specific endpoints.

## Rate Limiting

All endpoints return rate limit headers:

```http
RateLimit-Limit: 60
RateLimit-Remaining: 45
RateLimit-Reset: 1699987200
```

**Limits:**
- `/api/waitlist/join`: 60 req/15min
- `/api/auth/otp/*`: 60 req/15min total
- `/r/:code`: 100 req/15min

## Idempotency

POST endpoints support the `Idempotency-Key` header (UUID format):

```bash
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com"}'
```

Duplicate requests return the cached response instantly.

## Error Codes

All errors follow this format:

```json
{
  "error": {
    "code": "self_referral",
    "message": "You cannot use your own referral code"
  }
}
```

### Error Code Reference

| Code | Status | Retryable | Description |
|------|--------|-----------|-------------|
| `validation_error` | 400 | No | Invalid request format or data |
| `disposable_email` | 400 | No | Email domain is blocked |
| `self_referral` | 400 | No | Cannot use own referral code |
| `rate_limit_exceeded` | 429 | Yes | Too many requests |
| `duplicate_request` | 409 | No | Idempotent request already processed |
| `not_found` | 404 | No | Resource doesn't exist |
| `internal_error` | 500 | Yes | Unexpected server error |

## Examples

See [openapi.yaml](./openapi.yaml) for complete examples of all endpoints.

### Join Waitlist

```bash
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "ref": "john-doe-x7q3vg"
  }'
```

### Get User Summary

```bash
curl "http://localhost:5177/api/me/summary?email=ada@example.com"
```

### Referral Flow

```bash
# 1. User clicks referral link
curl -i http://localhost:5177/r/john-doe-x7q3vg
# → 302 redirect to /?ref=john-doe-x7q3vg

# 2. New user joins
curl -X POST http://localhost:5177/api/waitlist/join \
  -d '{"name":"Ada","email":"ada@example.com","ref":"john-doe-x7q3vg"}'
```

## SDK Generation

Use the OpenAPI spec to generate type-safe SDKs:

```bash
# TypeScript
npx openapi-typescript docs/api/openapi.yaml -o client/src/api/types.ts

# Python
openapi-generator-cli generate -i docs/api/openapi.yaml -g python -o sdk/python

# Go
openapi-generator-cli generate -i docs/api/openapi.yaml -g go -o sdk/go
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for API version history.
```

---

## Testing Checklist

### OpenAPI Validation
- [ ] Spec validates against OpenAPI 3.1 schema
  ```bash
  npx @redocly/cli lint docs/api/openapi.yaml
  ```
- [ ] All endpoints documented
- [ ] All error codes defined
- [ ] Examples are valid JSON
- [ ] References resolve correctly

### Documentation Site
- [ ] Redoc loads at /api/docs (dev only)
- [ ] OpenAPI spec loads at /api/docs/openapi.yaml
- [ ] All operations expandable
- [ ] Code examples syntax highlighted
- [ ] Try-it-out works (if enabled)
- [ ] Mobile responsive

### Integration Testing
```bash
# Generate TypeScript types
npx openapi-typescript docs/api/openapi.yaml \
  -o client/src/api/generated-types.ts

# Verify types match actual responses
npm test
```

---

## Tools & Resources

### OpenAPI Validators
```bash
# Install validator
npm install -g @redocly/cli

# Validate spec
redocly lint docs/api/openapi.yaml

# Bundle spec (for distribution)
redocly bundle docs/api/openapi.yaml \
  -o docs/api/openapi.bundled.yaml
```

### SDK Generators
- **TypeScript:** `openapi-typescript`
- **Python:** `openapi-generator-cli`
- **Go:** `oapi-codegen`
- **Java:** `OpenAPI Generator`

### Testing Tools
- **Postman:** Import OpenAPI spec
- **Insomnia:** Import for API testing
- **Swagger UI:** Alternative to Redoc
- **Dredd:** API contract testing

---

## Success Criteria

- [ ] OpenAPI spec validates without errors
- [ ] All endpoints documented with examples
- [ ] Error taxonomy complete and accurate
- [ ] Redoc site loads and renders correctly
- [ ] Rate limit headers documented
- [ ] Idempotency patterns explained
- [ ] SDK generation works (TypeScript)
- [ ] No breaking changes to existing API

---

## Next Steps After PR-C

1. Generate TypeScript SDK for client
2. Add spec to CI/CD pipeline (validate on PR)
3. Publish to API documentation portal
4. Create SDK packages (npm, PyPI)
5. Add request/response examples to tests
6. Implement API versioning strategy

---

## Appendix: Error Taxonomy Details

### Stable Error Codes

Each error code is guaranteed to be stable across API versions:

```typescript
// server/src/middleware/errors.ts
export const ErrorCodes = {
  VALIDATION_ERROR: 'validation_error',
  DISPOSABLE_EMAIL: 'disposable_email',
  SELF_REFERRAL: 'self_referral',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  DUPLICATE_REQUEST: 'duplicate_request',
  NOT_FOUND: 'not_found',
  INTERNAL_ERROR: 'internal_error',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden'
} as const;

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### Client-Side Handling

```typescript
try {
  await joinWaitlist({ name, email, ref });
} catch (error: any) {
  switch (error.response?.data?.error?.code) {
    case 'self_referral':
      alert('You cannot use your own referral code');
      break;
    case 'disposable_email':
      alert('Please use a real email address');
      break;
    case 'rate_limit_exceeded':
      const resetTime = error.response.headers['ratelimit-reset'];
      alert(`Too many requests. Try again at ${new Date(resetTime * 1000)}`);
      break;
    default:
      alert('An error occurred. Please try again.');
  }
}
```

---

## Migration Notes

### No Breaking Changes
✅ PR-C only adds documentation - no API changes required

### Optional Enhancements
After PR-C, consider:
- Adding request/response validation middleware using OpenAPI spec
- Generating mock servers from spec for testing
- Creating SDK packages for popular languages
- Setting up API versioning (v1, v2, etc.)