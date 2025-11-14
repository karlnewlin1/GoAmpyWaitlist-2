# GoAmpy Documentation Hub

Welcome to the GoAmpy documentation! This is your starting point for understanding and contributing to the project.

## 🚀 Quick Start for New Developers

1. **[Developer Guide](../DEVELOPER_GUIDE.md)** - Complete onboarding guide with setup instructions
2. **[API Documentation](./API.md)** - All endpoints with request/response examples
3. **[Testing Guide](./TESTING.md)** - How to test your changes
4. **[Security Policy](../SECURITY.md)** - Security requirements and best practices

## 📁 Documentation Map

### Core Documentation
- **[Project README](../README.md)** - Overview and quick start
- **[Changelog](../CHANGELOG.md)** - Version history and recent changes (v1.1.0)
- **[Developer Guide](../DEVELOPER_GUIDE.md)** - Comprehensive onboarding
- **[Security Policy](../SECURITY.md)** - Security features and guidelines

### Architecture & Technical
- **[System Architecture](./architecture/system.md)** - Complete system design
- **[Backend BFF](./architecture/backend-bff.md)** - Express.js backend patterns
- **[Frontend FSD+Atomic](./architecture/frontend-fsd-atomic.md)** - React architecture
- **[Data Model](./architecture/data-model.md)** - Database schema design
- **[API Reference](./API.md)** - Complete API documentation

### Product & Features
- **[Mission & Scope](./overview/mission-and-scope.md)** - Product vision
- **[Landing Flow](./product/flows/landing.md)** - User onboarding journey
- **[Dashboard Flow](./product/flows/dashboard.md)** - Admin features
- **[Tour Flow](./product/flows/tour.md)** - Product tour
- **[Incentives System](./product/incentives-and-points.md)** - Points & gamification

### Development Playbooks
- **[Replit Setup](./playbooks/dev-setup-replit.md)** - Platform-specific setup
- **[Migrations](./playbooks/migrations-and-seeding.md)** - Database operations
- **[Observability](./playbooks/observability.md)** - Monitoring & debugging
- **[Testing Guide](./TESTING.md)** - Testing procedures

### Project Decisions
- **[ADR-0001](./decisions/adr-0001-fsd-atomic.md)** - Frontend architecture choice
- **[ADR-0002](./decisions/adr-0002-supabase-auth.md)** - Authentication strategy

### Contributing
- **[Contributing Guide](./contributing/CONTRIBUTING.md)** - How to contribute

## 🏗️ Current Implementation Status

### ✅ Completed (v1.1.0)
- Secure referral system with `username-random6` codes
- Self-referral prevention with JSON error responses
- Progressive Web App with service worker
- Web Share API integration
- Anti-abuse measures (disposable email blocking)
- Rate limiting on critical endpoints
- Comprehensive logging with PII redaction

### ⏳ In Progress
- Email OTP verification (Supabase Auth)
- Admin dashboard
- Leaderboard with real-time updates

### 📋 Planned
- WebSocket real-time updates
- Advanced analytics
- A/B testing framework
- Webhook integrations

## 💡 Key Technical Highlights

**Security Features:**
- Cryptographically secure referral codes
- SQL injection prevention via Drizzle ORM
- XSS protection through React
- Rate limiting (60 req/15min on join)

**Performance:**
- PWA with offline support
- 10-minute cache on share pages
- TanStack Query caching
- Optimized database queries

**Developer Experience:**
- TypeScript throughout
- Zod validation
- Hot module replacement
- Comprehensive error handling

## 📊 Documentation Coverage Status

| Area | Coverage | Status |
|------|----------|--------|
| API Endpoints | 100% | ✅ Complete |
| Security | 100% | ✅ Complete |
| Architecture | 100% | ✅ Complete |
| Testing | 90% | ✅ Manual tests documented |
| Deployment | 85% | ✅ Replit-specific |
| Contributing | 80% | ✅ Basic guidelines |

## 🔄 Keeping Documentation Updated

When making changes:
1. Update relevant technical docs
2. Add entry to CHANGELOG.md
3. Update API.md for endpoint changes
4. Review SECURITY.md for security implications
5. Update test cases in TESTING.md

---

*Last Updated: November 14, 2024*  
*Current Version: 1.1.0*  
*Documentation Complete: All critical areas covered*