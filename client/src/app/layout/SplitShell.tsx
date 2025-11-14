import { ReactNode } from 'react';

interface SplitShellProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

export function SplitShell({ left, right, className = '' }: SplitShellProps) {
  return (
    <main className={`grid lg:grid-cols-2 min-h-[100dvh] ${className}`}>
      <div className="lg:border-r border-white/10">
        {left}
      </div>
      <div>
        {right}
      </div>
    </main>
  );
}