# PR-B: Native PWA Feel & Sharing - Implementation Plan

**Target:** Mobile-first experience with native sharing  
**Estimated Effort:** 1-2 days  
**Priority:** 🟡 HIGH (improves viral coefficient)

---

## Overview

This PR enhances the Progressive Web App experience, focusing on iOS support and native sharing capabilities. These improvements will increase installation rates and sharing effectiveness, directly impacting growth metrics.

---

## Changes Breakdown

### 1. iOS PWA Meta Tags

**File:** [`client/index.html`](../client/index.html)

**Current State:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="manifest" href="/manifest.webmanifest">
    <meta name="theme-color" content="#0b0b0f">
    <meta name="description" content="Join the priority waitlist for GoAmpy">
    <title>GoAmpy - Join the Priority Waitlist</title>
  </head>
  <!-- ... -->
```

**Enhanced Version:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.webmanifest">
    
    <!-- Icons -->
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    
    <!-- iOS PWA Support -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="GoAmpy" />
    
    <!-- Theme Colors -->
    <meta name="theme-color" content="#0b0b0f" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0b0f" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
    
    <!-- MS/Windows -->
    <meta name="msapplication-TileColor" content="#0b0b0f" />
    <meta name="msapplication-tap-highlight" content="no" />
    
    <!-- SEO -->
    <meta name="description" content="Join the priority waitlist for GoAmpy - your personal AI productivity companion. Earn rewards for every friend you refer!" />
    <meta name="keywords" content="waitlist, AI, productivity, referral, rewards" />
    
    <title>GoAmpy - Join the Priority Waitlist</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**New Asset Required:** [`client/public/apple-touch-icon.png`](../client/public/apple-touch-icon.png)
- Size: 180x180px
- Format: PNG with transparency
- Content: GoAmpy logo on solid background (#0b0b0f)

**Testing:**
```bash
# iOS Safari (iPhone)
1. Visit app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Verify:
   - Correct icon appears
   - App name is "GoAmpy"
   - Opens in standalone mode (no Safari UI)
   - Status bar is translucent

# Android Chrome
1. Visit app in Chrome
2. Tap menu → "Install app"
3. Verify:
   - Install prompt appears
   - Correct icon and name
   - Opens in standalone mode
```

---

### 2. Web Share API with Clipboard Fallback

**File:** [`client/src/features/referral/components/ReferralCard.tsx`](../client/src/features/referral/components/ReferralCard.tsx)

**Current Implementation:** (Assuming basic copy-to-clipboard)

**Enhanced Version:**
```tsx
import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/shared/ui/atoms';
import { Card } from '@/shared/ui/atoms';

interface ReferralCardProps {
  code: string;
  referralLink: string;
}

export function ReferralCard({ code, referralLink }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${window.location.origin}${referralLink}`;

  const handleShare = async () => {
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on GoAmpy',
          text: 'I\'m on the GoAmpy waitlist! Join me and let\'s get early access together.',
          url: fullUrl
        });
        return; // Success - exit early
      } catch (error: any) {
        // User cancelled or share failed
        if (error.name === 'AbortError') {
          return; // User cancelled - don't show copied message
        }
        // Fall through to clipboard on other errors
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      
      // Show a toast notification
      const event = new CustomEvent('toast', {
        detail: { 
          message: 'Referral link copied to clipboard!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      
      // Last resort: select text in a temporary input
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isShareSupported = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Your Referral Link</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Share this link to earn 10 points for each friend who joins!
        </p>
      </div>

      <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
        <code className="flex-1 text-sm truncate">{fullUrl}</code>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleShare}
          className="flex-1"
          disabled={copied}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : isShareSupported ? (
            <>
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Your code: <span className="font-mono font-semibold">{code}</span>
      </div>
    </Card>
  );
}
```

**Add Toast Notification System:**

**New File:** [`client/src/shared/ui/molecules/Toast.tsx`](../client/src/shared/ui/molecules/Toast.tsx)
```tsx
import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { message, type = 'info' } = event.detail;
      const id = Math.random().toString(36).slice(2);
      
      setToasts(prev => [...prev, { id, message, type }]);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    window.addEventListener('toast', handleToast as EventListener);
    return () => window.removeEventListener('toast', handleToast as EventListener);
  }, []);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 p-4 rounded-lg shadow-lg
              animate-in slide-in-from-right-full
              ${toast.type === 'success' ? 'bg-green-600 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-600 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-600 text-white' : ''}
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="flex-shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

**Update:** [`client/src/app/app.tsx`](../client/src/app/app.tsx)
```tsx
import { ToastContainer } from '@/shared/ui/molecules/Toast';

export function App() {
  return (
    <>
      {/* Existing app content */}
      <ToastContainer />
    </>
  );
}
```

**Testing:**
```bash
# Mobile (iOS/Android)
1. Navigate to dashboard with referral link
2. Tap "Share Link" button
3. Verify native share sheet appears
4. Select a share target (Messages, Email, etc.)
5. Verify link is correctly included

# Desktop (Chrome/Firefox/Safari)
1. Navigate to dashboard with referral link
2. Click "Copy Link" button
3. Verify toast "Link copied!" appears
4. Paste in another app
5. Verify link is correct

# Edge case: Clipboard API blocked
1. Use browser with restricted clipboard (e.g., HTTP not HTTPS)
2. Click share button
3. Verify fallback works (document.execCommand)
```

---

### 3. Share Page OG Tag Optimization

**File:** [`server/src/routes/share.ts`](../server/src/routes/share.ts)

**Current Issues:**
- OG image URL is hardcoded to `goampy.com`
- Won't work in development/staging

**Changes:**
```typescript
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
  
  // Look up the referral code owner
  const [rc] = await db.select({
    name: users.name,
    code: referralCodes.code
  })
    .from(referralCodes)
    .innerJoin(users, eq(users.id, referralCodes.userId))
    .where(eq(referralCodes.code, code));

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
  
  // Set cache headers (10 minute TTL for social media crawlers)
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 2rem;
    }
    .container { max-width: 500px; }
    h1 { font-size: 2rem; margin-bottom: 1rem; font-weight: 700; }
    p { opacity: 0.95; font-size: 1.1rem; margin-bottom: 2rem; }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .spinner { animation: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>Taking you to GoAmpy...</p>
    <div class="spinner" role="status" aria-label="Loading"></div>
  </div>
  <script>
    // More reliable redirect with fallback
    setTimeout(() => { 
      window.location.href = '${landingUrl}'; 
    }, 2000);
    
    // Fallback if meta refresh fails
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = '${landingUrl}';
        }
      }, 2500);
    });
  </script>
