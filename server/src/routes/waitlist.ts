import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { users, waitlistEntries, referralCodes, events, referralEvents } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const r = Router();
const Body = z.object({ name: z.string().min(2), email: z.string().email(), ref: z.string().optional().nullable() });
const baseCode = (s:string)=> (s.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,12) || 'user';

r.post('/join', async (req, res) => {
  const { name, email, ref } = Body.parse(req.body);

  // Upsert user by email (case-insensitive)
  const emailLower = email.trim().toLowerCase();
  let [u] = await db.select().from(users).where(eq(users.emailCi, emailLower));
  if (!u) {
    try { 
      [u] = await db.insert(users).values({ 
        email,  // display email
        emailCi: emailLower,  // lowercased for uniqueness
        name 
      }).returning(); 
    }
    catch { [u] = await db.select().from(users).where(eq(users.emailCi, emailLower)); }
  }

  // Handle referral attribution
  let referrerUserId = null;
  if (ref) {
    const [owner] = await db.select().from(referralCodes).where(eq(referralCodes.code, ref));
    if (owner) {
      referrerUserId = owner.userId;
      // Log signup event for the referrer
      await db.insert(referralEvents).values({
        referralCodeId: owner.id,
        type: 'signup',
        email
      });
    }
  }

  // Ensure waitlist entry with referrer attribution
  const [wl] = await db.select().from(waitlistEntries).where(eq(waitlistEntries.userId, u.id));
  if (!wl) { 
    try { 
      await db.insert(waitlistEntries).values({ 
        userId: u.id, 
        source: ref ? 'referral' : 'direct',
        referrerUserId 
      }); 
    } catch {} 
  }

  // Ensure referral code (handle collisions)
  const [rc0] = await db.select().from(referralCodes).where(eq(referralCodes.userId, u.id));
  let code = rc0?.code;
  if (!code) {
    let candidate = baseCode(email);
    for (let i = 0; i < 5; i++) {
      try { code = (await db.insert(referralCodes).values({ userId: u.id, code: candidate }).returning())[0].code; break; }
      catch { candidate = `${baseCode(email)}${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`; }
    }
    if (!code) code = (await db.insert(referralCodes).values({ userId: u.id, code: Math.random().toString(36).slice(2,8) }).returning())[0].code;
  }

  await db.insert(events).values({ userId: u.id, eventName: 'onboarding_completed', payload: { ref: ref ?? null } });
  res.json({ referralLink: `/r/${code}` });
});

export default r;