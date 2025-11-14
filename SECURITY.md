# Security Policy

## Overview
GoAmpy implements enterprise-grade security measures to protect user data and prevent abuse of the referral system.

## Security Features

### 1. Referral Code Security
- **Strong Code Generation**: Uses cryptographically secure pattern `{username-slug}-{random6}`
- **Unambiguous Characters**: Only uses safe characters (3456789ABCDEFGHJKLMNPQRTUVWXY) to prevent confusion
- **Lowercase Storage**: All codes stored in lowercase for consistent lookups
- **Collision Prevention**: Retry mechanism with up to 5 attempts using different random suffixes

### 2. Anti-Abuse Measures

#### Self-Referral Prevention
- Users cannot use their own referral codes
- Returns `400` status with JSON error: `{"code": "self_referral", "error": "You cannot use your own referral code"}`
- Validated at database level by comparing user IDs

#### Disposable Email Blocking
- Blocks known disposable email providers (mailinator, 10minutemail, guerrillamail, tempmail)
- Returns `400` status with error code `disposable_email_not_allowed`

#### Duplicate Prevention
- Referral events are deduplicated to prevent multiple credits
- Each email can only be credited once per referral code

### 3. Rate Limiting
Implemented on critical endpoints to prevent abuse:

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/waitlist/join` | 60 | 15 min | Prevent spam registrations |
| `/api/auth/otp/send` | 5 | 15 min | Prevent OTP spam |
| `/api/auth/otp/verify` | 10 | 15 min | Prevent brute force |

### 4. Data Protection

#### Secrets Management
- All sensitive data stored in environment variables
- Never commit secrets to version control
- Use Replit Secrets for secure storage
- Service role keys never exposed to client

#### PII Redaction in Logs
The following data is automatically redacted from logs:
- Authorization headers
- Email addresses
- Passwords
- OTP tokens
- Response bodies

#### Request Tracking
- Every request gets a unique ID (UUID v4)
- IDs included in logs for debugging
- Helps trace issues without exposing sensitive data

### 5. Network Security

#### CORS Configuration
- **Development**: Permissive for local testing
- **Production**: Strict allowlist via `APP_ORIGIN` environment variable
- Prevents unauthorized cross-origin requests

#### Security Headers (via Helmet.js)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- CSP disabled in dev, should be configured for production

### 6. Database Security

#### SQL Injection Prevention
- All queries use parameterized statements via Drizzle ORM
- No raw SQL concatenation
- Input validation with Zod schemas

#### Connection Security
- SSL required for all database connections
- Connection pooling limited for serverless compatibility
- Credentials stored in `DATABASE_URL` environment variable

### 7. Error Handling
- Structured JSON error responses for API endpoints
- Never expose internal error details in production
- Stack traces only shown in development mode
- Proper HTTP status codes for different error types

## Environment Variables

Required secrets that must be configured:

```bash
# Database
DATABASE_URL=postgresql://...?sslmode=require

# Supabase (for future auth)
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-only!

# Session
SESSION_SECRET=random-32-char-string

# CORS (production only)
APP_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

## Security Best Practices for Developers

1. **Never log sensitive data** - Use the PII redaction system
2. **Validate all inputs** - Use Zod schemas for request validation
3. **Use parameterized queries** - Never concatenate SQL strings
4. **Keep dependencies updated** - Regular security audits with `npm audit`
5. **Test security features** - Verify rate limits and validation work
6. **Review PRs carefully** - Check for security implications
7. **Use HTTPS in production** - Never transmit sensitive data over HTTP
8. **Rotate secrets regularly** - Update API keys and session secrets
9. **Monitor for anomalies** - Watch for unusual referral patterns
10. **Document security changes** - Update this file when adding security features

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Contact the maintainers privately
3. Provide details about the vulnerability
4. Allow time for a fix before disclosure

## Security Checklist for Deployment

- [ ] All environment variables configured
- [ ] HTTPS enabled with valid certificate
- [ ] CORS origins properly configured
- [ ] Rate limiting tested and working
- [ ] Database using SSL connections
- [ ] Logs not exposing sensitive data
- [ ] Error messages not leaking internal details
- [ ] Security headers configured
- [ ] Dependencies up to date
- [ ] Secrets rotated from development values