import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// JWT verification middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'auth_required' });
  }

  try {
    const user = await authService.getSession(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid session', code: 'invalid_session' });
  }
}

// Optional auth - adds user if present but doesn't require it
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const user = await authService.getSession(token);
      req.user = user;
    } catch {}
  }
  
  next();
}