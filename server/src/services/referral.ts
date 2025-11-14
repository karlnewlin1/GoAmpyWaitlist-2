import { db } from '../lib/db.js';
import { users, waitlistEntries, referralCodes, events, referralEvents } from '../shared/schema.js';
import { and, eq } from 'drizzle-orm';

// Canonicalize helpers
export const normCode = (s: string) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '').slice(0, 24);
export const base = (e: string) => (e.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'user';

export class ReferralService {
  /**
   * Generate a unique referral code for a user
   */
  async generateCode(tx: any, userId: string, email: string): Promise<string> {
    // Check if user already has a code
    const [existing] = await tx.select().from(referralCodes).where(eq(referralCodes.userId, userId));
    if (existing) return existing.code;

    // Generate new code with collision resistance
    let code: string | null = null;
    let candidate = base(email);
    
    for (let i = 0; i < 5 && !code; i++) {
      try {
        const [result] = await tx.insert(referralCodes).values({ 
          userId, 
          code: candidate 
        }).returning();
        code = result.code;
      } catch {
        candidate = `${base(email)}${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 12);
      }
    }
    
    // Fallback to random code
    if (!code) {
      const [result] = await tx.insert(referralCodes).values({
        userId,
        code: Math.random().toString(36).slice(2, 8)
      }).returning();
      code = result.code;
    }
    
    return code;
  }

  /**
   * Attribute a signup to a referrer (with deduplication)
   */
  async attributeSignup(tx: any, refCode: string, joinerId: string, joinerEmail: string): Promise<void> {
    if (!refCode) return;
    
    const normalizedCode = normCode(refCode);
    const [owner] = await tx.select().from(referralCodes).where(eq(referralCodes.code, normalizedCode));
    
    if (!owner) return;

    // Self-referral guard: prevent users from referring themselves
    const [joinerUser] = await tx.select().from(users).where(eq(users.id, joinerId));
    if (joinerUser && owner.userId === joinerId) {
      console.log(`Self-referral blocked: ${joinerEmail} tried to use their own code`);
      return;
    }

    // Update waitlist entry with referrer
    await tx
      .update(waitlistEntries)
      .set({ 
        referrerUserId: owner.userId, 
        source: 'referral' 
      })
      .where(eq(waitlistEntries.userId, joinerId));

    // Prevent duplicate signup credits
    const [existingSignup] = await tx.select().from(referralEvents)
      .where(and(
        eq(referralEvents.referralCodeId, owner.id),
        eq(referralEvents.type, 'signup'),
        eq(referralEvents.email, joinerEmail)
      ));

    if (!existingSignup) {
      await tx.insert(referralEvents).values({
        referralCodeId: owner.id,
        type: 'signup',
        email: joinerEmail
      });
    }
  }

  /**
   * Log a referral click event
   */
  async logClick(code: string): Promise<void> {
    const normalizedCode = normCode(code);
    
    try {
      const [rc] = await db.select().from(referralCodes).where(eq(referralCodes.code, normalizedCode));
      if (rc) {
        await db.insert(referralEvents).values({
          referralCodeId: rc.id,
          type: 'click',
          email: null
        });
      }
    } catch (error) {
      console.error('Error logging referral click:', error);
    }
  }
}

export const referralService = new ReferralService();