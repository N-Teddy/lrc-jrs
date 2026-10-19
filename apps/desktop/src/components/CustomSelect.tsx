import { CaretDown, Check } from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useClickOutside } from '../hooks/use-click-outside';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  selectedLabel?: string;
  description?: string;
  badge?: React.ReactNode;
  icon?: React.ElementType;
  disabled?: boolean;
  level?: number; // Tree indentation level (0 = root, 1 = subfolder, 2 = child, etc.)
}

export interface CustomSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'toolbar' | 'form';
  size?: 'sm' | 'md' | 'lg';
  menuPlacement?: 'bottom' | 'top';
  menuClassName?: string;
  id?: string;
  ariaLabel?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  menuPlacement = 'bottom',
  menuClassName = '',
  variant = 'toolbar',
  size = 'md',
  id,
  ariaLabel,
}: CustomSelectProps<T>) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  // Variant styling
  const variantStyles =
    variant === 'form'
      ? 'bg-[#faf2ee] focus-within:bg-white border-[#e8e1dd] hover:border-[#ddc0b7] focus-within:border-[#b85028] focus-within:ring-2 focus-within:ring-[#b85028]/20'
      : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] hover:border-[#ddc0b7]';

  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    md: 'h-10 px-3.5 text-xs rounded-md',
    lg: 'h-11 px-4 text-sm rounded-md',
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 border font-semibold text-[#1e1b19] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs ${variantStyles} ${sizeStyles} ${
          isOpen ? 'ring-2 ring-[#b85028]/20 border-[#b85028]' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon
              size={16}
              className="text-[#8a726a] shrink-0"
            />
          )}
          <span className="truncate">
            {selectedOption
              ? selectedOption.selectedLabel || selectedOption.label
              : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0">{selectedOption.badge}</span>
          )}
        </div>
        <CaretDown
          size={14}
          weight="bold"
          className={`text-[#8a726a] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#b85028]' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 ${
            menuPlacement === 'top'
              ? 'bottom-[calc(100%+4px)]'
              : 'top-[calc(100%+4px)]'
          } ${
            menuClassName || 'min-w-[210px] w-full'
          } max-h-64 overflow-y-auto bg-white rounded-md border border-[#e8e1dd] shadow-xl p-1 animate-in fade-in zoom-in-95 duration-150 focus:outline-none`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            const level = option.level || 0;
            return (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => handleSelect(option)}
                style={{
                  paddingLeft: level > 0 ? `${level * 16 + 10}px` : undefined,
                }}
                className={`w-full text-left flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  option.disabled
                    ? 'opacity-40 cursor-not-allowed text-[#8a726a]'
                    : isSelected
                      ? 'bg-[#fff2ee] text-[#b85028] font-bold'
                      : 'text-[#1e1b19] hover:bg-[#faf2ee] hover:text-[#b85028]'
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Visual tree branch connector for nested levels */}
                    {level > 0 && (
                      <span className="inline-flex items-center justify-center shrink-0 w-3 h-3 text-[#b09e97] -ml-0.5 mr-0.5">
                        <span className="w-2.5 h-2.5 border-b-2 border-l-2 border-[#cfbeba] rounded-bl-xs" />
                      </span>
                    )}

                    {option.icon && (
                      <option.icon
                        size={15}
                        weight={isSelected ? 'fill' : 'regular'}
                        className={`shrink-0 ${
                          isSelected ? 'text-[#b85028]' : 'text-[#8a726a]'
                        }`}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                    {option.badge && (
                      <span className="shrink-0">{option.badge}</span>
                    )}
                  </div>
                  {option.description && level === 0 && (
                    <span className="text-[10px] font-normal text-[#8a726a] mt-0.5 truncate">
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check
                    size={14}
                    weight="bold"
                    className="text-[#b85028] shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
