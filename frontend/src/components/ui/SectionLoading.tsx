'use client';

import React from 'react';

export const SectionLoading: React.FC<{ height?: string }> = ({ height = '160px' }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full gap-4" style={{ height }}>
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600/40 animate-pulse">
        Memuat...
      </p>
    </div>
  );
};
