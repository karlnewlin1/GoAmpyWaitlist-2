import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import waitlist from './routes/waitlist.js';
import events from './routes/events.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Referral redirect (click logging added later)
app.get('/r/:code', (req, res) => {
  res.redirect(`/?ref=${encodeURIComponent(req.params.code)}`);
});

// Mount API routes
app.use('/api/waitlist', waitlist);
app.use('/api/events', events);

// Bind explicitly to avoid Replit's default PORT=5000
const port = Number(process.env.BFF_PORT || 5177);
app.listen(port, () => console.log(`BFF on :${port}`));