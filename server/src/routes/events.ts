import { Router } from 'express';
import { db } from '../lib/db.js';
import { events } from '../shared/schema.js';

const r = Router();
r.post('/', async (req, res) => {
  const { event, payload, userId } = req.body ?? {};
  if (!event) return res.status(400).json({ error: 'event required' });
  await db.insert(events).values({ eventName: String(event), payload: payload ?? null, userId: userId ?? null });
  res.status(204).end();
});
export default r;