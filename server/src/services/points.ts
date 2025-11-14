import { db } from '../lib/db.js';
import { users, waitlistEntries, referralCodes, referralEvents } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

export interface PointsCalculation {
  base: number;
  verified: number;
  referrals: number;
  total: number;
}

export class PointsService {
  /**
   * Calculate points for a user
   */
  async computePoints(userId: string): Promise<PointsCalculation> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return { base: 0, verified: 0, referrals: 0, total: 0 };
    }

    // Base points for joining
    const base = 10;
    
    // Verification bonus
    const verified = user.emailVerifiedAt ? 20 : 0;
    
    // Referral points (10 per successful signup)
    const [referralStats] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(referralEvents)
      .innerJoin(referralCodes, eq(referralCodes.id, referralEvents.referralCodeId))
      .where(
        and(
          eq(referralCodes.userId, userId),
          eq(referralEvents.type, 'signup')
        )
      );
    
    const referralPoints = (referralStats?.count || 0) * 10;
    
    return {
      base,
      verified,
      referrals: referralPoints,
      total: base + verified + referralPoints
    };
  }

  /**
   * Get user summary including points, referrals, and rank
   */
  async getUserSummary(email: string) {
    const emailCi = email.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.emailCi, emailCi));
    
    if (!user) {
      return null;
    }

    const points = await this.computePoints(user.id);
    
    // Get referral count
    const [referralCount] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(referralEvents)
      .innerJoin(referralCodes, eq(referralCodes.id, referralEvents.referralCodeId))
      .where(
        and(
          eq(referralCodes.userId, user.id),
          eq(referralEvents.type, 'signup')
        )
      );

    // Simple rank calculation (placeholder - would need proper leaderboard)
    const rank = 1; // TODO: Implement proper ranking

    return {
      points: points.total,
      referrals: referralCount?.count || 0,
      rank,
      breakdown: points
    };
  }
}

export const pointsService = new PointsService();