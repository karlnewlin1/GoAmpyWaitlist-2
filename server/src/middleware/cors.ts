import cors from 'cors';
import { ENV } from '../config/env.js';

// Configure CORS with strict allowlist - fail fast if not configured
export function getCorsMiddleware() {
  const origins = ENV.APP_ORIGIN;
  
  // SECURITY: Fail fast if APP_ORIGIN not configured
  if (!origins || origins.length === 0) {
    throw new Error(
      'CORS_MISCONFIGURED: APP_ORIGIN environment variable must be set. ' +
      'Example: APP_ORIGIN=https://goampy.com,http://localhost:5000'
    );
  }
  
  return cors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'idempotency-key'],
  });
}