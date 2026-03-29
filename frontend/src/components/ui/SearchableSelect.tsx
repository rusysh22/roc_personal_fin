'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, search]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      // Small delay so the modal animates in first
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(true)}
        className={`mobile-input flex items-center justify-between gap-2 text-left disabled:opacity-50 ${className}`}
      >
        <span
          className={`flex-1 truncate text-sm ${selectedOption ? 'font-semibold' : ''}`}
          style={{ color: selectedOption ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              {selectedOption.color && (
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedOption.color }} />
              )}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={16} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
      </button>

      {/* Dropdown Overlay — rendered via portal to escape stacking context */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={containerRef}
            className="w-full max-w-[400px] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col"
            style={{ background: 'var(--color-modal-bg)', maxHeight: '70vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-modal-handle)' }} />
            </div>

            {/* Search Input */}
            <div className="px-4 pt-3 pb-2">
              <div
                className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
                style={{
                  background: 'var(--color-filter-bg)',
                  border: '1px solid var(--color-border-input)',
                }}
              >
                <Search size={16} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="shrink-0">
                    <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 overscroll-contain">
              {/* Empty option for "clear" / placeholder */}
              {placeholder && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                    !value ? 'bg-[var(--color-primary)]/10' : 'active:bg-black/5 dark:active:bg-white/5'
                  }`}
                >
                  <span className="flex-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {placeholder}
                  </span>
                  {!value && <Check size={16} style={{ color: 'var(--color-primary)' }} />}
                </button>
              )}

              {filtered.length > 0 ? (
                filtered.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                        isSelected
                          ? ''
                          : 'active:bg-black/5 dark:active:bg-white/5'
                      }`}
                      style={isSelected ? { background: 'var(--color-primary)', color: '#fff' } : {}}
                    >
                      {option.icon && <span className="text-base shrink-0">{option.icon}</span>}
                      {option.color && (
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                          style={{ background: option.color }}
                        />
                      )}
                      <span
                        className={`flex-1 text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}
                        style={isSelected ? { color: '#fff' } : { color: 'var(--color-text-primary)' }}
                      >
                        {option.label}
                      </span>
                      {isSelected && <Check size={16} className="shrink-0 text-white" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Tidak ditemukan
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
