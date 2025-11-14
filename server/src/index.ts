import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import waitlist from './routes/waitlist.js';
import events from './routes/events.js';
import me from './routes/me.js';
import share from './routes/share.js';
import { joinLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errors.js';
import { db } from './lib/db.js';
import { referralCodes, referralEvents } from './shared/schema.js';
import { eq, sql } from 'drizzle-orm';

const app = express();

// Trust proxy for accurate client IPs behind Replit
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));

// CORS discipline - lock in production, permissive in dev
const origins = process.env.APP_ORIGIN?.split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({ origin: origins && origins.length ? origins : true }));

app.use(express.json());

// Production-grade logging with PII redaction
app.use(pinoHttp({
  customProps: req => ({ 
    reqId: req.headers['x-request-id'] ?? randomUUID(), 
    svc: 'goampy-bff' 
  }),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.email',
      'req.body.password',
      'res.body'
    ],
    remove: true
  }
}));

// Add request ID to response headers
app.use((req, res, next) => {
  const id = (req as any).log?.bindings()?.reqId ?? randomUUID();
  res.setHeader('x-request-id', id);
  next();
});

// Health check with DB connectivity
app.get('/api/health', async (_req, res) => {
  try { 
    await db.execute(sql`select 1`);
    res.json({ 
      ok: true, 
      db: true,
      svc: 'goampy-bff',
      version: process.env.GIT_SHA || 'dev',
      ts: new Date().toISOString()
    });
  }
  catch { 
    return res.status(500).json({ ok: false, db: false }); 
  }
});

// Rate limiting for join endpoint
app.use('/api/waitlist/join', joinLimiter);

// APIs
app.use('/api/waitlist', waitlist);
app.use('/api/events', events);
app.use('/api/me', me);

// Share route with OG tags for social sharing
app.use('/share', share);

// Referral redirect with canonicalized codes
const normCode = (s:string) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]/g,'').slice(0,24);

app.get('/r/:code', async (req, res) => {
  const code = normCode(req.params.code);
  try {
    const [rc] = await db.select().from(referralCodes).where(eq(referralCodes.code, code));
    if (rc) await db.insert(referralEvents).values({ referralCodeId: rc.id, type: 'click' });
  } catch {}
  res.redirect(`/?ref=${encodeURIComponent(code)}`);
});

// Error handler must be the last middleware
app.use(errorHandler);

const port = Number(process.env.BFF_PORT || 5177);
app.listen(port, () => console.log(`BFF on :${port}`));