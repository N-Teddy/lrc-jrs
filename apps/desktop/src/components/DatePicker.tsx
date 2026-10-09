import {
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  Clock,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';

// ==========================================
// CONSTANTS & HELPERS
// ==========================================

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_NAMES_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

function formatDisplayDate(isoDateStr?: string): string {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length < 3) return isoDateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
    return isoDateStr;
  return `${day} ${MONTH_NAMES_SHORT[month]} ${year}`;
}

function formatDisplayMonthYear(val?: string): string {
  if (!val) return '';
  const parts = val.split('-');
  if (parts.length < 2) return val;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  if (Number.isNaN(year) || Number.isNaN(month)) return val;
  return `${MONTH_NAMES[month]} ${year}`;
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
// 1. DATE PICKER
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
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  id,
  className = '',
  ariaLabel,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view
  const initialDate = value ? new Date(value) : new Date();
  const validInitial = !Number.isNaN(initialDate.getTime());
  const [viewYear, setViewYear] = useState(
    validInitial ? initialDate.getFullYear() : new Date().getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    validInitial ? initialDate.getMonth() : new Date().getMonth(),
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
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setViewMode('days');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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

  // Year range for quick selector (e.g., past 80 years to 5 years in future)
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear + 5; y >= currentYear - 80; y--) {
    yearOptions.push(y);
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Trigger */}
      <div
        id={inputId}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between h-10 px-3.5 rounded-lg border text-xs transition-all cursor-pointer select-none ${
          disabled
            ? 'opacity-60 bg-[#f4ece9] border-[#e8e1dd] cursor-not-allowed'
            : isOpen
              ? 'bg-white border-[#b85028] ring-2 ring-[#b85028]/20 shadow-xs'
              : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] focus:bg-white focus:border-[#b85028]'
        }`}
      >
        <span
          className={`truncate font-medium ${
            value ? 'text-[#1e1b19]' : 'text-[#8a726a]'
          }`}
        >
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-[#8a726a] shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded hover:bg-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] transition-colors"
              title="Clear"
            >
              <X size={12} />
            </button>
          )}
          <CalendarBlank size={16} weight="bold" className="text-[#b85028]" />
        </div>
      </div>

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
                className="px-2 py-1 rounded-md text-xs font-bold text-[#1e1b19] hover:bg-[#faf2ee] hover:text-[#b85028] transition-colors flex items-center gap-1"
              >
                <span>{MONTH_NAMES[viewMonth]}</span>
                <CaretDown size={11} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewMode(viewMode === 'years' ? 'days' : 'years')
                }
                className="px-2 py-1 rounded-md text-xs font-bold text-[#1e1b19] hover:bg-[#faf2ee] hover:text-[#b85028] transition-colors flex items-center gap-1"
              >
                <span>{viewYear}</span>
                <CaretDown size={11} weight="bold" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#57423b] hover:text-[#1e1b19] transition-colors"
                title="Previous month"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#57423b] hover:text-[#1e1b19] transition-colors"
                title="Next month"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* VIEW: Month selector grid */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {MONTH_NAMES_SHORT.map((mName, idx) => {
                const isSelected = viewMonth === idx;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setViewMode('days');
                    }}
                    className={`h-9 rounded-lg text-xs font-bold transition-all ${
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
                    className={`h-8 rounded-lg text-xs font-semibold transition-all ${
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
                {DAY_NAMES_SHORT.map((d) => (
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
                      className={`h-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center relative ${
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
                  Today
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
                    Clear
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

// ==========================================
// 2. MONTH & YEAR PICKER (For Integration Date)
// ==========================================

export interface MonthYearPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  placeholder = 'Select month & year',
  disabled = false,
  id,
  className = '',
  ariaLabel,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialYear = value
    ? parseInt(value.split('-')[0], 10) || new Date().getFullYear()
    : new Date().getFullYear();

  const [viewYear, setViewYear] = useState(initialYear);

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        if (!Number.isNaN(y)) setViewYear(y);
      }
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectMonth = (monthIndex: number) => {
    const formatted = `${viewYear}-${padZero(monthIndex + 1)}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const selectedYear = value ? parseInt(value.split('-')[0], 10) : null;
  const selectedMonth = value ? parseInt(value.split('-')[1], 10) - 1 : null;
  const currentNow = new Date();
  const currentNowStr = `${currentNow.getFullYear()}-${padZero(currentNow.getMonth() + 1)}`;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger */}
      <div
        id={inputId}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between h-10 px-3.5 rounded-lg border text-xs transition-all cursor-pointer select-none ${
          disabled
            ? 'opacity-60 bg-[#f4ece9] border-[#e8e1dd] cursor-not-allowed'
            : isOpen
              ? 'bg-white border-[#b85028] ring-2 ring-[#b85028]/20 shadow-xs'
              : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] focus:bg-white focus:border-[#b85028]'
        }`}
      >
        <span
          className={`truncate font-medium ${
            value ? 'text-[#1e1b19]' : 'text-[#8a726a]'
          }`}
        >
          {value ? formatDisplayMonthYear(value) : placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-[#8a726a] shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded hover:bg-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] transition-colors"
              title="Clear"
            >
              <X size={12} />
            </button>
          )}
          <CalendarBlank size={16} weight="bold" className="text-[#b85028]" />
        </div>
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-64 bg-white rounded-xl border border-[#e8e1dd] shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#f4ece9]">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#57423b] hover:text-[#1e1b19] transition-colors"
              title="Previous Year"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="text-sm font-bold text-[#1e1b19]">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#57423b] hover:text-[#1e1b19] transition-colors"
              title="Next Year"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES_SHORT.map((mShort, idx) => {
              const isSelected =
                selectedYear === viewYear && selectedMonth === idx;
              const isCurrent =
                currentNow.getFullYear() === viewYear &&
                currentNow.getMonth() === idx;

              return (
                <button
                  key={mShort}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`h-9 rounded-lg text-xs font-bold transition-all relative ${
                    isSelected
                      ? 'bg-[#b85028] text-white shadow-xs'
                      : isCurrent
                        ? 'text-[#b85028] bg-[#fff2ee] border border-[#ffdbcf]'
                        : 'text-[#57423b] hover:bg-[#faf2ee] hover:text-[#1e1b19]'
                  }`}
                >
                  {mShort}
                </button>
              );
            })}
          </div>

          {/* Quick bar */}
          <div className="mt-3 pt-2 border-t border-[#f4ece9] flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange(currentNowStr);
                setIsOpen(false);
              }}
              className="font-bold text-[#b85028] hover:underline cursor-pointer"
            >
              This Month
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
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. DATE-TIME PICKER (For Activities)
// ==========================================

