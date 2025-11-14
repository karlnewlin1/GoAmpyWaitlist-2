import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

// Production-grade logging with PII redaction
export function getLoggerMiddleware() {
  return pinoHttp({
    customProps: req => ({ 
      reqId: req.headers['x-request-id'] ?? randomUUID(), 
      svc: 'goampy-bff' 
    }),
    redact: {
      paths: [
        'req.headers.authorization',
        'req.body.email',
        'req.body.password',
        'req.body.name',
        'res.body'
      ],
      remove: true
    },
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  });
}