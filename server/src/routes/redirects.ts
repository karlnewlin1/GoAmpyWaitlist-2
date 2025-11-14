import { Router } from 'express';
import { referralService } from '../services/referral.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

// Referral redirect with canonicalized codes
router.get('/r/:code', asyncHandler(async (req, res) => {
  const code = req.params.code;
  
  // Log click event
  await referralService.logClick(code);
  
  // Redirect to landing with normalized code
  const normalizedCode = referralService.normCode(code);
  res.redirect(`/?ref=${encodeURIComponent(normalizedCode)}`);
}));

export default router;