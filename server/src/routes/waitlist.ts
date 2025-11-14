import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { users, waitlistEntries, referralCodes, events, referralEvents } from '../shared/schema.js';
import { and, eq } from 'drizzle-orm';

const r = Router();
const Body = z.object({ name: z.string().min(2), email: z.string().email(), ref: z.string().optional().nullable() });

// Disposable email domains to block
const DISPOSABLE = /(^|\.)((mailinator|10minutemail|guerrillamail|tempmail)\.com)$/i;

// Canonicalize helpers
const normCode = (s:string) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]/g,'').slice(0,24);
const base = (e:string)=> (e.split('@')[0]||'user').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,8) || 'user';

r.post('/join', async (req, res) => {
  const { name, email, ref } = Body.parse(req.body);
  
  // Block disposable emails
  if (DISPOSABLE.test(email.split('@')[1] || '')) {
    return res.status(400).json({ error: 'Disposable email addresses are not allowed', code: 'disposable_email_not_allowed' });
  }
  
  const eci = email.trim().toLowerCase();
  const refCode = ref ? normCode(ref) : null;

  const result = await db.transaction(async (tx) => {
    // 1) upsert user by emailCi
    let [u] = await tx.select().from(users).where(eq(users.emailCi, eci));
    if (!u) {
      try { 
        [u] = await tx.insert(users).values({ 
          email,
          emailCi: eci,
          name 
        }).returning(); 
      }
      catch { 
        [u] = await tx.select().from(users).where(eq(users.emailCi, eci)); 
      }
    }

    // 2) waitlist row (idempotent)
    const [wl] = await tx.select().from(waitlistEntries).where(eq(waitlistEntries.userId, u.id));
    if (!wl) {
      await tx.insert(waitlistEntries).values({ 
        userId: u.id, 
        source: ref ? 'referral' : 'direct' 
      });
    }

    // 3) referral code (collision-resistant, canonicalized)
    const [rc0] = await tx.select().from(referralCodes).where(eq(referralCodes.userId, u.id));
    let code = rc0?.code;
    if (!code) {
      let candidate = base(email);
      for (let i=0; i<5 && !code; i++) {
        try { 
          code = (await tx.insert(referralCodes).values({ userId: u.id, code: candidate }).returning())[0].code; 
        }
        catch { 
          candidate = `${base(email)}${Math.floor(1000+Math.random()*9000)}`.slice(0,12); 
        }
      }
      if (!code) {
        code = (await tx.insert(referralCodes).values({ 
          userId: u.id, 
          code: Math.random().toString(36).slice(2,8) 
        }).returning())[0].code;
      }
    }

    // 4) attribute referral signup if ref present (with deduplication)
    if (refCode) {
      const [owner] = await tx.select().from(referralCodes).where(eq(referralCodes.code, refCode));
      if (owner) {
        // Update waitlist entry with referrer
        await tx
          .update(waitlistEntries)
          .set({ referrerUserId: owner.userId, source: 'referral' })
          .where(eq(waitlistEntries.userId, u.id));
        
        // Prevent duplicate signup credits for same code/email
        const [exists] = await tx.select().from(referralEvents)
          .where(and(
            eq(referralEvents.referralCodeId, owner.id),
            eq(referralEvents.type, 'signup'),
            eq(referralEvents.email, email)
          ));
        
        if (!exists) {
          await tx.insert(referralEvents).values({ 
            referralCodeId: owner.id, 
            type: 'signup', 
            email 
          });
        }
      }
    }

    // 5) lifecycle event
    await tx.insert(events).values({ 
      userId: u.id, 
      eventName: 'onboarding_completed', 
      payload: { ref: refCode ?? null } 
    });

    return { code, userId: u.id };
  });

  res.json({ code: result.code, referralLink: `/r/${result.code}` });
});

export default r;