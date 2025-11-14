import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { users, waitlistEntries, events } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { referralService, normCode } from '../services/referral.js';
import { AppError, asyncHandler } from '../middleware/errors.js';

const r = Router();
const Body = z.object({ 
  name: z.string().min(2), 
  email: z.string().email(), 
  ref: z.string().optional().nullable() 
});

// Disposable email domains to block
const DISPOSABLE = /(^|\.)((mailinator|10minutemail|guerrillamail|tempmail)\.com)$/i;

r.post('/join', asyncHandler(async (req, res) => {
  const { name, email, ref } = Body.parse(req.body);
  
  // Block disposable emails
  if (DISPOSABLE.test(email.split('@')[1] || '')) {
    throw new AppError(
      'Disposable email addresses are not allowed',
      'disposable_email_not_allowed',
      400
    );
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

    // 3) Generate referral code using service
    const code = await referralService.generateCode(tx, u.id, email);

    // 4) Attribute referral (with self-referral guard and deduplication)
    try {
      await referralService.attributeSignup(tx, refCode, u.id, email);
    } catch (error: any) {
      if (error.message === 'SELF_REFERRAL') {
        throw new AppError(
          'You cannot use your own referral code',
          'self_referral',
          400
        );
      }
      throw error;
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
}));

export default r;