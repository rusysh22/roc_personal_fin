'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, hover = false, gradient, style }: CardProps) {
  return (
    <div
      className={cn(
        'mobile-card',
        gradient
          ? `bg-gradient-to-br ${gradient} text-white`
          : '',
        hover && 'active:scale-[0.98] cursor-pointer',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
}

export function StatCard({ label, value, icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <div
      className={cn(
        'animate-fade-in-up rounded-2xl p-4 bg-gradient-to-br shadow-sm transition-all duration-300 active:scale-[0.97]',
        gradient
      )}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-white/70">{label}</p>
          <p className="text-base font-bold text-white tracking-tight">{value}</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}
