# System Architecture Overview

## High-Level Architecture

GoAmpy is a modern web application built with a clear separation of concerns between the presentation, business logic, and data layers.

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React 18.3.1 + Vite)             │
│                      Port 5000                          │
│          PWA with Service Worker & Web Share API        │
├─────────────────────────────────────────────────────────┤
│               Backend (Express.js BFF)                  │
│                      Port 5177                          │
│            Services + Middleware + Rate Limiting        │
├─────────────────────────────────────────────────────────┤
│                 PostgreSQL (Neon)                       │
│            Drizzle ORM + Serverless Driver             │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: TanStack Query v5 for server state
- **Architecture**: Feature-Sliced Design (FSD) + Atomic Design
- **PWA**: Service worker for offline support and installability

### Backend
- **Runtime**: Node.js with Express.js
- **Pattern**: Backend-for-Frontend (BFF)
- **Validation**: Zod for runtime type checking
- **Security**: Helmet.js, CORS, rate limiting
- **Logging**: Pino with PII redaction
- **Error Handling**: Structured JSON responses

### Database
- **Provider**: Neon (serverless PostgreSQL)
- **ORM**: Drizzle ORM for type-safe queries
- **Connection**: SSL required, pooling limited for serverless
- **Migrations**: Direct SQL via postgres client

## Core Components

### 1. User Interface Layer

**Split-Panel Design**:
- **ChatPanel**: Conversational onboarding with AI assistant (Ampy)
- **ConsolePanel**: Mission control showing progress and referrals

**Component Architecture** (Atomic Design):
```
atoms/        → Basic UI elements (buttons, inputs)
molecules/    → Composite components (cards, forms)
organisms/    → Complex sections (panels, navigation)
```

### 2. API Layer

**RESTful Endpoints**:
```
POST /api/waitlist/join    → Join waitlist with referral
GET  /api/me/summary       → Get user points and stats
POST /api/events           → Track user events
GET  /r/:code             → Referral redirect handler
GET  /share/:code         → OG-optimized share page
```

**Middleware Stack**:
1. Helmet (security headers)
2. CORS (origin validation)
3. Body parsing (JSON)
4. Request logging (Pino)
5. Rate limiting (critical endpoints)
6. Error handling (JSON responses)

### 3. Business Logic Layer

**Services**:
- **ReferralService**: Code generation, attribution, tracking
- **UserService**: User management and points calculation
- **EventService**: Analytics and event tracking

**Security Features**:
- Cryptographically secure referral codes
- Self-referral prevention
- Disposable email blocking
- Request ID tracking

### 4. Data Layer

**Schema Design**:
```sql
users                 → User profiles
waitlist_entries      → Waitlist registrations
referral_codes        → Unique referral codes
referral_events       → Click and signup tracking
events               → Generic event logging
```

**Data Flow**:
1. User joins via ChatPanel
2. Backend creates user + waitlist entry + referral code (transaction)
3. Referral link shared (`/r/code`)
4. Click tracked as referral_event
5. New user redirected to `/?ref=code`
6. Signup attributed to referrer
7. Points calculated and displayed

## Security Architecture

### Authentication & Authorization
- Session-based auth (planned)
- Supabase OTP verification (planned)
- httpOnly cookies for sessions

### Data Protection
- All database queries parameterized (SQL injection prevention)
- PII redacted from logs
- Secrets in environment variables
- SSL required for database connections

### Anti-Abuse Measures
```
Rate Limiting:
├── /api/waitlist/join    → 60 req/15min
├── /api/auth/otp/send    → 5 req/15min
└── /api/auth/otp/verify  → 10 req/15min

Validation:
├── Self-referral check   → Compare user IDs
├── Disposable emails     → Regex blocklist
└── Duplicate prevention  → Unique constraints
```

### Referral Code Security
```
Pattern: {username-slug}-{random6}
Example: john-doe-x7q3vg

Features:
- Unambiguous characters (3456789ABCDEFGHJKLMNPQRTUVWXY)
- Case-insensitive (stored lowercase)
- Collision retry mechanism
- Brute-force resistant
```

## Deployment Architecture

### Development
```
npm run dev → Concurrently runs:
├── Client (Vite)   → localhost:5000
└── Server (tsx)    → localhost:5177
```

### Production (Replit)
```
Build Process:
├── Client build    → dist/public
├── Server compile  → dist/
└── Service worker  → PWA manifest

Runtime:
├── Express serves  → Static files + API
├── Neon provides   → Serverless PostgreSQL
└── Replit handles  → SSL, domains, secrets
```

### Environment Configuration
```
Required:
├── DATABASE_URL           → PostgreSQL connection
├── SESSION_SECRET         → Session encryption
└── BFF_PORT              → Server port (default: 5177)

Optional:
├── SUPABASE_URL          → Auth provider
├── SUPABASE_ANON_KEY    → Public key
├── SUPABASE_SERVICE_ROLE → Server-only key
└── APP_ORIGIN           → CORS allowlist
```

## Performance Optimizations

### Frontend
- Code splitting with React.lazy
- TanStack Query caching
- Service worker caching
- Optimistic UI updates
- Web Share API for native sharing

### Backend
- Connection pooling
- Query optimization
- Response caching (10min for share pages)
- Gzip compression
- Request ID tracking for debugging

### Database
- Indexed columns for lookups
- Unique constraints for deduplication
- Transaction batching
- Prepared statements

## Monitoring & Observability

### Logging Strategy
```
Request Logging:
├── Method, path, status
├── Response time
├── Request ID (UUID)
└── PII redaction

Error Logging:
├── Stack traces (dev only)
├── Error codes
├── Request context
└── User impact
```

### Health Checks
```
GET /api/health → Returns:
{
  "ok": true,
  "db": true,
  "svc": "goampy-bff",
  "version": "1.1.0",
  "ts": "2024-11-14T10:00:00Z"
}
```

## Scalability Considerations

### Current Limitations
- Single database connection (serverless constraint)
- In-memory rate limiting (single instance)
- No caching layer (Redis planned)

### Growth Path
1. Add Redis for distributed caching
2. Implement database read replicas
3. Add CDN for static assets
4. Implement queue for async processing
5. Add monitoring (Datadog/Sentry)

## Development Workflow

### Code Organization
```
/client/src/
├── app/           → Application setup
├── pages/         → Route components
├── features/      → Feature modules
├── entities/      → Business entities
├── shared/        → Shared code
│   ├── ui/       → UI components
│   └── lib/      → Utilities
└── components/    → shadcn/ui

/server/src/
├── routes/        → API endpoints
├── services/      → Business logic
├── middleware/    → Express middleware
├── lib/          → Utilities
└── shared/       → Shared with frontend
    └── schema.ts → Database schema
```

### Testing Strategy
- Unit tests for services (planned)
- Integration tests for APIs (planned)
- E2E tests with Playwright (planned)
- Manual testing checklist maintained

## Future Enhancements

### Phase 1 (Current)
- ✅ Secure referral system
- ✅ PWA support
- ✅ Anti-abuse measures
- ⏳ Email verification
- ⏳ Admin dashboard

### Phase 2 (Planned)
- [ ] Supabase authentication
- [ ] Real-time updates (WebSockets)
- [ ] Advanced analytics
- [ ] A/B testing framework
- [ ] Email notifications

### Phase 3 (Future)
- [ ] Multi-tenant support
- [ ] API rate limiting by tier
- [ ] Webhook integrations
- [ ] Export functionality
- [ ] Advanced gamification