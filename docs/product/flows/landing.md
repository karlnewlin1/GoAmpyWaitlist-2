# Landing (Chat + Console)
Split layout. **Left = chat**, **Right = Console**. Flow: name → email → verify/skip, then show the referral link inline (bot bubble) **and** in Console.

**Acceptance**
- Referral link is rendered inline immediately after join (Copy + Share to LinkedIn).
- Console chips show points and progress; "Already signed up?" path works.
- Mobile: pill switches panels; last panel persisted in localStorage.

**Error UX**
- Disposable/invalid email messages; SR live region announcements.
- Rate limit friendly error; retry guidance.