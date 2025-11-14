// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/r/:code', (req, res) => {
  res.redirect(`/?ref=${encodeURIComponent(req.params.code)}`);
});

// ✅ Use our own var so we never collide with Replit's default
const port = Number(process.env.BFF_PORT || 5177);
app.listen(port, () => console.log(`BFF on :${port}`));
