'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';

const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  return (
    <div className="mobile-wrapper">
      <div className="desktop-bg" />
      <div className="mobile-container">
        <main className="mobile-content">
          {children}
        </main>
        {!isAuthPage && <BottomNav />}
      </div>
    </div>
  );
}
