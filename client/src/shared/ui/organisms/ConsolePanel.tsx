import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ConsolePanel() {
  const [referralLink, setReferralLink] = useState('');
  const [signupCount, setSignupCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  // Share functionality with Web Share API and fallback
  const shareReferralLink = async () => {
    const fullUrl = window.location.origin + referralLink;
    
    // Try Web Share API first (native mobile share)
    if (navigator.share) {
      try {
        await navigator.share({
          url: fullUrl,
          title: 'Join me on GoAmpy',
          text: 'I\'m on the GoAmpy waitlist! Join me and let\'s get early access together.'
        });
        // Success - show toast notification
        const event = new CustomEvent('toast', {
          detail: { 
            message: 'Shared successfully!',
            type: 'success'
          }
        });
        window.dispatchEvent(event);
        setCopyStatus('idle');
        return;
      } catch (err: any) {
        // User cancelled share
        if (err.name === 'AbortError') {
          return; // User cancelled - don't show any message
        }
        // Fall through to clipboard on other errors
      }
    }
    
    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopyStatus('copied');
      
      // Show toast notification
      const event = new CustomEvent('toast', {
        detail: { 
          message: 'Referral link copied to clipboard!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
      
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      
      // Last resort: select text in a temporary input
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      
      setCopyStatus('copied');
      
      // Show toast notification
      const event = new CustomEvent('toast', {
        detail: { 
          message: 'Referral link copied!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
      
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  useEffect(() => {
    // Listen for referral link generation
    const handleReferralLink = async (event: CustomEvent) => {
      setReferralLink(event.detail.referralLink);
      if (event.detail.points) setPoints(event.detail.points);
      if (event.detail.verified !== undefined) setIsVerified(event.detail.verified);
      
      // Fetch user stats after signup
      const email = localStorage.getItem('goampy_email');
      if (email) {
        try {
          const response = await fetch(`/api/me/summary?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            setSignupCount(data.referrals || 0);
            setPoints(data.points || 0);
          }
        } catch {}
      }
    };
    
    // Listen for email verification
    const handleEmailVerified = async (event: CustomEvent) => {
      if (event.detail.verified) {
        setIsVerified(true);
        // Refetch user stats to get updated points
        const email = localStorage.getItem('goampy_email');
        if (email) {
          try {
            const response = await fetch(`/api/me/summary?email=${encodeURIComponent(email)}`);
            if (response.ok) {
              const data = await response.json();
              setPoints(data.points || 0);
            }
          } catch {}
        }
      }
    };

    window.addEventListener('referralLinkGenerated', handleReferralLink as any);
    window.addEventListener('emailVerified', handleEmailVerified as any);

    // Check localStorage for existing link and fetch stats
    const stored = localStorage.getItem('goampy_referral_link');
    const storedEmail = localStorage.getItem('goampy_email');
    if (stored) {
      setReferralLink(stored);
    }
    
    // Fetch stats on mount if email is available
    if (storedEmail) {
      fetch(`/api/me/summary?email=${encodeURIComponent(storedEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data.referrals !== undefined) setSignupCount(data.referrals);
          if (data.points !== undefined) setPoints(data.points);
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('referralLinkGenerated', handleReferralLink as any);
      window.removeEventListener('emailVerified', handleEmailVerified as any);
    };
  }, []);


  return (
    <aside aria-label="Mission Control" className="p-6 min-h-[100dvh] bg-gray-900 text-white">
      <div className="text-xs text-white/60 mb-4">▸ MISSION CONTROL</div>
      
      <div className="space-y-4">
        {/* Points Display */}
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="text-3xl font-bold mb-2" data-testid="text-total-points">{points}</div>
          <div className="text-sm text-white/60">Total Points</div>
        </Card>

        {/* Mission Status */}
        <Card className="p-4 bg-white/5 border-white/10">
          <h3 className="font-medium mb-3">Active Missions</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Join the waitlist</span>
              <span className="text-xs text-green-400">✓ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Get your first referral</span>
              <span className="text-xs text-white/40">
                {signupCount > 0 ? '✓ Complete' : 'In Progress'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Refer 5 friends</span>
              <span className="text-xs text-white/40">{signupCount}/5</span>
            </div>
          </div>
        </Card>

        {/* Referral Stats */}
        {referralLink && (
          <Card className="p-4 bg-white/5 border-white/10">
            <h3 className="font-medium mb-3">Referral Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Total Signups</span>
                <span className="text-lg font-medium" data-testid="text-signup-count">{signupCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Points Earned</span>
                <span className="text-lg font-medium" data-testid="text-referral-points">+{signupCount * 10}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/40 mb-2">Your referral link:</p>
              <p className="text-xs text-white/60 break-all font-mono" data-testid="text-referral-link">
                {referralLink}
              </p>
              <div className="mt-3 flex gap-2">
                <Button 
                  onClick={shareReferralLink}
                  size="sm"
                  className="flex-1"
                  variant="outline"
                  data-testid="button-share-referral"
                >
                  {copyStatus === 'copied' ? (
                    <>✓ Copied!</>
                  ) : copyStatus === 'failed' ? (
                    <>× Failed</>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-2.684-4.342m2.684 4.342a3 3 0 00-2.684-4.342m0 0a3 3 0 00-2.684 4.342M6.316 10.658a3 3 0 012.684 4.342" />
                      </svg>
                      {navigator.share ? 'Share' : 'Copy'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Leaderboard Preview */}
        <Card className="p-4 bg-white/5 border-white/10">
          <h3 className="font-medium mb-3">Leaderboard</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>🥇 Top Referrer</span>
              <span className="text-white/60">250 pts</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>🥈 Second Place</span>
              <span className="text-white/60">180 pts</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-400">You</span>
              <span className="text-white/60">{points} pts</span>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
}