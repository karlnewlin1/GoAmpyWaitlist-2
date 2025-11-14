import { db } from '../lib/db.js';
import { users, waitlistEntries, referralCodes, events, referralEvents } from '../shared/schema.js';
import { and, eq } from 'drizzle-orm';
import slugify from 'slugify';
import { customAlphabet } from 'nanoid/non-secure';

// Create nanoid generator with unambiguous characters
const nanoid = customAlphabet('3456789ABCDEFGHJKLMNPQRTUVWXY', 6);

// Canonicalize helpers for lookups (backward compatibility)
export const normCode = (s: string) => (s || '').toLowerCase().trim();

/**
 * Generate a strong referral code using slugified username + random suffix
 * Example: "john-doe-x7q3vg" (always lowercase for consistent lookups)
 */
export function makeReferralCode(email: string): string {
  const username = email.split('@')[0] || 'user';
  const slug = slugify(username, { lower: true, strict: true }).slice(0, 20);
  const suffix = nanoid().toLowerCase();
  return `${slug}-${suffix}`;
}

export class ReferralService {
  /**
   * Generate a unique referral code for a user
   */
  async generateCode(tx: any, userId: string, email: string): Promise<string> {
    // Check if user already has a code
    const [existing] = await tx.select().from(referralCodes).where(eq(referralCodes.userId, userId));
    if (existing) return existing.code;

    // Generate new code with stronger pattern
    let code: string | null = null;
    
    // Try up to 5 times with different random suffixes
    for (let i = 0; i < 5 && !code; i++) {
      const candidate = makeReferralCode(email);
      try {
        const [result] = await tx.insert(referralCodes).values({ 
          userId, 
          code: candidate 
        }).returning();
        code = result.code;
      } catch {
        // Collision detected, will retry with new random suffix
      }
    }
    
    // Extremely unlikely fallback - use pure random
    if (!code) {
      const fallback = `user-${nanoid()}${nanoid()}`.toLowerCase();
      const [result] = await tx.insert(referralCodes).values({
        userId,
        code: fallback
      }).returning();
      code = result.code;
    }
    
    return code;
  }

  /**
   * Attribute a signup to a referrer (with deduplication and self-referral prevention)
   */
  async attributeSignup(tx: any, refCode: string, joinerId: string, joinerEmail: string): Promise<void> {
    if (!refCode) return;
    
    const normalizedCode = normCode(refCode);
    const [owner] = await tx.select().from(referralCodes).where(eq(referralCodes.code, normalizedCode));
    
    if (!owner) return;

    // Self-referral guard: prevent users from referring themselves
    if (owner.userId === joinerId) {
      throw new Error('SELF_REFERRAL');
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