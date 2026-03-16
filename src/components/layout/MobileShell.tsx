import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface MobileShellProps {
  children: ReactNode;
  showNav?: boolean;
}

export function MobileShell({ children, showNav = true }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={`flex-1 ${showNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
