# Testing Guide

This document outlines testing procedures for the GoAmpy application.

## Testing Strategy

### Test Pyramid
1. **Unit Tests** (Base) - Test individual functions and components
2. **Integration Tests** (Middle) - Test API endpoints and database operations  
3. **E2E Tests** (Top) - Test complete user workflows

## Manual Testing Procedures

### 1. User Onboarding Flow

**Test Scenario**: New user joins waitlist

**Steps**:
1. Navigate to landing page (`/`)
2. Enter name in chat panel (min 2 characters)
3. Submit and verify email prompt appears
4. Enter valid email address
5. Submit and verify:
   - Referral link generated
   - Points show as 10
   - Mission progress displays
   - Share button is functional

**Expected Results**:
- Referral code format: `username-random6` (all lowercase)
- User can copy/share referral link
- Console panel updates with mission status

### 2. Referral System

**Test Scenario**: User refers a friend

**Setup**:
1. Create User A and get referral code
2. Open incognito/private browser

**Steps**:
1. Navigate to `/r/{codeFromUserA}`
2. Verify redirect to `/?ref={code}`
3. Complete signup as User B
4. Check User A's summary

**Expected Results**:
- User B signup successful
- User A gains 10 referral points
- User A's referral count increases by 1

### 3. Security Features

#### Self-Referral Prevention

**Test via API**:
```bash
# 1. Join waitlist
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# Note the returned code, e.g., "test-user-abc123"

# 2. Try self-referral (should fail)
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","ref":"test-user-abc123"}'
```

**Expected**: 400 error with `{"code": "self_referral", "error": "You cannot use your own referral code"}`

#### Disposable Email Blocking

**Test**:
```bash
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@mailinator.com"}'
```

**Expected**: 400 error with code `disposable_email_not_allowed`

### 4. Share Functionality

**Desktop Testing**:
1. Click share button
2. Verify "Copy" text appears
3. Click and verify "✓ Copied!" feedback
4. Paste elsewhere to confirm clipboard

**Mobile Testing**:
1. Click share button
2. Verify native share sheet appears
3. Select sharing method
4. Confirm link shared correctly

### 5. Progressive Web App

**Installation Test**:
1. Open site on mobile Chrome/Safari
2. Look for "Install App" prompt
3. Install and verify:
   - App icon on home screen
   - Opens in standalone mode
   - Works offline (cached assets)

### 6. Performance Testing

**Page Load**:
- Target: < 3 seconds on 3G
- Measure with Chrome DevTools Network throttling

**API Response Times**:
- `/api/waitlist/join`: < 500ms
- `/api/me/summary`: < 200ms
- `/api/health`: < 100ms

## Automated Testing (Future)

### Unit Tests (Planned)

```typescript
// Example: Referral code generation
describe('makeReferralCode', () => {
  it('should generate code with correct format', () => {
    const code = makeReferralCode('john.doe@example.com');
    expect(code).toMatch(/^[a-z]+-[3-9a-z]{6}$/);
  });
  
  it('should always return lowercase', () => {
    const code = makeReferralCode('John.Doe@Example.com');
    expect(code).toBe(code.toLowerCase());
  });
});
```

### Integration Tests (Planned)

```typescript
// Example: API endpoint test
describe('POST /api/waitlist/join', () => {
  it('should create user and return referral code', async () => {
    const res = await request(app)
      .post('/api/waitlist/join')
      .send({
        name: 'Test User',
        email: 'test@example.com'
      });
      
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('referralLink');
  });
});
```

### E2E Tests with Playwright (Planned)

```typescript
test('complete onboarding flow', async ({ page }) => {
  await page.goto('/');
  
  // Enter name
  await page.fill('[data-testid="input-name"]', 'Test User');
  await page.click('[data-testid="button-submit-name"]');
  
  // Enter email
  await page.fill('[data-testid="input-email"]', 'test@example.com');
  await page.click('[data-testid="button-submit-email"]');
  
  // Verify referral link
  const referralLink = await page.textContent('[data-testid="text-referral-link"]');
  expect(referralLink).toContain('/r/test-user-');
  
  // Verify points
  const points = await page.textContent('[data-testid="text-total-points"]');
  expect(points).toBe('10');
});
```

## Test Data

### Valid Test Cases
- Names: "John Doe", "María García", "李明"
- Emails: "test@example.com", "user+tag@domain.co.uk"

### Invalid Test Cases
- Names: "A" (too short), "" (empty)
- Emails: "notanemail", "@example.com", "test@"
- Disposable: "test@mailinator.com", "user@10minutemail.com"

## Browser Testing Matrix

| Browser | Version | Desktop | Mobile |
|---------|---------|---------|--------|
| Chrome | Latest | ✅ | ✅ |
| Firefox | Latest | ✅ | ✅ |
| Safari | 16+ | ✅ | ✅ |
| Edge | Latest | ✅ | ✅ |

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Error messages announced
- [ ] Form labels associated

## Performance Benchmarks

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Bundle Size | < 200KB | Webpack Analyzer |

## Bug Reporting Template

```markdown
**Environment:**
- Browser/Version:
- Device:
- User Email (if applicable):

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshots/Logs:**

**Request ID (if API error):**
```

## Regression Testing Checklist

Before each release, verify:

- [ ] User can join waitlist
- [ ] Referral codes generated correctly
- [ ] Self-referral prevention works
- [ ] Share functionality operational
- [ ] Points calculation accurate
- [ ] Mobile responsive
- [ ] Dark mode displays correctly
- [ ] Error messages show properly
- [ ] Rate limiting enforced
- [ ] Database queries optimized

## Load Testing

### Using Apache Bench (ab)

```bash
# Test join endpoint
ab -n 1000 -c 10 -T application/json -p test_data.json \
   http://localhost:5177/api/waitlist/join

# test_data.json
{"name":"Load Test","email":"loadtest@example.com"}
```

### Expected Performance
- Support 100 concurrent users
- Handle 1000 requests/minute
- Response time < 500ms at P95

## Security Testing

### OWASP Top 10 Checklist
- [ ] SQL Injection - Prevented by Drizzle ORM
- [ ] XSS - React escapes by default
- [ ] CSRF - Session validation required
- [ ] Broken Auth - Rate limiting implemented
- [ ] Sensitive Data - PII redacted from logs
- [ ] XXE - JSON only, no XML
- [ ] Access Control - Verification required
- [ ] Security Misconfiguration - Helmet.js configured
- [ ] Vulnerable Components - Regular npm audit
- [ ] Insufficient Logging - Request IDs tracked

## Monitoring & Debugging

### Key Metrics to Track
- API response times
- Error rates by endpoint
- Referral conversion rates
- Database query performance
- User drop-off points

### Debug Commands

```bash
# View server logs
npm run dev 2>&1 | grep -E "error|warn"

# Database queries
DEBUG=drizzle:* npm run dev

# Network requests
chrome://net-export/ (in Chrome)

# React performance
React DevTools Profiler
```

## Continuous Improvement

After each testing cycle:
1. Document new test cases discovered
2. Update regression checklist
3. Add to automated test suite
4. Share findings with team
5. Update this guide

Remember: Good testing is not about finding bugs, it's about building confidence in the system! 🎯