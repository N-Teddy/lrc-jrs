import {
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useClickOutside } from '../hooks/use-click-outside';
import { useTranslation } from '../i18n';
import { translations } from '../i18n/translations';

// ==========================================
// HELPERS
// ==========================================

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDateString(
  year: number,
  monthIndex: number,
  day: number,
): string {
  return `${year}-${padZero(monthIndex + 1)}-${padZero(day)}`;
}

function formatDisplayDate(
  isoDateStr: string | undefined,
  shortMonths: readonly string[],
): string {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length < 3) return isoDateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
    return isoDateStr;
  const monthName = shortMonths[month] || shortMonths[0];
  return `${day} ${monthName} ${year}`;
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, monthIndex: number): number {
  // Monday = 0, Sunday = 6
  const day = new Date(year, monthIndex, 1).getDay();
  return (day + 6) % 7;
}

// ==========================================
// TRIGGER COMPONENT
// ==========================================

interface PickerTriggerProps {
  inputId?: string;
  disabled?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  ariaLabel?: string;
  placeholder?: string;
  displayText: string;
  hasValue: boolean;
  onClear: () => void;
  icon?: React.ReactNode;
}

const PickerTrigger: React.FC<PickerTriggerProps> = ({
  inputId,
  disabled,
  isOpen,
  onToggle,
  ariaLabel,
  placeholder,
  displayText,
  hasValue,
  onClear,
  icon,
}) => (
  <div
    id={inputId}
    role="combobox"
    tabIndex={disabled ? -1 : 0}
    aria-label={ariaLabel || placeholder}
    aria-expanded={isOpen}
    onClick={() => !disabled && onToggle()}
    onKeyDown={(e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault();
        onToggle();
      }
    }}
    className={`w-full flex items-center justify-between h-10 px-3.5 rounded-md border text-xs transition-all cursor-pointer select-none ${
      disabled
        ? 'opacity-60 bg-[#f4ece9] border-[#e8e1dd] cursor-not-allowed'
        : isOpen
          ? 'bg-white border-[#b85028] ring-2 ring-[#b85028]/20 shadow-xs'
          : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] focus:bg-white focus:border-[#b85028]'
    }`}
  >
    <span
      className={`truncate font-medium ${
        hasValue ? 'text-[#1e1b19]' : 'text-[#8a726a]'
      }`}
    >
      {displayText}
    </span>
    <div className="flex items-center gap-1.5 text-[#8a726a] shrink-0">
      {hasValue && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-1 rounded hover:bg-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] transition-colors"
          title="Clear"
        >
          <X size={12} />
        </button>
      )}
      {icon ?? (
        <CalendarBlank size={16} weight="bold" className="text-[#b85028]" />
      )}
    </div>
  </div>
);

// ==========================================
// DATE PICKER COMPONENT
// ==========================================

export interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  disabled = false,
  id,
  className = '',
  ariaLabel,
}) => {
  const { t, language } = useTranslation();
  const datePickerLoc = translations[language].datePicker;
  const monthNames = datePickerLoc.months;
  const monthNamesShort = datePickerLoc.monthsShort;
  const dayNamesShort = datePickerLoc.daysShort;

  const defaultPlaceholder = placeholder || t('datePicker.selectDate');

  const generatedId = useId();
  const inputId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const containerRef = useRef<HTMLDivElement>(null);

  // Default to 18 years ago for birth date convenience
  const currentYear = new Date().getFullYear();
  const initialDate = value ? new Date(value) : null;
  const validInitial = initialDate && !Number.isNaN(initialDate.getTime());
  const [viewYear, setViewYear] = useState(
    validInitial ? initialDate.getFullYear() : currentYear - 18,
  );
  const [viewMonth, setViewMonth] = useState(
    validInitial ? initialDate.getMonth() : 0,
  );

  // Sync view when value changes
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value]);

  // Click outside to close
  useClickOutside(
    containerRef,
    () => {
      setIsOpen(false);
      setViewMode('days');
    },
    isOpen,
  );

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = formatDateString(viewYear, viewMonth, day);
    onChange(formatted);
    setIsOpen(false);
    setViewMode('days');
  };

  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfWeek(viewYear, viewMonth);
  const daysInPrevMonth = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  );

  const todayStr = formatDateString(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );

  // Year range for quick selector (past 80 years to current year)
  const yearOptions: number[] = [];
  for (let y = currentYear; y >= currentYear - 80; y--) {
    yearOptions.push(y);
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Trigger */}
      <PickerTrigger
        inputId={inputId}
        disabled={disabled}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        ariaLabel={ariaLabel}
        placeholder={defaultPlaceholder}
        displayText={
          value ? formatDisplayDate(value, monthNamesShort) : defaultPlaceholder
        }
        hasValue={Boolean(value)}
        onClear={() => onChange('')}
      />

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 bg-white rounded-xl border border-[#e8e1dd] shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#f4ece9]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setViewMode(viewMode === 'months' ? 'days' : 'months')
                }
                className="px-2 py-1 rounded-md text-xs font-bold text-[#1e1b19] hover:bg-[#faf2ee] hover:text-[#b85028] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{monthNames[viewMonth]}</span>
                <CaretDown size={11} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewMode(viewMode === 'years' ? 'days' : 'years')
                }
                className="px-2 py-1 rounded-md text-xs font-bold text-[#1e1b19] hover:bg-[#faf2ee] hover:text-[#b85028] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{viewYear}</span>
                <CaretDown size={11} weight="bold" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#57423b] hover:text-[#1e1b19] transition-colors cursor-pointer"
                title={t('datePicker.prevMonth')}
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#57423b] hover:text-[#1e1b19] transition-colors cursor-pointer"
                title={t('datePicker.nextMonth')}
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* VIEW: Month selector grid */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {monthNamesShort.map((mName, idx) => {
                const isSelected = viewMonth === idx;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setViewMode('days');
                    }}
                    className={`h-9 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#b85028] text-white shadow-xs'
                        : 'text-[#57423b] hover:bg-[#faf2ee] hover:text-[#1e1b19]'
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW: Year selector scroll list */}
          {viewMode === 'years' && (
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto py-1 pr-1">
              {yearOptions.map((y) => {
                const isSelected = viewYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setViewMode('days');
                    }}
                    className={`h-8 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#b85028] text-white font-bold shadow-xs'
                        : 'text-[#57423b] hover:bg-[#faf2ee] hover:text-[#1e1b19]'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW: Days grid */}
          {viewMode === 'days' && (
            <>
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {dayNamesShort.map((d) => (
                  <div
                    key={d}
                    className="h-6 flex items-center justify-center text-[10px] font-bold text-[#8a726a] uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Previous month filler days */}
                {Array.from({ length: firstDayOffset }).map((_, idx) => {
                  const dayNum = daysInPrevMonth - firstDayOffset + idx + 1;
                  return (
                    <div
                      key={`prev-${idx}`}
                      className="h-8 flex items-center justify-center text-xs text-[#c4b5af] select-none"
                    >
                      {dayNum}
                    </div>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dateStr = formatDateString(viewYear, viewMonth, day);
                  const isSelected = value === dateStr;
                  const isToday = todayStr === dateStr;
                  const isDisabled = Boolean(
                    (minDate && dateStr < minDate) ||
                      (maxDate && dateStr > maxDate),
                  );

                  return (
                    <button
                      key={`curr-${day}`}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectDay(day)}
                      className={`h-8 rounded-md text-xs font-medium transition-all flex items-center justify-center relative cursor-pointer ${
                        isSelected
                          ? 'bg-[#b85028] text-white font-bold shadow-xs'
                          : isToday
                            ? 'text-[#b85028] font-bold bg-[#fff2ee] border border-[#ffdbcf]'
                            : isDisabled
                              ? 'text-[#c4b5af] cursor-not-allowed opacity-40'
                              : 'text-[#1e1b19] hover:bg-[#faf2ee] hover:text-[#b85028]'
                      }`}
                    >
                      {day}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#b85028]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Quick Bar */}
              <div className="mt-3 pt-2 border-t border-[#f4ece9] flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setViewYear(now.getFullYear());
                    setViewMonth(now.getMonth());
                    handleSelectDay(now.getDate());
                  }}
                  className="font-bold text-[#b85028] hover:underline cursor-pointer"
                >
                  {t('datePicker.today')}
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setIsOpen(false);
                    }}
                    className="font-medium text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
                  >
                    {t('datePicker.clear')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
