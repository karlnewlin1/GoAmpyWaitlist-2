import { Card } from '@/shared/ui/atoms';
import { cn } from '@/lib/utils';

export interface StatChipProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export function StatChip({ label, value, trend, icon, className }: StatChipProps) {
  return (
    <Card className={cn('p-4 bg-white/5 border-white/10', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-white/60 mb-1">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        {icon && (
          <div className="ml-3 text-white/40">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={cn(
          'text-xs mt-2',
          trend === 'up' && 'text-green-400',
          trend === 'down' && 'text-red-400',
          trend === 'neutral' && 'text-white/40'
        )}>
          {trend === 'up' && '↑ Trending up'}
          {trend === 'down' && '↓ Trending down'}
          {trend === 'neutral' && '→ No change'}
        </div>
      )}
    </Card>
  );
}