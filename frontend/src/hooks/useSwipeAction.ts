'use client';

import { useState, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';

interface UseSwipeActionOptions {
  onAction: () => void;
  threshold?: number;
}

export function useSwipeAction({ onAction, threshold = 80 }: UseSwipeActionOptions) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const bind = useDrag(
    ({ movement: [mx], active, velocity: [vx], direction: [dx] }) => {
      if (active) {
        setIsDragging(true);
        // Only allow swipe left (negative)
        const clamped = Math.min(0, Math.max(mx, -120));
        setOffsetX(clamped);
      } else {
        setIsDragging(false);
        const absMx = Math.abs(mx);

        if (absMx > threshold || (vx > 1 && dx < 0)) {
          setRevealed(true);
          setOffsetX(-80);
        } else {
          setRevealed(false);
          setOffsetX(0);
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      from: [revealed ? -80 : 0, 0],
      pointer: { touch: true },
    }
  );

  const close = useCallback(() => {
    setRevealed(false);
    setOffsetX(0);
  }, []);

  const handleAction = useCallback(() => {
    onAction();
    close();
  }, [onAction, close]);

  const style: React.CSSProperties = {
    transform: `translateX(${offsetX}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return {
    bind,
    style,
    revealed,
    close,
    handleAction,
  };
}
