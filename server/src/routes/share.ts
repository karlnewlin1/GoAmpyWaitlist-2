import { Router } from 'express';
import { db } from '../lib/db.js';
import { referralCodes, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { normCode } from '../services/referral.js';

const r = Router();

r.get('/:code', async (req, res) => {
  const code = normCode(req.params.code);
  
  // Look up the referral code owner with a single join
  const [rc] = await db.select({
    name: users.name,
    code: referralCodes.code
  })
    .from(referralCodes)
    .innerJoin(users, eq(users.id, referralCodes.userId))
    .where(eq(referralCodes.code, code));

  const referrerName = rc?.name ? rc.name.split(' ')[0] : 'Someone special';
  const title = `${referrerName} invited you to join GoAmpy`;
  const description = 'Join the waitlist and get early access to AI-powered growth tools for B2B LinkedIn creators. Earn rewards for every friend you refer!';
  const url = `/?ref=${encodeURIComponent(code)}`;
  const shareUrl = `${req.protocol}://${req.get('host')}/share/${code}`;
  
  res.set('content-type', 'text/html; charset=utf-8').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- OG Tags for LinkedIn/Social Preview -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://goampy.com/og/ampy-card.png">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:type" content="website">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://goampy.com/og/ampy-card.png">
  
  <!-- Auto-redirect to landing with ref code -->
  <meta http-equiv="refresh" content="1;url=${url}">
  
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { opacity: 0.9; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Taking you to GoAmpy...</p>
  <script>
    setTimeout(() => { window.location.href = '${url}'; }, 1000);
  </script>
</body>
</html>`);
});

export default r;