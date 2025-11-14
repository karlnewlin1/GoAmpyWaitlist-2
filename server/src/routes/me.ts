import { Router } from 'express';
import { db } from '../lib/db.js';
import { users, referralCodes, referralEvents } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const r = Router();

// TEMP: identify by email until Supabase Auth is enabled
r.get('/summary', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'email required' });

  const [u] = await db.select().from(users).where(eq(users.emailCi, email));
  if (!u) return res.json({ points: 0, referrals: 0, rank: null });

  const [rc] = await db.select().from(referralCodes).where(eq(referralCodes.userId, u.id));
  const rows = rc ? await db.select().from(referralEvents).where(eq(referralEvents.referralCodeId, rc.id)) : [];
  const signups = rows.filter(r => r.type === 'signup').length;

  const base = 10;
  const verified = u.emailVerifiedAt ? 20 : 0;
  res.json({ 
    points: base + verified + signups * 10, 
    referrals: signups, 
    rank: null 
  });
});

export default r;