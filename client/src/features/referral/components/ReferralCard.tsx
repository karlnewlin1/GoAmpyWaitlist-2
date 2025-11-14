import { useState } from 'react';
import { Button } from '@/shared/ui/atoms';
import { ConsoleCard } from '@/shared/ui/molecules';
import { CheckCircle, Copy, Share2 } from 'lucide-react';

interface ReferralCardProps {
  referralLink: string;
  className?: string;
}

export function ReferralCard({ referralLink, className }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnLinkedIn = () => {
    const text = encodeURIComponent('Join me on the GoAmpy waitlist! We\'re building the future of AI productivity.');
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent('Join me on the @GoAmpy waitlist! 🚀 We\'re building the future of AI productivity.');
    const url = encodeURIComponent(referralLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <ConsoleCard title="Your Referral Link" className={className}>
      <div className="space-y-4">
        <div className="p-3 bg-black/20 rounded-lg border border-white/10">
          <code className="text-xs text-white/80 break-all">
            {referralLink}
          </code>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>

          <Button
            onClick={shareOnLinkedIn}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            LinkedIn
          </Button>

          <Button
            onClick={shareOnTwitter}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Twitter
          </Button>
        </div>

        <div className="text-xs text-white/60 text-center">
          Earn 10 points for each friend who joins with your link
        </div>
      </div>
    </ConsoleCard>
  );
}