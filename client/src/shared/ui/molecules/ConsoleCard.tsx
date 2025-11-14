import { Card } from '@/shared/ui/atoms';
import { cn } from '@/lib/utils';

export interface ConsoleCardProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

export function ConsoleCard({ title, children, variant = 'default', className }: ConsoleCardProps) {
  return (
    <Card className={cn(
      'p-4',
      variant === 'primary' && 'bg-primary/10 border-primary/20',
      variant === 'secondary' && 'bg-white/10 border-white/20',
      variant === 'default' && 'bg-white/5 border-white/10',
      className
    )}>
      {title && (
        <h3 className="font-medium mb-3 text-white/90">{title}</h3>
      )}
      {children}
    </Card>
  );
}