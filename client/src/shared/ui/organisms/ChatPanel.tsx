import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Step = 'name' | 'email' | 'complete';

export function ChatPanel() {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNameSubmit = () => {
    if (name.trim().length >= 2) {
      setStep('email');
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.includes('@')) return;

    setIsLoading(true);
    try {
      // Get ref code from URL params
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || null;

      const response = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, ref })
      });

      if (response.ok) {
        const data = await response.json();
        const fullLink = `${window.location.origin}${data.referralLink}`;
        setReferralLink(fullLink);
        
        // Store in localStorage for dashboard
        localStorage.setItem('goampy_referral_link', fullLink);
        localStorage.setItem('goampy_email', email);
        
        // Dispatch event for ConsolePanel
        window.dispatchEvent(new CustomEvent('referralLinkGenerated', { 
          detail: { referralLink: fullLink } 
        }));
        
        setStep('complete');
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
  };

  return (
    <section aria-label="Conversation" className="p-6 border-r border-white/10 min-h-[100dvh] bg-black text-white">
      <div className="text-sm text-white/60 mb-6">
        You're chatting with <b className="text-white/90">Ampy</b> — your AI growth scout
      </div>

      <div className="space-y-4 max-w-md">
        {/* Ampy's messages */}
        <Card className="p-4 bg-white/5 border-white/10">
          <p className="text-sm">Hey there! 👋 I'm Ampy, and I'll help you join our waitlist.</p>
        </Card>

        {step === 'name' && (
          <>
            <Card className="p-4 bg-white/5 border-white/10">
              <p className="text-sm mb-3">First, what should I call you?</p>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Enter your name"
                className="mb-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleNameSubmit()}
                data-testid="input-name"
              />
              <Button 
                onClick={handleNameSubmit}
                disabled={name.trim().length < 2}
                className="w-full"
                data-testid="button-submit-name"
              >
                Continue
              </Button>
            </Card>
          </>
        )}

        {step === 'email' && (
          <>
            <div className="self-end bg-white/10 rounded-lg p-3 ml-auto max-w-[200px]">
              <p className="text-sm">{name}</p>
            </div>
            
            <Card className="p-4 bg-white/5 border-white/10">
              <p className="text-sm mb-3">Nice to meet you, {name}! What's your email?</p>
              <Input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mb-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleEmailSubmit()}
                data-testid="input-email"
              />
              <Button 
                onClick={handleEmailSubmit}
                disabled={!email.includes('@') || isLoading}
                className="w-full"
                data-testid="button-submit-email"
              >
                {isLoading ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </Card>
          </>
        )}

        {step === 'complete' && (
          <>
            <div className="self-end bg-white/10 rounded-lg p-3 ml-auto max-w-[200px]">
              <p className="text-sm">{email}</p>
            </div>
            
            <Card className="p-4 bg-white/5 border-white/10">
              <p className="text-sm mb-3">🎉 You're in! Here's your personal referral link:</p>
              <div className="flex gap-2 mb-3">
                <Input
                  value={referralLink}
                  readOnly
                  className="bg-white/10 border-white/20 text-white text-xs"
                  data-testid="input-referral-link"
                />
                <Button 
                  onClick={copyToClipboard}
                  variant="secondary"
                  size="sm"
                  data-testid="button-copy-link"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-white/60">
                Share this link to earn rewards! You'll get +10 points for each person who joins using your link.
              </p>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}