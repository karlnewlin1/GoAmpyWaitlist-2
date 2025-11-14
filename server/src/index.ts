import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import waitlist from './routes/waitlist.js';
import events from './routes/events.js';
import { db } from './lib/db.js';
import { referralCodes, referralEvents } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// APIs
app.use('/api/waitlist', waitlist);
app.use('/api/events', events);

// Referral redirect with click tracking
app.get('/r/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const [rc] = await db.select().from(referralCodes).where(eq(referralCodes.code, code));
    if (rc) await db.insert(referralEvents).values({ referralCodeId: rc.id, type: 'click' });
  } catch {}
  res.redirect(`/?ref=${encodeURIComponent(code)}`);
});

const port = Number(process.env.BFF_PORT || 5177);
app.listen(port, () => console.log(`BFF on :${port}`));