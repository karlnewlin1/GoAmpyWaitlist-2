import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import waitlist from './routes/waitlist.js';
import events from './routes/events.js';

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// APIs
app.use('/api/waitlist', waitlist);
app.use('/api/events', events);

// Referral redirect (click logging can be added later)
app.get('/r/:code', (req, res) => {
  res.redirect(`/?ref=${encodeURIComponent(req.params.code)}`);
});

const port = Number(process.env.BFF_PORT || 5177);
app.listen(port, () => console.log(`BFF on :${port}`));