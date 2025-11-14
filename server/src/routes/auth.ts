import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

const SendOTPBody = z.object({
  email: z.string().email()
});

const VerifyOTPBody = z.object({
  email: z.string().email(),
  token: z.string().length(6)
});

// Send OTP to email
router.post('/otp/send', asyncHandler(async (req, res) => {
  const { email } = SendOTPBody.parse(req.body);
  
  await authService.sendOTP(email);
  
  res.json({ 
    message: 'Verification code sent to your email',
    email 
  });
}));

// Verify OTP
router.post('/otp/verify', asyncHandler(async (req, res) => {
  const { email, token } = VerifyOTPBody.parse(req.body);
  
  const result = await authService.verifyOTP(email, token);
  
  res.json({
    verified: result.verified,
    message: result.verified ? 'Email verified successfully' : 'Verification failed'
  });
}));

export default router;