import { Router } from 'express';
import { db } from '../lib/db.js';
import { referralCodes, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { normCode } from '../services/referral.js';
import { ENV } from '../config/env.js';

const r = Router();

r.get('/:code', async (req, res) => {
  const rawCode = req.params.code;
  const code = normCode(rawCode);
  
  console.log(`[share] Received code: "${rawCode}", normalized to: "${code}"`);
  
  // Look up the referral code owner with a single join
  const [rc] = await db.select({
    name: users.name,
    code: referralCodes.code
  })
    .from(referralCodes)
    .innerJoin(users, eq(users.id, referralCodes.userId))
    .where(eq(referralCodes.code, code));

  console.log(`[share] Lookup result:`, rc);

  const referrerName = rc?.name ? rc.name.split(' ')[0] : 'Someone special';
  const title = `${referrerName} invited you to join GoAmpy`;
  const description = 'Join the waitlist and get early access to AI-powered growth tools. Earn rewards for every friend you refer!';
  
  // Build URLs dynamically
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const landingUrl = `/?ref=${encodeURIComponent(code)}`;
  const shareUrl = `${baseUrl}/share/${code}`;
  
  // Use environment-aware OG image URL
  const ogImageUrl = ENV.NODE_ENV === 'production'
    ? 'https://goampy.com/og/ampy-card.png'
    : `${baseUrl}/og/ampy-card.png`;
  
  // Set cache headers for social media scrapers (10 minute TTL)
  res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
  res.set('Content-Type', 'text/html; charset=utf-8');
  
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- Prevent search engine indexing -->
  <meta name="robots" content="noindex, nofollow">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="GoAmpy">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${shareUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- LinkedIn -->
  <meta property="og:locale" content="en_US">
  
  <!-- Auto-redirect (give crawlers time to read OG tags) -->
  <meta http-equiv="refresh" content="2;url=${landingUrl}">
  
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
    setTimeout(() => { window.location.href = '${landingUrl}'; }, 1000);
  </script>
</body>
</html>`);
});

export default r;