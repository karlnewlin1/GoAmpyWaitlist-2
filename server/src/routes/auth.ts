import { Router } from 'express';
import { z } from 'zod';
import { supaAdmin } from '../lib/supabase.js';
import { db } from '../lib/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { setSession } from '../lib/session.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

const emailSchema = z.string().email().transform(s => s.trim().toLowerCase());
const disposable = /@(mailinator\.com|10minutemail\.|guerrillamail\.|tempmail)/i;

const SendOTPBody = z.object({
  email: emailSchema
});

const VerifyOTPBody = z.object({
  email: emailSchema,
  code: z.string().min(6).max(12)
});

// Send OTP to email
router.post('/otp/send', asyncHandler(async (req, res) => {
  const { email } = SendOTPBody.parse(req.body);
  
  // Check for disposable email
  if (disposable.test(email)) {
    return res.status(422).json({ 
      error: { 
        code: 'disposable', 
        message: 'Use a permanent email.' 
      } 
    });
  }

  if (!supaAdmin) {
    return res.status(503).json({ 
      error: { 
        code: 'auth_not_configured', 
        message: 'Authentication service not configured' 
      } 
    });
  }

  // Send OTP via Supabase
  const { error } = await supaAdmin.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true } // Supabase will create an auth user if needed
  });

  if (error) {
    console.error('Supabase OTP error:', error);
    return res.status(400).json({ 
      error: { 
        code: 'send_failed', 
        message: 'Unable to send OTP' 
      }
    });
  }
  
  // Optional: log event 'otp_sent'
  res.json({ status: 'sent' });
}));

// Verify OTP
router.post('/otp/verify', asyncHandler(async (req, res) => {
  const parse = VerifyOTPBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ 
      error: { 
        code: 'bad_request',
        message: 'Invalid request format' 
      }
    });
  }
  
  const { email, code } = parse.data;

  if (!supaAdmin) {
    return res.status(503).json({ 
      error: { 
        code: 'auth_not_configured', 
        message: 'Authentication service not configured' 
      } 
    });
  }

  // Verify OTP with Supabase
  const { data, error } = await supaAdmin.auth.verifyOtp({ 
    email, 
    token: code, 
    type: 'email' 
  });
  
  if (error || !data?.user) {
    // Optional: log event 'otp_verify_fail'
    return res.status(400).json({ 
      error: { 
        code: 'verify_failed', 
        message: 'Invalid or expired code' 
      }
    });
  }

  // Ensure app user exists & mark verified
  const emailCi = email;
  const [u] = await db.select().from(users).where(eq(users.emailCi, emailCi)).limit(1);
  
  if (u) {
    // Update existing user's verification status
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.emailCi, emailCi));
    
    // Issue BFF session cookie
    await setSession(res, { sub: u.id, email: emailCi });
  } else {
    // User doesn't exist yet - they should go through join flow first
    // But we'll still set a session with Supabase user id
    await setSession(res, { sub: data.user.id, email: emailCi });
  }

  // Optional: log event 'otp_verified'
  return res.json({ verified: true });
}));

export default router;