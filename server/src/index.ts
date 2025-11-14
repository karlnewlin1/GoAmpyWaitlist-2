import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Referral redirect (logs will be added when Drizzle lands)
app.get('/r/:code', (req, res) => {
  res.redirect(`/?ref=${encodeURIComponent(req.params.code)}`);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`BFF on :${port}`));
