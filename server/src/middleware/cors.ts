import cors from 'cors';
import { ENV } from '../config/env.js';

// Configure CORS with environment-based origins
export function getCorsMiddleware() {
  const origins = ENV.APP_ORIGIN;
  
  return cors({
    origin: origins && origins.length > 0 ? origins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  });
}