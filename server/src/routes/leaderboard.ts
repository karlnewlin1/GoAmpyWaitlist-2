import { Router } from 'express';
import { db } from '../lib/db.js';
import { users, waitlistEntries, referralCodes, referralEvents } from '../shared/schema.js';
import { eq, sql, desc } from 'drizzle-orm';
import { asyncHandler } from '../middleware/errors.js';
import { pointsService } from '../services/points.js';

const router = Router();

// Simple in-memory cache for leaderboard
let leaderboardCache: any = null;
let cacheExpiry = 0;

router.get('/top', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  
  // Check cache
  const now = Date.now();
  if (leaderboardCache && cacheExpiry > now) {
    return res.json(leaderboardCache.slice(0, limit));
  }

  // Fetch top users with referral counts
  const topUsers = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerifiedAt,
      createdAt: users.createdAt,
      referralCount: sql<number>`
        COALESCE((
          SELECT COUNT(*)::int
          FROM ${referralEvents} re
          JOIN ${referralCodes} rc ON rc.id = re.referral_code_id
          WHERE rc.user_id = ${users.id} AND re.type = 'signup'
        ), 0)
      `
    })
    .from(users)
    .innerJoin(waitlistEntries, eq(waitlistEntries.userId, users.id))
    .orderBy(
      desc(sql`COALESCE((
        SELECT COUNT(*)
        FROM ${referralEvents} re
        JOIN ${referralCodes} rc ON rc.id = re.referral_code_id
        WHERE rc.user_id = ${users.id} AND re.type = 'signup'
      ), 0)`),
      users.createdAt
    )
    .limit(100);

  // Calculate points for each user
  const leaderboard = await Promise.all(
    topUsers.map(async (user) => {
      const points = 10 + (user.emailVerified ? 20 : 0) + (user.referralCount * 10);
      
      return {
        firstName: user.name?.split(' ')[0] || 'Anonymous',
        emailMasked: maskEmail(user.email),
        points,
        referrals: user.referralCount,
        joinedAt: user.createdAt
      };
    })
  );

  // Sort by points, then by join date
  leaderboard.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  // Update cache (60 seconds)
  leaderboardCache = leaderboard;
  cacheExpiry = now + 60000;

  res.json(leaderboard.slice(0, limit));
}));

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(Math.min(local.length - 2, 3)) + local[local.length - 1]
    : '***';
    
  return `${maskedLocal}@${domain}`;
}

export default router;