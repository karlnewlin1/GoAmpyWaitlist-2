import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { users, waitlistEntries, referralCodes, events } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const r = Router();
const Body = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  ref: z.string().optional().nullable()
});
const codeFrom = (s: string) =>
  (s.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,12) || 'user';

r.post('/join', async (req, res) => {
  const { name, email, ref } = Body.parse(req.body);

  const [u0] = await db.select().from(users).where(eq(users.email, email));
  const u = u0 ?? (await db.insert(users).values({ email, name }).returning())[0];

  const [wl] = await db.select().from(waitlistEntries).where(eq(waitlistEntries.userId, u.id));
  if (!wl) await db.insert(waitlistEntries).values({ userId: u.id, source: ref ? 'referral' : 'direct' });

  const [rc0] = await db.select().from(referralCodes).where(eq(referralCodes.userId, u.id));
  const code = rc0?.code ?? (await db.insert(referralCodes).values({ userId: u.id, code: codeFrom(email) }).returning())[0].code;

  await db.insert(events).values({ userId: u.id, eventName: 'onboarding_completed', payload: { ref: ref ?? null } });
  res.json({ referralLink: `/r/${code}` });
});

export default r;