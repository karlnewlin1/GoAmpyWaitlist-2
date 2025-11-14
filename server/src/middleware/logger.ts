import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

// Production-grade logging with comprehensive PII redaction
export function getLoggerMiddleware() {
  return pinoHttp({
    customProps: req => ({ 
      reqId: req.headers['x-request-id'] ?? randomUUID(), 
      svc: 'goampy-bff' 
    }),
    redact: {
      paths: [
        // Headers
        'req.headers.authorization',
        'req.headers.cookie',
        // Request body PII
        'req.body.email',
        'req.body.password',
        'req.body.token',
        'req.body.code',
        'req.body.name',
        // Response body (prod only to avoid debugging pain in dev)
        ...(process.env.NODE_ENV === 'production' ? ['res.body'] : [])
      ],
      remove: true
    },
    serializers: { 
      res: (res) => ({ statusCode: res.statusCode }) 
    },
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  });
}