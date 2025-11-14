import express from 'express';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import { getCorsMiddleware } from './middleware/cors.js';
import { getLoggerMiddleware } from './middleware/logger.js';
import { errorHandler } from './middleware/errors.js';
import { joinLimiter } from './middleware/rateLimit.js';

// Routes
import health from './routes/health.js';
import waitlist from './routes/waitlist.js';
import events from './routes/events.js';
import me from './routes/me.js';
import share from './routes/share.js';
import redirects from './routes/redirects.js';

export function createApp() {
  const app = express();

  // Trust proxy for accurate client IPs
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS
  app.use(getCorsMiddleware());

  // Body parsing
  app.use(express.json());

  // Logging
  app.use(getLoggerMiddleware());

  // Request ID
  app.use((req, res, next) => {
    const id = (req as any).log?.bindings()?.reqId ?? randomUUID();
    res.setHeader('x-request-id', id);
    next();
  });

  // Routes
  app.use('/api', health);
  
  // Rate limited routes
  app.use('/api/waitlist/join', joinLimiter);
  app.use('/api/waitlist', waitlist);
  
  app.use('/api/events', events);
  app.use('/api/me', me);
  app.use('/share', share);
  app.use('/', redirects); // /r/:code routes

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}