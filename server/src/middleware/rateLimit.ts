import rateLimit from 'express-rate-limit';

export const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 60,                    // 60 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many join requests from this IP, please try again later.'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 60,                    // 60 requests per window for auth endpoints
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many authentication attempts from this IP, please try again later.'
});

export const referralClickLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 clicks per window per IP
  standardHeaders: 'draft-7', // Add RateLimit-* headers
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  message: { 
    error: { 
      code: 'rate_limit_exceeded', 
      message: 'Too many referral clicks from this IP, please try again later.' 
    }
  }
});