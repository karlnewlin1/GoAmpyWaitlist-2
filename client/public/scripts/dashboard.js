console.debug('[dashboard] mounted');
const stored = localStorage.getItem('goampy_referral_link');
if (stored && typeof window.mountReferralCard === 'function') {
  const abs = new URL(stored, location.origin).href;
  window.mountReferralCard(abs);
}