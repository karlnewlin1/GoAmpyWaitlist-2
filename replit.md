# GoAmpy Waitlist Application

## Overview

GoAmpy is a production-ready waitlist management application with a gamified referral system and enterprise-grade security features. The application features a split-panel landing page where users can interact with an AI chatbot (Ampy) while simultaneously viewing their mission progress and referral incentives. Users join the waitlist through a conversational onboarding flow and receive cryptographically secure referral codes to invite others.

The application is built as a modern SaaS platform with a public-facing waitlist system, robust anti-abuse measures, and an admin dashboard for managing entries and analytics. It includes PWA support for mobile installation, Web Share API integration, and sophisticated referral tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18.3.1 with TypeScript and Vite as the build tool.

**Routing**: React Router v7 for client-side navigation with dedicated routes:
- `/` - Landing page with split Chat/Console panels
- `/tour` - Product tour (shell)
- `/dashboard` - Admin panel for managing waitlist entries
- `/login` - Authentication page (Supabase OTP planned)

**UI Framework**: Tailwind CSS v4 with shadcn/ui component library using the "new-york" style preset. Components are built with Radix UI primitives for accessibility. The design system uses CSS variables for theming with a neutral base color and supports dark mode via class-based toggling.

**State Management**: TanStack Query (React Query v5) for server state management and API data fetching. Local component state managed with React hooks.

**Design Approach**: Hybrid strategy combining modern SaaS landing page aesthetics (inspired by Linear, Vercel, Stripe) for the public waitlist with a clean dashboard interface for admin functionality. Typography uses Inter font throughout with a well-defined hierarchy (text-6xl hero headlines down to text-sm captions). Spacing follows Tailwind's standard scale (4, 6, 8, 12, 16, 24, 32 units).

**Layout Pattern**: The landing page uses a split-panel grid layout (`grid lg:grid-cols-2`) with:
- Left panel: ChatPanel for conversational AI onboarding with Ampy
- Right panel: ConsolePanel displaying mission progress and referral incentives

### Backend Architecture

**Framework**: Express.js server running on port 5177 as a Backend-for-Frontend (BFF) pattern.

**API Structure**: RESTful endpoints prefixed with `/api`:
- `GET /api/health` - Health check endpoint
- `POST /api/waitlist/join` - Accepts name, email, and optional ref code; returns referral link
- `POST /api/events` - Generic event tracking endpoint
- `GET /r/:code` - Referral redirect that forwards to `/?ref=:code`

**Request Handling**: 
- CORS enabled for cross-origin requests
- Helmet.js for security headers (CSP disabled for development flexibility)
- JSON body parsing with raw body preservation for webhooks
- Request logging middleware that captures method, path, status, duration, and response JSON for API routes

**Validation**: Zod schema validation for request bodies (e.g., waitlist join endpoint requires name, email, and optional ref fields).

**Code Generation Logic**: Referral codes use a secure pattern: `{slugified-username}-{random6}` (e.g., `john-doe-x7q3vg`). The random suffix uses safe, unambiguous characters (3456789ABCDEFGHJKLMNPQRTUVWXY) to prevent confusion and brute force attacks. All codes are stored in lowercase for consistent lookups. Collision handling retries up to 5 times with different random suffixes.

### Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver (`@neondatabase/serverless`).

**ORM**: Drizzle ORM for type-safe database operations with schema defined in `server/src/shared/schema.ts`.

**Schema Design**:
- `users` table: id (UUID), email (unique), name, created_at
- `waitlist_entries` table: id, user_id (unique), source ('direct'|'referral'|'campaign'), referrer_user_id, created_at
- `referral_codes` table: id, user_id (unique), code (unique), created_at
- `referral_events` table: id, referral_code_id, type ('click'|'signup'), email, created_at
- `events` table: id, user_id, event_name, payload (JSONB), created_at for generic event tracking

**Migration Strategy**: Direct SQL execution via `postgres` client in `scripts/migrate.ts` due to DNS resolution issues with drizzle-kit. Schema includes unique indexes for email lookups and referral code uniqueness.

**Connection Configuration**: Uses `DATABASE_URL` environment variable with SSL required (`ssl: 'require'`) and connection pooling limited to 1 for serverless compatibility.

### Development Workflow

**Monorepo Structure**: npm workspaces with `client` and `server` subdirectories managed from root.

**Development Script**: Uses `concurrently` to run both client (Vite on 5176) and server (Express on 5177) simultaneously with a single `npm run dev` command.

**Proxy Configuration**: Vite dev server proxies `/api` and `/r` routes to the Express backend, enabling seamless full-stack development.

**Environment Variables**: Managed via Replit Secrets (injected into `process.env`) - no `.env` files needed. Required secrets include `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

**Build Process**: Client builds to `dist/public` directory; server compiles TypeScript to `dist` directory.

### Authentication & Authorization

**Planned Implementation**: Supabase authentication with OTP (One-Time Password) login flow. Shell route exists at `/login` but implementation is pending.

**Current State**: No authentication implemented; waitlist endpoints are publicly accessible.

## External Dependencies

### Third-Party Services

**Supabase**: Planned authentication provider using magic link/OTP flow. Environment variables configured but integration not yet implemented.

**Neon Database**: PostgreSQL hosting via serverless driver. Connection requires SSL and uses connection string from `DATABASE_URL` environment variable.

### Key NPM Packages

**UI & Styling**:
- `tailwindcss` v4 - Utility-first CSS framework
- `@radix-ui/*` - Accessible component primitives (20+ packages including dialog, dropdown, tooltip, etc.)
- `class-variance-authority` & `clsx` - Conditional className utilities
- `lucide-react` - Icon library (implied by shadcn/ui setup)

**Data Fetching & Validation**:
- `@tanstack/react-query` v5 - Server state management
- `zod` v4 - Runtime type validation
- `react-hook-form` & `@hookform/resolvers` - Form handling with Zod integration

**Database**:
- `drizzle-orm` - Type-safe ORM
- `drizzle-kit` - Schema migrations and codegen
- `postgres` - PostgreSQL client for Neon
- `@neondatabase/serverless` - Neon-specific driver

**Server Middleware**:
- `express` - HTTP server framework
- `cors` - CORS middleware
- `helmet` - Security headers
- `dotenv` - Environment variable loading (used in migration scripts)

**Development Tools**:
- `vite` v7 - Build tool and dev server
- `tsx` - TypeScript execution for development
- `concurrently` - Parallel script execution
- `@replit/vite-plugin-*` - Replit-specific development plugins (runtime error modal, cartographer, dev banner)

### Integration Points

**Database Connection**: Single connection string pattern with SSL enforcement for Neon PostgreSQL.

**API Proxy**: Client-to-server communication routed through Vite proxy in development; production builds serve static files from Express.

**Event Tracking**: Generic event system captures user interactions (e.g., `onboarding_completed`) with JSONB payload flexibility for future analytics integration.