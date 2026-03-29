'use client';

import { useSwipeDismiss } from '@/hooks/useSwipeDismiss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const { bind, style, backdropOpacity, containerRef } = useSwipeDismiss({
    onDismiss: onClose,
    threshold: 100,
    direction: 'down',
  });

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{ opacity: backdropOpacity }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        {...bind()}
        ref={containerRef}
        className="modal-sheet animate-in"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="modal-handle" />

        {/* Title */}
        <div className="px-5 pb-4">
          <h2 id="modal-title" className="text-lg font-bold" style={{ color: 'var(--color-text-card-title)' }}>{title}</h2>
        </div>

        {/* Content */}
        <div className="px-5 pb-4">{children}</div>
      </div>
    </div>
  );
}
