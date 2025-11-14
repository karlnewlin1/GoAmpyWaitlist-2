import { SignJWT, jwtVerify } from 'jose';
import { Request, Response } from 'express';
import { ENV } from '../config/env.js';

const secret = new TextEncoder().encode(ENV.SESSION_SECRET || 'dev-secret-change-in-production');
const NAME = 'ampy.sid';

export type SessionPayload = {
  sub: string;       // our app user id (UUID) if known
  email: string;     // normalized email (emailCi)
};

export async function setSession(res: Response, payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  res.cookie(NAME, token, {
    httpOnly: true, 
    secure: ENV.NODE_ENV !== 'development',
    sameSite: 'lax', 
    path: '/'
  });
}

export async function getSession(req: Request): Promise<SessionPayload | null> {
  const t = (req as any).cookies?.[NAME];
  if (!t) return null;
  try { 
    const { payload } = await jwtVerify(t, secret); 
    return payload as SessionPayload; 
  }
  catch { 
    return null; 
  }
}

export function clearSession(res: Response) {
  res.clearCookie(NAME, { path: '/' });
}