import {
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
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
  clearLabel?: string;
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
  clearLabel = 'Clear',
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
    className={`w-full flex items-center justify-between h-11 px-3.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer select-none ${
      disabled
        ? 'opacity-60 bg-[#F3EFEA] border-[#E6DFD5] cursor-not-allowed'
        : isOpen
          ? 'bg-white border-[#B85028] ring-3 ring-[#B85028]/12 shadow-xs'
          : 'bg-white hover:border-[#C8BEB4] border-[#E0D7CE] focus:border-[#B85028] focus:ring-3 focus:ring-[#B85028]/12'
    }`}
  >
    <span
      className={`truncate font-medium ${
        hasValue ? 'text-[#23201E]' : 'text-[#A89F95]'
      }`}
    >
      {displayText}
    </span>
    <div className="flex items-center gap-1.5 text-[#8C847C] shrink-0">
      {hasValue && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-1 rounded-md hover:bg-[#F3EFEA] text-[#8C847C] hover:text-[#23201E] transition-colors"
          title={clearLabel}
          aria-label={clearLabel}
        >
          <X size={14} />
        </button>
      )}
      {icon ?? (
        <CalendarBlank size={18} weight="bold" className="text-[#B85028]" />
      )}
    </div>
  </div>
);

// ==========================================
// DATE PICKER COMPONENT (Mobile Bottom Sheet)
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  // Year limit enforcement: never exceed current year
  const currentYear = new Date().getFullYear();
  const maxYear = maxDate ? parseInt(maxDate.split('-')[0], 10) : currentYear;
  const effectiveMaxYear = Math.min(maxYear, currentYear);

  const initialDate = value ? new Date(value) : null;
  const validInitial = initialDate && !Number.isNaN(initialDate.getTime());
  const [viewYear, setViewYear] = useState(
    validInitial
      ? Math.min(initialDate.getFullYear(), effectiveMaxYear)
      : Math.min(currentYear - 18, effectiveMaxYear),
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
          setViewYear(Math.min(y, effectiveMaxYear));
          setViewMonth(m);
        }
      }
    }
  }, [value, effectiveMaxYear]);

  // Prevent background scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Scroll to active year when year selector opens
  useEffect(() => {
    if (isOpen && viewMode === 'years' && yearListRef.current) {
      const selectedEl = yearListRef.current.querySelector(
        '[data-selected="true"]',
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [isOpen, viewMode]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  // Check if navigating to next month is disabled because it would exceed currentYear or maxDate
  const isNextDisabled = Boolean(
    viewYear > effectiveMaxYear ||
      (viewYear === effectiveMaxYear && viewMonth === 11) ||
      (maxDate && formatDateString(viewYear, viewMonth + 1, 1) > maxDate),
  );

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNextDisabled) return;
    if (viewMonth === 11) {
      if (viewYear >= effectiveMaxYear) return;
      setViewMonth(0);
      setViewYear((prev) => Math.min(prev + 1, effectiveMaxYear));
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    if (viewYear > effectiveMaxYear) return;
    const formatted = formatDateString(viewYear, viewMonth, day);
    if (maxDate && formatted > maxDate) return;
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
  for (let y = effectiveMaxYear; y >= effectiveMaxYear - 80; y--) {
    yearOptions.push(y);
  }

  return (
    <div className={`relative w-full ${className}`}>
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
        clearLabel={t('datePicker.clear')}
      />

      {/* Native Mobile Bottom Sheet */}
      {isOpen && (
        <>
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet Modal Container */}
          <div
            ref={sheetRef}
            className="fixed inset-x-0 bottom-0 z-50 w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] p-4 sm:p-5 border-t border-[#E8E1DD] animate-in slide-in-from-bottom duration-250 flex flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-[#DCD4C8] rounded-full mx-auto mb-3 shrink-0" />

            {/* Header: Clear, Title, Done */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F4ECE9] shrink-0">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs font-semibold text-[#8C847C] hover:text-[#23201E] px-2 py-1 rounded-md cursor-pointer"
              >
                {t('datePicker.clear')}
              </button>

              <h3 className="text-sm font-bold text-[#23201E]">
                {t('datePicker.selectBirthDate')}
              </h3>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-[#B85028] hover:text-[#A44520] px-3 py-1 rounded-full bg-[#B85028]/10 cursor-pointer"
              >
                {t('datePicker.done')}
              </button>
            </div>

            {/* Selector Mode Navigation Pills: [Month Year] | [Year selector] */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode(viewMode === 'months' ? 'days' : 'months')
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'months'
                      ? 'bg-[#B85028] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#23201E] hover:bg-[#F3EFEA]'
                  }`}
                >
                  <span>{monthNames[viewMonth]}</span>
                  <CaretDown size={11} weight="bold" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewMode(viewMode === 'years' ? 'days' : 'years')
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'years'
                      ? 'bg-[#B85028] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#23201E] hover:bg-[#F3EFEA]'
                  }`}
                >
                  <span>{viewYear}</span>
                  <CaretDown size={11} weight="bold" />
                </button>
              </div>

              {viewMode === 'days' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-full hover:bg-[#FAF7F2] flex items-center justify-center text-[#5C554F] hover:text-[#23201E] transition-colors cursor-pointer"
                    title={t('datePicker.prevMonth')}
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>
                  <button
                    type="button"
                    disabled={isNextDisabled}
                    onClick={handleNextMonth}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isNextDisabled
                        ? 'opacity-25 cursor-not-allowed text-[#C4B5AF]'
                        : 'hover:bg-[#FAF7F2] text-[#5C554F] hover:text-[#23201E] cursor-pointer'
                    }`}
                    title={t('datePicker.nextMonth')}
                  >
                    <CaretRight size={16} weight="bold" />
                  </button>
                </div>
              )}
            </div>

            {/* VIEW 1: Scrollable Year Selector (Native Mobile Scroll) */}
            {viewMode === 'years' && (
              <div className="space-y-2">
                <p className="text-[11px] text-center text-[#8C847C]">
                  {t('datePicker.scrollYearHint')}
                </p>
                <div
                  ref={yearListRef}
                  className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto overscroll-contain py-1 px-1"
                >
                  {yearOptions.map((y) => {
                    const isSelected = viewYear === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        data-selected={isSelected ? 'true' : 'false'}
                        onClick={() => {
                          setViewYear(Math.min(y, effectiveMaxYear));
                          setViewMode('days');
                        }}
                        className={`h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#B85028] text-white font-bold shadow-xs'
                            : 'bg-[#FAF7F2] hover:bg-[#F3EFEA] text-[#23201E]'
                        }`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: Month Grid */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {monthNamesShort.map((mName, idx) => {
                  const isSelected = viewMonth === idx;
                  const isMonthDisabled = Boolean(
                    maxDate && formatDateString(viewYear, idx, 1) > maxDate,
                  );
                  return (
                    <button
                      key={mName}
                      type="button"
                      disabled={isMonthDisabled}
                      onClick={() => {
                        setViewMonth(idx);
                        setViewMode('days');
                      }}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#B85028] text-white shadow-xs'
                          : isMonthDisabled
                            ? 'opacity-25 cursor-not-allowed text-[#C4B5AF]'
                            : 'bg-[#FAF7F2] text-[#5C554F] hover:bg-[#F3EFEA] hover:text-[#23201E]'
                      }`}
                    >
                      {monthNames[idx]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* VIEW 3: Calendar Days Grid */}
            {viewMode === 'days' && (
              <>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {dayNamesShort.map((d) => (
                    <div
                      key={d}
                      className="h-6 flex items-center justify-center text-[10px] font-bold text-[#8C847C] uppercase"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Previous month filler days */}
                  {Array.from({ length: firstDayOffset }).map((_, idx) => {
                    const dayNum = daysInPrevMonth - firstDayOffset + idx + 1;
                    return (
                      <div
                        key={`prev-${idx}`}
                        className="h-10 flex items-center justify-center text-xs text-[#DCD4C8] select-none"
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
                        className={`h-10 rounded-xl text-xs font-semibold transition-all flex items-center justify-center relative cursor-pointer ${
                          isSelected
                            ? 'bg-[#B85028] text-white font-bold shadow-xs'
                            : isToday
                              ? 'text-[#B85028] font-bold bg-[#FFF2EE] border border-[#FFDBCF]'
                              : isDisabled
                                ? 'text-[#C4B5AF] cursor-not-allowed opacity-30'
                                : 'text-[#23201E] hover:bg-[#FAF7F2] hover:text-[#B85028]'
                        }`}
                      >
                        {day}
                        {isToday && !isSelected && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#B85028]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Quick Bar: Today */}
                <div className="mt-3 pt-2.5 border-t border-[#F4ECE9] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setViewYear(
                        Math.min(now.getFullYear(), effectiveMaxYear),
                      );
                      setViewMonth(now.getMonth());
                      handleSelectDay(now.getDate());
                    }}
                    className="font-bold text-[#B85028] hover:underline cursor-pointer"
                  >
                    {t('datePicker.today')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('years')}
                    className="font-medium text-[#8C847C] hover:text-[#23201E] cursor-pointer"
                  >
                    {t('datePicker.scrollYearHint')} →
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
