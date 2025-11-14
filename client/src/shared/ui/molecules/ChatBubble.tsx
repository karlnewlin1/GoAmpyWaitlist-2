import { cn } from '@/lib/utils';
import { Card } from '@/shared/ui/atoms';

export interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'bot';
  timestamp?: string;
  className?: string;
}

export function ChatBubble({ message, sender, timestamp, className }: ChatBubbleProps) {
  return (
    <div className={cn(
      'flex',
      sender === 'user' ? 'justify-end' : 'justify-start',
      className
    )}>
      <Card className={cn(
        'p-4 max-w-md',
        sender === 'user' 
          ? 'bg-primary/10 border-primary/20' 
          : 'bg-white/5 border-white/10'
      )}>
        <p className="text-sm">{message}</p>
        {timestamp && (
          <span className="text-xs text-white/40 mt-2 block">{timestamp}</span>
        )}
      </Card>
    </div>
  );
}