export interface DateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date & time',
  disabled = false,
  id,
  className = '',
  ariaLabel,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split date and time
  const [datePart, timePart] = value ? value.split('T') : ['', ''];
  const [hour, setHour] = useState(timePart ? timePart.split(':')[0] : '09');
  const [minute, setMinute] = useState(
    timePart ? timePart.split(':')[1] : '00',
  );

  useEffect(() => {
    if (value?.includes('T')) {
      const [, t] = value.split('T');
      if (t) {
        const [h, m] = t.split(':');
        if (h) setHour(h);
        if (m) setMinute(m);
      }
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      onChange('');
      return;
    }
    const finalTime = `${hour || '09'}:${minute || '00'}`;
    onChange(`${newDate}T${finalTime}`);
  };

  const handleTimeChange = (newHour: string, newMin: string) => {
    setHour(newHour);
    setMinute(newMin);
    const dateToUse =
      datePart ||
      formatDateString(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
      );
    onChange(`${dateToUse}T${newHour}:${newMin}`);
  };

  const displayFormatted = () => {
    if (!value) return '';
    const [d, t] = value.split('T');
    return `${formatDisplayDate(d)}${t ? ` at ${t}` : ''}`;
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger */}
      <div
        id={inputId}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between h-10 px-3.5 rounded-lg border text-xs transition-all cursor-pointer select-none ${
          disabled
            ? 'opacity-60 bg-[#f4ece9] border-[#e8e1dd] cursor-not-allowed'
            : isOpen
              ? 'bg-white border-[#b85028] ring-2 ring-[#b85028]/20 shadow-xs'
              : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] focus:bg-white focus:border-[#b85028]'
        }`}
      >
        <span
          className={`truncate font-medium ${
            value ? 'text-[#1e1b19]' : 'text-[#8a726a]'
          }`}
        >
          {value ? displayFormatted() : placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-[#8a726a] shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded hover:bg-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] transition-colors"
              title="Clear"
            >
              <X size={12} />
            </button>
          )}
          <Clock size={16} weight="bold" className="text-[#b85028]" />
        </div>
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-80 bg-white rounded-xl border border-[#e8e1dd] shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
          <DatePicker
            value={datePart}
            onChange={handleDateChange}
            placeholder="Select date"
            className="mb-3"
          />

          {/* Time Picker Bar */}
          <div className="p-3 bg-[#faf2ee] rounded-lg border border-[#e8e1dd] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#57423b]">
              <Clock size={16} weight="duotone" className="text-[#b85028]" />
              <span>Time:</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={hour}
                onChange={(e) => handleTimeChange(e.target.value, minute)}
                className="h-8 px-2 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#1e1b19] outline-none focus:border-[#b85028]"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = padZero(i);
                  return (
                    <option key={h} value={h}>
                      {h} h
                    </option>
                  );
                })}
              </select>
              <span className="font-bold text-[#8a726a]">:</span>
              <select
                value={minute}
                onChange={(e) => handleTimeChange(hour, e.target.value)}
                className="h-8 px-2 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#1e1b19] outline-none focus:border-[#b85028]"
              >
                {[
                  '00',
                  '05',
                  '10',
                  '15',
                  '20',
                  '25',
                  '30',
                  '35',
                  '40',
                  '45',
                  '50',
                  '55',
                ].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
