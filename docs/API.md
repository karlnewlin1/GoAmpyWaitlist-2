# GoAmpy API Documentation

## Base URL
- Development: `http://localhost:5177`
- Production: `https://your-domain.com`

## Authentication
Currently, the API is publicly accessible for waitlist operations. Authentication will be implemented for admin endpoints in future versions.

## Error Responses
All API endpoints return JSON error responses in the following format:

```json
{
  "error": "Human-readable error message",
  "code": "error_code_for_programmatic_handling"
}
```

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| `validation_error` | 400 | Request body validation failed |
| `self_referral` | 400 | User attempted to use their own referral code |
| `disposable_email_not_allowed` | 400 | Disposable email address detected |
| `internal_error` | 500 | Server error occurred |

## Endpoints

### Health Check
Check API server health and database connectivity.

**GET** `/api/health`

**Response** `200 OK`
```json
{
  "ok": true,
  "db": true,
  "svc": "goampy-bff",
  "version": "dev",
  "ts": "2024-11-14T10:00:00.000Z"
}
```

---

### Join Waitlist
Register a new user on the waitlist with optional referral code.

**POST** `/api/waitlist/join`

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "ref": "jane-doe-x7q3vg"  // Optional referral code
}
```

**Validation Rules**
- `name`: Required, minimum 2 characters
- `email`: Required, valid email format, no disposable addresses
- `ref`: Optional, must be a valid existing referral code

**Response** `200 OK`
```json
{
  "code": "john-doe-abc123",
  "referralLink": "/r/john-doe-abc123"
}
```

**Error Response** `400 Bad Request`
```json
{
  "error": "You cannot use your own referral code",
  "code": "self_referral"
}
```

**Referral Code Format**
- Pattern: `{slugified-username}-{random6}`
- Example: `john-doe-x7q3vg`
- Characters: Lowercase letters, numbers (3456789), and uppercase safe characters (ABCDEFGHJKLMNPQRTUVWXY)
- All codes are stored and compared in lowercase for consistency

---

### User Summary
Get user's points, referral count, and status.

**GET** `/api/me/summary?email={email}`

**Query Parameters**
- `email`: User's email address (URL encoded)

**Response** `200 OK`
```json
{
  "points": 20,
  "referrals": 1
}
```

**Points Calculation**
- Base points: 10 (for joining)
- Verified bonus: 20 (for email verification)
- Referral points: 10 per successful referral

**Response** `404 Not Found` (if user not found)
```json
{
  "points": 0,
  "referrals": 0
}
```

---

### Track Event
Log generic user events for analytics.

**POST** `/api/events`

**Request Body**
```json
{
  "userId": "uuid-here",
  "eventName": "onboarding_completed",
  "payload": {
    "step": "email_verified",
    "timestamp": "2024-11-14T10:00:00.000Z"
  }
}
```

**Response** `200 OK`
```json
{
  "success": true
}
```

---

### Referral Redirect
Handle referral link clicks and redirect to landing page.

**GET** `/r/:code`

**URL Parameters**
- `code`: Referral code (e.g., `john-doe-x7q3vg`)

**Behavior**
1. Logs a "click" event for analytics
2. Redirects to `/?ref={code}` 
3. Code is normalized (lowercased and trimmed) for lookup

**Response** `302 Found`
- Redirects to `/?ref={code}`

---

### Share Page (Server-Side Rendered)
Generate OG-tag optimized share page for referral links.

**GET** `/share/:code`

**URL Parameters**
- `code`: Referral code

**Response Headers**
```
Cache-Control: public, max-age=600
```

**Response** `200 OK`
Returns HTML page with:
- Dynamic OG tags with referrer's name
- Meta tags for social sharing
- `noindex` directive to prevent search engine indexing
- Auto-redirect to main app with referral code

---

## Rate Limiting

The following endpoints are rate-limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|---------|
| `/api/waitlist/join` | 60 requests | 15 minutes |
| `/api/auth/otp/send` | 5 requests | 15 minutes |
| `/api/auth/otp/verify` | 10 requests | 15 minutes |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## CORS Configuration

- Development: Allows all origins
- Production: Restricted to origins specified in `APP_ORIGIN` environment variable

## Request ID Tracking

All requests are assigned a unique ID for debugging:
- Header: `X-Request-ID`
- Format: UUID v4
- Included in error logs for correlation

## Security Considerations

1. **PII Redaction**: Emails and sensitive data are redacted from logs
2. **SQL Injection Prevention**: All queries use parameterized statements via Drizzle ORM
3. **XSS Protection**: Helmet.js middleware provides security headers
4. **HTTPS Only**: Production deployment must use HTTPS
5. **Secrets Management**: All secrets stored in environment variables, never in code

## Future Endpoints (Planned)

- `POST /api/auth/otp/send` - Send OTP verification code
- `POST /api/auth/otp/verify` - Verify OTP code
- `GET /api/admin/waitlist` - List all waitlist entries (requires auth)
- `GET /api/admin/analytics` - Get referral analytics (requires auth)
- `GET /api/leaderboard` - Get top referrers