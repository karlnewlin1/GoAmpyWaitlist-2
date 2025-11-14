import { Router } from 'express';
import { db } from '../lib/db.js';
import { referralCodes, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const r = Router();

r.get('/:code', async (req, res) => {
  const { code } = req.params;
  const [rc] = await db.select().from(referralCodes).where(eq(referralCodes.code, code));
  let name = 'an Ampy creator';
  
  if (rc) {
    const [u] = await db.select().from(users).where(eq(users.id, rc.userId));
    if (u?.name) name = u.name.split(' ')[0];
  }

  const url = `/?ref=${encodeURIComponent(code)}`;
  res.set('content-type', 'text/html; charset=utf-8').send(`<!doctype html>
<html><head>
  <meta property="og:title" content="Join Ampy — beta waitlist">
  <meta property="og:description" content="${name} invited you. Earn points and priority by sharing your link.">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://goampy.com/og/ampy-card.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta http-equiv="refresh" content="0; url=${url}">
</head><body>Redirecting…</body></html>`);
});

export default r;