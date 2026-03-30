'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string | number;
}

/**
 * A custom input component that formats the display value with Indonesian thousands separators (dots).
 * It preserves the cursor position for a better user experience.
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  required = false,
  disabled = false,
  min,
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Format a raw string or number into a dotted representation
  const formatValue = (val: string | number): string => {
    // Strip decimal portion first (backend sends "2837582.00"), then remove non-digits
    const stripped = String(val).replace(/\.(\d{2})$/, '').replace(/\D/g, '');
    if (!stripped) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(stripped, 10));
  };

  // Clean raw value: remove decimal portion before extracting digits
  const toRawValue = (val: string | number): string => {
    return String(val).replace(/\.(\d{2})$/, '').replace(/\D/g, '');
  };

  // Sync state whenever the external value changes
  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const rawValue = inputValue.replace(/\D/g, '');
    
    // Store current cursor position to restore later
    const selectionStart = e.target.selectionStart || 0;
    const oldDisplayValue = displayValue;
    
    // Notify parent with the raw numeric value
    onChange(rawValue);
    
    // Update local display value immediately for responsiveness
    const newDisplayValue = formatValue(rawValue);
    setDisplayValue(newDisplayValue);

    // After state update, calculate and restore cursor position
    setTimeout(() => {
      if (inputRef.current) {
        // Simple logic: if a dot was added before the cursor, shift it right
        const dotCountBefore = (oldDisplayValue.substring(0, selectionStart).match(/\./g) || []).length;
        const newDotCountBefore = (newDisplayValue.substring(0, selectionStart).match(/\./g) || []).length;
        const diff = newDotCountBefore - dotCountBefore;
        
        inputRef.current.setSelectionRange(selectionStart + diff, selectionStart + diff);
      }
    }, 0);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
      min={min}
    />
  );
};
