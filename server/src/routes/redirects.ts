import { Router, Request, Response } from 'express';
import { referralService, normCode } from '../services/referral.js';
import { asyncHandler } from '../middleware/errors.js';
import { referralClickLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Apply rate limiting BEFORE the handler
router.get('/r/:code', referralClickLimiter, asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code;
  
  // Log click event (fire and forget, don't block on errors)
  referralService.logClick(code).catch(err => 
    console.error('Failed to log referral click:', err)
  );
  
  // Redirect to landing with normalized code
  const normalizedCode = normCode(code);
  res.redirect(`/?ref=${encodeURIComponent(normalizedCode)}`);
}));

export default router;