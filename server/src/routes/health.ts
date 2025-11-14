import { Router, Request, Response } from 'express';
import { db } from '../lib/db.js';
import { sql } from 'drizzle-orm';
import { ENV } from '../config/env.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

router.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  let dbHealthy = false;
  let dbError: string | undefined;
  
  try {
    await db.execute(sql`select 1`);
    dbHealthy = true;
  } catch (error: any) {
    dbError = error.message;
  }
  
  const health = {
    ok: dbHealthy,
    db: dbHealthy,
    svc: 'goampy-bff',
    version: ENV.GIT_SHA,
    env: ENV.NODE_ENV,
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    ...(dbError && { dbError })
  };
  
  res
    .status(dbHealthy ? 200 : 503)
    .json(health);
}));

export default router;