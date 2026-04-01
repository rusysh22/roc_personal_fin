'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, PiggyBank, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Beranda', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budget', icon: PiggyBank },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/settings', label: 'Lainnya', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Menu utama">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn('bottom-nav-item', isActive && 'active')}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <div className={cn('bottom-nav-icon', isActive && 'active')}>
              <item.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn('bottom-nav-label', isActive && 'active')}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
