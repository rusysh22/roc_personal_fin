'use client';

import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center overflow-hidden" style={{ background: 'var(--color-bg-app)' }}>
      {/* Decorative Orbs (Subtle) */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary-light), transparent 70%)' }} />

      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Logo / Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-teal-600 via-teal-500 to-teal-400 flex items-center justify-center shadow-[0_12px_40px_rgba(13,148,136,0.3)] animate-[logoPulse_3s_ease-in-out_infinite] z-10">
            <span className="text-3xl font-black text-white tracking-tighter">RN</span>
          </div>
          <div className="absolute inset-[-10px] rounded-[36px] bg-[radial-gradient(circle,rgba(13,148,136,0.2),transparent_70%)] animate-[logoGlow_3s_ease-in-out_infinite] -z-10" />
        </div>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-[pulse_1.5s_ease-in-out_infinite_0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-[pulse_1.5s_ease-in-out_infinite_0.4s]" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600/60 dark:text-teal-400/40">
            Menyelaraskan Data
          </p>
        </div>
      </div>
    </div>
  );
};
