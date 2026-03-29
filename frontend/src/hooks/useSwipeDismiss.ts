'use client';

import { useRef, useCallback, useState } from 'react';
import { useDrag } from '@use-gesture/react';

interface UseSwipeDismissOptions {
  onDismiss: () => void;
  threshold?: number;
  direction?: 'down' | 'up';
}

export function useSwipeDismiss({
  onDismiss,
  threshold = 120,
  direction = 'down',
}: UseSwipeDismissOptions) {
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], direction: [, dy], active, cancel, first }) => {
      // Only allow downward swipe for 'down' direction
      if (direction === 'down') {
        // Check if content is scrolled - if so, don't capture
        if (first && containerRef.current) {
          const scrollTop = containerRef.current.scrollTop;
          if (scrollTop > 5) {
            cancel();
            return;
          }
        }

        if (my < 0) {
          cancel();
          setOffsetY(0);
          return;
        }
      }

      if (direction === 'up' && my > 0) {
        setOffsetY(0);
        return;
      }

      if (active) {
        setIsDragging(true);
        // Apply resistance when dragging far
        const dampened = Math.sign(my) * Math.min(Math.abs(my), 400) * 0.8;
        setOffsetY(dampened);
      } else {
        setIsDragging(false);
        const absY = Math.abs(my);
        const absVy = Math.abs(vy);

        if (absY > threshold || absVy > 1.5) {
          setIsClosing(true);
          setOffsetY(direction === 'down' ? 600 : -600);
          setTimeout(onDismiss, 250);
        } else {
          setOffsetY(0);
        }
      }
    },
    {
      axis: 'y',
      filterTaps: true,
      from: [0, 0],
      pointer: { touch: true },
    }
  );

  const backdropOpacity = isClosing
    ? 0
    : Math.max(0, 1 - Math.abs(offsetY) / 400);

  const style: React.CSSProperties = {
    transform: `translateY(${offsetY}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return {
    bind,
    style,
    backdropOpacity,
    isClosing,
    containerRef,
  };
}
