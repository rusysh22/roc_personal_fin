'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Tags, Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-violet-500 to-purple-600' },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight, gradient: 'from-blue-500 to-cyan-500' },
  { href: '/budgets', label: 'Budget', icon: PiggyBank, gradient: 'from-emerald-500 to-teal-500' },
  { href: '/categories', label: 'Kategori', icon: Tags, gradient: 'from-orange-500 to-amber-500' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg shadow-indigo-500/10 border border-white/50 md:hidden hover:scale-105 active:scale-95"
      >
        {mobileOpen ? <X size={22} className="text-gray-700" /> : <Menu size={22} className="text-gray-700" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-72 z-40 transition-transform duration-300 ease-out',
          'bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Decorative orbs */}
        <div className="absolute top-20 -right-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-6 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Rusydani Niken</h1>
              <p className="text-[11px] text-indigo-300/70 font-medium">Personal Finance</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent mb-4" />

        {/* Navigation */}
        <nav className="relative px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-black/10 backdrop-blur-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                  isActive
                    ? `bg-gradient-to-br ${item.gradient} shadow-md`
                    : 'bg-slate-700/50 group-hover:bg-slate-700'
                )}>
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom card */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/10 p-4 backdrop-blur-sm">
            <p className="text-xs text-indigo-300/80 font-medium">Kelola keuanganmu</p>
            <p className="text-[11px] text-indigo-300/50 mt-1">Track pengeluaran & capai target tabungan</p>
          </div>
        </div>
      </aside>
    </>
  );
}
