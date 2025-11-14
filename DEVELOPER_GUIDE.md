# Developer Onboarding Guide

Welcome to the GoAmpy development team! This guide will help you get up and running quickly.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Running the Application](#running-the-application)
4. [Development Workflow](#development-workflow)
5. [Code Structure](#code-structure)
6. [Common Tasks](#common-tasks)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ 
- npm 8+
- Git
- PostgreSQL database (we use Neon in production)
- Replit account (for deployment)

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd goampy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (or use Replit Secrets):

```bash
# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Supabase (For future auth features)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Session (Required)
SESSION_SECRET=your-32-character-secret-key-here

# Server Port (Optional, defaults to 5177)
BFF_PORT=5177

# CORS Origins (Production only)
APP_ORIGIN=https://yourdomain.com
```

### 4. Set Up Database

Run the database migrations:

```bash
# Push schema to database
npm --workspace server run db:push

# If you need to force push (be careful!)
npm --workspace server run db:push --force
```

## Running the Application

### Development Mode
Start both frontend and backend:
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5000
- Backend API: http://localhost:5177
- Health check: http://localhost:5177/api/health

### Production Build
```bash
# Build both frontend and backend
npm run build

# Start production server
npm run start
```

## Development Workflow

### Project Structure
```
goampy/
├── client/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── app/          # Application layer
│   │   ├── pages/        # Page components
│   │   ├── features/     # Feature modules
│   │   ├── entities/     # Business entities
│   │   ├── shared/       # Shared code
│   │   │   ├── ui/       # UI components (Atomic Design)
│   │   │   │   ├── atoms/
│   │   │   │   ├── molecules/
│   │   │   │   └── organisms/
│   │   │   └── lib/      # Utilities
│   │   └── components/   # shadcn/ui components
├── server/                # Backend (Express)
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── lib/          # Utilities
│   │   └── shared/       # Shared with frontend
│   │       └── schema.ts # Database schema
├── docs/                  # Documentation
└── scripts/              # Build & deployment scripts
```

### Git Workflow

1. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Test thoroughly
```bash
# Run tests (when available)
npm test

# Check for TypeScript errors
npm run type-check

# Lint code
npm run lint
```

4. Commit with descriptive messages
```bash
git add .
git commit -m "feat: add user verification flow"
```

5. Push and create PR
```bash
git push origin feature/your-feature-name
```

## Common Tasks

### Adding a New API Endpoint

1. Create route in `server/src/routes/`
```typescript
// server/src/routes/myroute.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

const RequestSchema = z.object({
  field: z.string()
});

router.post('/action', asyncHandler(async (req, res) => {
  const data = RequestSchema.parse(req.body);
  // Your logic here
  res.json({ success: true });
}));

export default router;
```

2. Register in `server/src/index.ts`
```typescript
import myRoute from './routes/myroute.js';
app.use('/api/myroute', myRoute);
```

### Adding a New UI Component

Following Atomic Design principles:

1. **Atom** (basic building block)
```typescript
// client/src/shared/ui/atoms/Badge.tsx
export function Badge({ children, variant = 'default' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
```

2. **Molecule** (combination of atoms)
```typescript
// client/src/shared/ui/molecules/UserCard.tsx
import { Badge } from '../atoms/Badge';

export function UserCard({ user }) {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <Badge variant="success">{user.points} pts</Badge>
    </div>
  );
}
```

3. **Organism** (complex UI sections)
```typescript
// client/src/shared/ui/organisms/Leaderboard.tsx
import { UserCard } from '../molecules/UserCard';

export function Leaderboard({ users }) {
  return (
    <div className="leaderboard">
      {users.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
}
```

### Working with the Database

1. **Define schema** in `server/src/shared/schema.ts`
```typescript
export const myTable = pgTable('my_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
```

2. **Push changes to database**
```bash
npm --workspace server run db:push
```

3. **Use in services**
```typescript
import { db } from '../lib/db';
import { myTable } from '../shared/schema';

// Insert
await db.insert(myTable).values({ name: 'Test' });

// Query
const results = await db.select().from(myTable);
```

### Managing Referral Codes

The referral system uses secure codes with the pattern `username-random6`:

```typescript
import { referralService } from '../services/referral';

// Generate code for a user
const code = await referralService.generateCode(tx, userId, email);

// Attribute a signup to referrer
await referralService.attributeSignup(tx, refCode, joinerId, joinerEmail);

// Log a click event
await referralService.logClick(code);
```

## Testing

### Manual Testing Checklist

1. **User Flow**
   - [ ] Can join waitlist
   - [ ] Receives referral code
   - [ ] Can copy/share referral link
   - [ ] Points update correctly

2. **Security**
   - [ ] Self-referral blocked
   - [ ] Disposable emails rejected
   - [ ] Rate limiting works

3. **UI/UX**
   - [ ] Responsive on mobile
   - [ ] Dark mode works
   - [ ] Copy feedback shows
   - [ ] Error messages clear

### API Testing with curl

```bash
# Health check
curl http://localhost:5177/api/health

# Join waitlist
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# Join with referral
curl -X POST http://localhost:5177/api/waitlist/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Friend","email":"friend@example.com","ref":"test-user-abc123"}'

# Get user summary
curl http://localhost:5177/api/me/summary?email=test@example.com
```

## Troubleshooting

### Common Issues

#### Black Screen / React Errors
- Check browser console for errors
- Verify React version compatibility
- Clear node_modules and reinstall

#### Database Connection Failed
- Check DATABASE_URL is correct
- Ensure SSL is enabled (`sslmode=require`)
- Verify database is accessible

#### Referral Code Not Working
- Codes are case-insensitive (stored lowercase)
- Check for self-referral attempt
- Verify code exists in database

#### Port Already in Use
```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9
lsof -ti:5177 | xargs kill -9
```

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm run dev
```

Check logs for request IDs to trace issues:
```
Look for: x-request-id: uuid-here
```

### Getting Help

1. Check existing documentation in `/docs`
2. Review CHANGELOG.md for recent changes
3. Look for similar issues in git history
4. Ask in team chat with:
   - Error message
   - Steps to reproduce
   - Request ID if applicable

## Best Practices

1. **Security First**
   - Never log sensitive data
   - Validate all inputs
   - Use parameterized queries

2. **Code Quality**
   - Write self-documenting code
   - Add TypeScript types
   - Handle errors gracefully

3. **Performance**
   - Use React Query for caching
   - Implement proper loading states
   - Optimize database queries

4. **User Experience**
   - Provide clear feedback
   - Handle edge cases
   - Test on mobile devices

## Deployment

### Deploying to Replit

1. Push code to repository
2. Import in Replit
3. Configure secrets
4. Run build command
5. Start application

### Production Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] CORS origins configured
- [ ] HTTPS enabled
- [ ] Rate limiting tested
- [ ] Error handling verified
- [ ] Monitoring configured

## Resources

- [API Documentation](./docs/API.md)
- [Security Policy](./SECURITY.md)
- [Architecture Overview](./docs/architecture/system.md)
- [React Docs](https://react.dev)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Tailwind CSS Docs](https://tailwindcss.com)

Welcome aboard! 🚀