import { cn } from '@/lib/utils';

export interface ChipProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

export function Chip({ label, value, variant = 'default', className }: ChipProps) {
  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg',
      variant === 'primary' && 'bg-white/10 border border-white/20',
      variant === 'secondary' && 'bg-white/5 border border-white/10',
      variant === 'default' && 'bg-white/5',
      className
    )}>
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}