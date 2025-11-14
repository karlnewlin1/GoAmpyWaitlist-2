import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import waitlist from './routes/waitlist.js';
import events from './routes/events.js';
import { db } from './lib/db.js';
import { referralCodes, referralEvents } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const method = req.method;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Log API requests with response data
    if (path.startsWith('/api/')) {
      const originalSend = res.send;
      let responseBody: any;
      
      res.send = function(data) {
        responseBody = data;
        return originalSend.apply(res, arguments);
      };
      
      console.log(`${method} ${path} ${status} ${duration}ms`);
      if (responseBody) {
        try {
          console.log('Response:', JSON.parse(responseBody));
        } catch {}
      }
    } else {
      console.log(`${method} ${path} ${status} ${duration}ms`);
    }
  });
  
  next();
});

// Health with timestamp
app.get('/api/health', (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  service: 'goampy-api' 
}));

// APIs
app.use('/api/waitlist', waitlist);
app.use('/api/events', events);

// Referral redirect with click tracking
app.get('/r/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const [rc] = await db.select().from(referralCodes).where(eq(referralCodes.code, code));
    if (rc) await db.insert(referralEvents).values({ referralCodeId: rc.id, type: 'click' });
  } catch {}
  res.redirect(`/?ref=${encodeURIComponent(code)}`);
});

const port = Number(process.env.BFF_PORT || 5177);
app.listen(port, () => console.log(`BFF on :${port}`));