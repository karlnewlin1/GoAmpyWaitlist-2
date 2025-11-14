import { randomUUID } from 'crypto';

interface IdempotencyRecord {
  key: string;
  response: any;
  timestamp: number;
}

// Simple in-memory store (replace with Redis in production)
const store = new Map<string, IdempotencyRecord>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const TTL = 15 * 60 * 1000; // 15 minutes
  
  for (const [key, record] of store.entries()) {
    if (now - record.timestamp > TTL) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class IdempotencyService {
  /**
   * Check if request has been processed before
   * Returns cached response if found, null otherwise
   */
  check(key: string): any | null {
    const record = store.get(key);
    
    if (!record) return null;
    
    // Check if expired
    const age = Date.now() - record.timestamp;
    const TTL = 15 * 60 * 1000; // 15 minutes
    
    if (age > TTL) {
      store.delete(key);
      return null;
    }
    
    return record.response;
  }

  /**
   * Store response for future idempotency checks
   */
  store(key: string, response: any): void {
    store.set(key, {
      key,
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Extract idempotency key from request
   * Falls back to generating one from email (for backward compatibility)
   */
  extractKey(req: any): string {
    const headerKey = req.headers['idempotency-key'];
    
    if (headerKey) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(headerKey)) {
        throw new Error('Idempotency-Key must be a valid UUID');
      }
      return headerKey;
    }
    
    // Fallback: generate deterministic key from email
    // This provides natural idempotency without requiring clients to change
    const email = req.body?.email;
    if (email) {
      return `email:${email.toLowerCase().trim()}`;
    }
    
    // No email and no key - generate random (won't prevent duplicates)
    return `random:${randomUUID()}`;
  }
}

export const idempotencyService = new IdempotencyService();