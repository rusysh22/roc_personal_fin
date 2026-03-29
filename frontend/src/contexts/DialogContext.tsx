'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, Loader2 } from 'lucide-react';

// ====== Types ======
type DialogType = 'alert' | 'confirm' | 'prompt';
type DialogVariant = 'info' | 'success' | 'error' | 'warning';

interface DialogConfig {
  type: DialogType;
  title: string;
  message?: string;
  variant?: DialogVariant;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

interface DialogState extends DialogConfig {
  isOpen: boolean;
}

interface DialogContextType {
  showAlert: (title: string, options?: { message?: string; variant?: DialogVariant }) => Promise<void>;
  showConfirm: (title: string, options?: { message?: string; variant?: DialogVariant; confirmText?: string; cancelText?: string }) => Promise<boolean>;
  showPrompt: (title: string, options?: { message?: string; placeholder?: string; defaultValue?: string }) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType>({
  showAlert: async () => {},
  showConfirm: async () => false,
  showPrompt: async () => null,
});

// ====== Provider ======
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false, type: 'alert', title: '',
  });
  const [inputValue, setInputValue] = useState('');
  const resolveRef = useRef<((value: any) => void) | null>(null);

  const open = useCallback((config: DialogConfig): Promise<any> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setInputValue(config.defaultValue || '');
      setDialog({ ...config, isOpen: true });
    });
  }, []);

  const close = useCallback((result: any) => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const showAlert = useCallback(
    (title: string, options?: { message?: string; variant?: DialogVariant }) =>
      open({ type: 'alert', title, ...options }),
    [open]
  );

  const showConfirm = useCallback(
    (title: string, options?: { message?: string; variant?: DialogVariant; confirmText?: string; cancelText?: string }) =>
      open({ type: 'confirm', title, variant: 'warning', ...options }),
    [open]
  );

  const showPrompt = useCallback(
    (title: string, options?: { message?: string; placeholder?: string; defaultValue?: string }) =>
      open({ type: 'prompt', title, ...options }),
    [open]
  );

  const variant = dialog.variant || 'info';
  const variantConfig = {
    info: { icon: Info, color: '#0d9488', bgClass: 'bg-teal-50 dark:bg-teal-500/10', textClass: 'text-teal-500' },
    success: { icon: CheckCircle2, color: '#10b981', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10', textClass: 'text-emerald-500' },
    error: { icon: AlertTriangle, color: '#ef4444', bgClass: 'bg-red-50 dark:bg-red-500/10', textClass: 'text-red-500' },
    warning: { icon: AlertTriangle, color: '#f59e0b', bgClass: 'bg-amber-50 dark:bg-amber-500/10', textClass: 'text-amber-500' },
  };
  const vc = variantConfig[variant];
  const Icon = vc.icon;

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      {/* Dialog overlay */}
      {dialog.isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => {
            if (dialog.type === 'alert') close(undefined);
            else if (dialog.type === 'confirm') close(false);
            else close(null);
          }}
        >
          <div
            className="w-full max-w-[400px] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-slide-up"
            style={{ background: 'var(--color-modal-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-modal-handle)' }} />
            </div>

            <div className="px-6 pt-4 pb-6">
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${vc.bgClass} flex items-center justify-center mx-auto mb-4`}>
                <Icon size={26} className={vc.textClass} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {dialog.title}
              </h3>

              {/* Message */}
              {dialog.message && (
                <p className="text-sm text-center mb-4 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {dialog.message}
                </p>
              )}

              {/* Prompt input */}
              {dialog.type === 'prompt' && (
                <div className="mb-5 mt-3">
                  <input
                    type="text"
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputValue.trim()) close(inputValue.trim());
                    }}
                    placeholder={dialog.placeholder || ''}
                    className="mobile-input text-center"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className={`flex gap-3 ${!dialog.message && dialog.type === 'alert' ? 'mt-4' : 'mt-2'}`}>
                {dialog.type === 'alert' ? (
                  <button
                    onClick={() => close(undefined)}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all"
                    style={{ background: `linear-gradient(135deg, ${vc.color}, ${vc.color}dd)` }}
                  >
                    OK
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (dialog.type === 'confirm') close(false);
                        else close(null);
                      }}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                      style={{ background: 'var(--color-filter-bg)', color: 'var(--color-text-primary)' }}
                    >
                      {dialog.cancelText || 'Batal'}
                    </button>
                    <button
                      onClick={() => {
                        if (dialog.type === 'confirm') close(true);
                        else if (inputValue.trim()) close(inputValue.trim());
                      }}
                      disabled={dialog.type === 'prompt' && !inputValue.trim()}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40"
                      style={{
                        background: variant === 'warning' || variant === 'error'
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : `linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))`,
                        boxShadow: variant === 'warning' || variant === 'error'
                          ? '0 4px 16px rgba(239, 68, 68, 0.3)'
                          : '0 4px 16px rgba(13, 148, 136, 0.3)',
                      }}
                    >
                      {dialog.confirmText || (dialog.type === 'prompt' ? 'Simpan' : 'Ya, Lanjutkan')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export const useDialog = () => useContext(DialogContext);
