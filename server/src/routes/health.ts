import { Router } from 'express';
import { db } from '../lib/db.js';
import { sql } from 'drizzle-orm';
import { ENV } from '../config/env.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

router.get('/health', asyncHandler(async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({
      ok: true,
      db: true,
      svc: 'goampy-bff',
      version: ENV.GIT_SHA,
      ts: new Date().toISOString()
    });
  } catch {
    return res.status(500).json({ ok: false, db: false });
  }
}));

export default router;