</body>
</html>`);
});

export default r;
```

**Create OG Image Asset:**

**New File:** [`client/public/og/ampy-card.png`](../client/public/og/ampy-card.png)
- Size: 1200x630px (OpenGraph standard)
- Format: PNG or JPG
- Content: GoAmpy branding + value proposition
- Text: "Join the GoAmpy Waitlist - AI-Powered Growth for Creators"

**Testing:**
```bash
# Test OG tags with LinkedIn Post Inspector
1. Go to https://www.linkedin.com/post-inspector/
2. Enter: https://your-domain.com/share/test-code
3. Verify:
   - Correct title appears
   - Description is present
   - Image loads (1200x630)
   - No errors

# Test Twitter Card Validator
1. Go to https://cards-dev.twitter.com/validator
2. Enter share URL
3. Verify card preview

# Test Facebook Sharing Debugger
1. Go to https://developers.facebook.com/tools/debug/
2. Enter share URL
3. Click "Scrape Again"
4. Verify OG data
```

---

## PWA Manifest Enhancement

**File:** [`client/public/manifest.webmanifest`](../client/public/manifest.webmanifest)

**Enhanced Version:**
```json
{
  "name": "GoAmpy - AI Productivity Companion",
  "short_name": "GoAmpy",
  "description": "Join the priority waitlist and get early access to AI-powered productivity tools",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b0b0f",
  "theme_color": "#0b0b0f",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/pwa-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/pwa-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ],
  "categories": ["productivity", "business", "utilities"],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "View your referral progress",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/dashboard-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Share Link",
      "short_name": "Share",
      "description": "Share your referral link",
      "url": "/dashboard?action=share",
      "icons": [{ "src": "/icons/share-96.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## Testing Checklist

### iOS Testing (Safari)
- [ ] Add to Home Screen works
- [ ] App icon appears correctly (180x180)
- [ ] App name is "GoAmpy"
- [ ] Opens in standalone mode (no browser UI)
- [ ] Status bar is translucent
- [ ] Safe area insets respected
- [ ] Share button opens iOS share sheet
- [ ] Shared link includes referral code

### Android Testing (Chrome)
- [ ] Install prompt appears
- [ ] App installs to home screen
- [ ] Icon and name correct
- [ ] Opens in standalone mode
- [ ] Theme color applied
- [ ] Share button opens Android share sheet
- [ ] Shared link includes referral code

### Desktop Testing
- [ ] Share button copies to clipboard
- [ ] Toast notification appears
- [ ] Copied link is correct
- [ ] Works in Chrome, Firefox, Safari, Edge

### Social Media Testing
- [ ] LinkedIn preview looks good
- [ ] Twitter card displays correctly
- [ ] Facebook preview shows image
- [ ] OG image loads (1200x630)
- [ ] Title and description accurate
- [ ] Redirect works after preview

---

## Performance Considerations

### Service Worker Caching
Ensure these new assets are cached:
```typescript
// In vite.config.ts PWA config
includeAssets: [
  'favicon.png',
  'robots.txt',
  'apple-touch-icon.png',
  'og/ampy-card.png',  // Add OG image
  'pwa-192.png',
  'pwa-512.png'
]
```

### Image Optimization
- Compress PNG images with tools like TinyPNG
- Use WebP with PNG fallback for OG image
- Lazy load OG image on share page (won't affect crawlers)

---

## Migration Notes

### New Assets Required
1. `/client/public/apple-touch-icon.png` (180x180px)
2. `/client/public/og/ampy-card.png` (1200x630px)
3. Optional: `/client/public/icons/dashboard-96.png`
4. Optional: `/client/public/icons/share-96.png`

### No Breaking Changes
✅ All changes are additive and backward compatible

---

## Success Criteria

- [ ] PWA installs on iOS with correct icon and name
- [ ] PWA installs on Android with install prompt
- [ ] Share button uses native share on mobile
- [ ] Share button copies to clipboard on desktop
- [ ] Toast notifications work
- [ ] OG tags render correctly on LinkedIn/Twitter/Facebook
- [ ] Share page redirects after preview
- [ ] No degradation in Lighthouse PWA score

---

## Metrics to Track

**Before PR-B:**
- PWA install rate: ?
- Share button click rate: ?
- Successful shares: ?

**After PR-B (target):**
- PWA install rate: +50%
- Share button click rate: +30%
- Successful shares: +40%
- Viral coefficient: Measure impact

---

## Next Steps After PR-B

1. Monitor share analytics
2. A/B test share messages
3. Add share incentives (bonus points)
4. Proceed with PR-C (API documentation)