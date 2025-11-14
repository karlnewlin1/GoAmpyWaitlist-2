# GoAmpy - AI-Powered Waitlist & Referral System

A production-ready waitlist application with gamified referral tracking, enterprise-grade security, and Progressive Web App support. Features conversational onboarding, cryptographically secure referral codes, anti-abuse measures, and real-time analytics.

## Tech Stack

- **Frontend**: React 18.3.1 (Vite) - FSD + Atomic Design architecture
- **Backend**: Express.js BFF on port 5177 with services layer
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Auth**: Supabase Auth with OTP verification (planned)
- **Deployment**: Replit-optimized PWA on port 5000

## Features

### Core Features
- 🎯 Conversational onboarding with AI assistant (Ampy)
- 🔗 Cryptographically secure referral codes (`username-random6` format)
- 📊 Points system (10 base + 20 verified + 10/referral)
- 🏆 Real-time leaderboard and mission progress tracking
- 📱 Progressive Web App with offline support

### Security & Anti-Abuse
- 🔐 Self-referral prevention with proper error handling
- 🛡️ Disposable email blocking
- 🔒 Rate limiting on critical endpoints
- 📝 Comprehensive request logging with PII redaction
- 🚫 Brute-force resistant referral codes

### User Experience
- 💬 Split-panel interface (Chat + Mission Control)
- 📲 Native share integration via Web Share API
- 📋 Clipboard fallback for desktop users
- ✅ Visual feedback for all user actions
- 🎨 Dark mode support with Tailwind CSS

## Documentation

Start at [docs/README.md](./docs/README.md)

Key flows:
- [Landing](./docs/product/flows/landing.md) — 3‑step chat; inline referral link
- [Tour](./docs/product/flows/tour.md) — button‑driven; chat disabled
- [Dashboard](./docs/product/flows/dashboard.md) — mission + referral tools

## Quick Start

1. **Set environment variables** in Replit Secrets:
   ```
   DATABASE_URL=your-supabase-pooler-url
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run database migrations**:
   ```bash
   npm --workspace server run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:5000
   - API Health: http://localhost:5177/api/health

## Architecture Overview

The application follows Feature-Sliced Design (FSD) on the frontend and a services layer pattern on the backend:

- **Frontend**: `/app` → `/pages` → `/features` → `/entities` → `/shared`
- **Backend**: Routes → Services → Database
- **UI Components**: Atoms → Molecules → Organisms

See [architecture documentation](./docs/architecture/) for detailed information.

## API Endpoints

- `POST /api/waitlist/join` - Join waitlist with referral attribution
- `GET /r/:code` - Referral redirect with click tracking
- `GET /api/me/summary` - User points and referrals
- `GET /api/leaderboard/top` - Top users with caching
- `POST /api/auth/otp/send` - Send verification code
- `POST /api/auth/otp/verify` - Verify email with OTP

See [API documentation](./docs/api/) for complete contract.

## Contributing

See [CONTRIBUTING.md](./docs/contributing/CONTRIBUTING.md) for development guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for security policies and best practices.

## License

Private and confidential - GoAmpy proprietary software.