import rateLimit from 'express-rate-limit';

export const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 60,                    // 60 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many join requests from this IP, please try again later.'
});