import { supabaseAdmin } from '../lib/supabase.js';
import { db } from '../lib/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/errors.js';

export class AuthService {
  /**
   * Send OTP to email for verification
   */
  async sendOTP(email: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new AppError('Authentication service not configured', 'auth_not_configured', 503);
    }

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.PUBLIC_URL || 'http://localhost:5000'}/dashboard`
      }
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      throw new AppError('Failed to send verification code', 'otp_send_failed', 500);
    }
  }

  /**
   * Verify OTP and mark email as verified
   */
  async verifyOTP(email: string, token: string): Promise<{ verified: boolean }> {
    if (!supabaseAdmin) {
      throw new AppError('Authentication service not configured', 'auth_not_configured', 503);
    }

    // Verify with Supabase
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      console.error('OTP verification error:', error);
      throw new AppError('Invalid or expired code', 'otp_verify_failed', 400);
    }

    // Update our database to mark email as verified
    if (data.user) {
      const emailCi = email.toLowerCase();
      await db
        .update(users)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(users.emailCi, emailCi));

      return { verified: true };
    }

    return { verified: false };
  }

  /**
   * Get or create a session from Supabase JWT
   */
  async getSession(token: string) {
    if (!supabaseAdmin) {
      throw new AppError('Authentication service not configured', 'auth_not_configured', 503);
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      throw new AppError('Invalid session', 'invalid_session', 401);
    }

    return data.user;
  }
}

export const authService = new AuthService();