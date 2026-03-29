'use client';

import { useSwipeAction } from '@/hooks/useSwipeAction';
import { Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const { bind, style, revealed, handleAction, close } = useSwipeAction({
    onAction: onDelete,
    threshold: 60,
  });

  return (
    <div className="swipe-container">
      {/* Delete action behind */}
      <div className="swipe-actions" onClick={handleAction}>
        <Trash2 size={18} />
      </div>

      {/* Foreground content */}
      <div {...bind()} className="swipe-content" style={style}>
        {children}
      </div>
    </div>
  );
}
