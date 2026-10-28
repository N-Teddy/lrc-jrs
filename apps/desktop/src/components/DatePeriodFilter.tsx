import { useTranslation } from '@jrs/client-core';
import {
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface DatePeriodFilterProps {
  year: number | undefined;
  month: number | undefined; // 1 to 12
  onPeriodChange: (year: number | undefined, month: number | undefined) => void;
  availableYears?: number[];
  size?: 'sm' | 'md';
  className?: string;
  placeholder?: string;
  align?: 'left' | 'right';
}

type PeriodMode = 'all' | 'year' | 'month';

export const DatePeriodFilter: React.FC<DatePeriodFilterProps> = ({
  year,
  month,
  onPeriodChange,
  availableYears = [2026, 2025, 2024],
  size = 'md',
  className = '',
  placeholder,
  align,
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [computedAlign, setComputedAlign] = useState<'left' | 'right'>(
    align || 'left',
  );

  const determineAlignment = useCallback((): 'left' | 'right' => {
    if (align) return align;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 288;
      const spaceRight = window.innerWidth - rect.left;
      if (spaceRight < popoverWidth + 24 || rect.left > window.innerWidth / 2) {
        return 'right';
      }
    }
    return 'left';
  }, [align]);

  // Synchronize alignment on open and resize
  useEffect(() => {
    if (align) {
      setComputedAlign(align);
      return;
    }
    if (isOpen) {
      setComputedAlign(determineAlignment());
    }
  }, [isOpen, align, determineAlignment]);

  useEffect(() => {
    if (!isOpen || align) return;
    const handleResize = () => {
      setComputedAlign(determineAlignment());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, align, determineAlignment]);

  // Default active year in popover view
  const currentDefaultYear = availableYears[0] || 2026;
  const [viewYear, setViewYear] = useState<number>(year || currentDefaultYear);

  // Sync view year when external year prop changes
  useEffect(() => {
    if (year) {
      setViewYear(year);
    }
  }, [year]);

  // Determine current active mode
  const currentMode: PeriodMode = useMemo(() => {
    if (month !== undefined && year !== undefined) return 'month';
    if (year !== undefined) return 'year';
    return 'all';
  }, [year, month]);

  const [activeTab, setActiveTab] = useState<PeriodMode>(
    currentMode === 'all' ? 'month' : currentMode,
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Formatted months based on current language
  const months = useMemo(() => {
    const lang = i18n.language || 'en';
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2026, i, 1);
      const shortName = date.toLocaleString(lang, { month: 'short' });
      const fullName = date.toLocaleString(lang, { month: 'long' });
      return {
        monthNum: i + 1,
        short:
          shortName.charAt(0).toUpperCase() +
          shortName.slice(1).replace('.', ''),
        full: fullName.charAt(0).toUpperCase() + fullName.slice(1),
      };
    });
  }, [i18n.language]);

  // Trigger label text
  const label = useMemo(() => {
    if (year === undefined && month === undefined) {
      return placeholder || t('activities:filters.allDates', 'All Dates');
    }
    if (year !== undefined && month === undefined) {
      return size === 'sm'
        ? `${year}`
        : `${year} (${t('activities:filters.fullYearShort', 'Full Year')})`;
    }
    if (year !== undefined && month !== undefined) {
      const monthObj = months[month - 1];
      return `${monthObj?.short || month} ${year}`;
    }
    return placeholder || 'Select Period';
  }, [year, month, months, placeholder, size, t]);

  const isFiltered = year !== undefined || month !== undefined;

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setComputedAlign(determineAlignment());
      }
      return next;
    });
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onPeriodChange(undefined, undefined);
    setActiveTab('month');
    setIsOpen(false);
  };

  const handleSelectYearOnly = (y: number) => {
    onPeriodChange(y, undefined);
    setIsOpen(false);
  };

  const handleSelectMonth = (mNum: number) => {
    onPeriodChange(viewYear, mNum);
    setIsOpen(false);
  };

  const handlePrevYear = () => {
    const idx = availableYears.indexOf(viewYear);
    if (idx !== -1 && idx < availableYears.length - 1) {
      setViewYear(availableYears[idx + 1]);
    } else {
      setViewYear((prev) => prev - 1);
    }
  };

  const handleNextYear = () => {
    const idx = availableYears.indexOf(viewYear);
    if (idx > 0) {
      setViewYear(availableYears[idx - 1]);
    } else {
      setViewYear((prev) => prev + 1);
    }
  };

  const sizeClasses =
    size === 'sm' ? 'h-9 px-3 text-xs gap-1.5' : 'h-10 px-3.5 text-xs gap-2';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center justify-between rounded-md border transition-all cursor-pointer select-none font-medium ${sizeClasses} ${
          isFiltered
            ? 'bg-[#fff5f2] border-[#b85028]/40 text-[#b85028] shadow-2xs font-semibold'
            : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] text-[#1e1b19]'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarBlank
            size={16}
            weight={isFiltered ? 'fill' : 'bold'}
            className={
              isFiltered ? 'text-[#b85028] shrink-0' : 'text-[#8a726a] shrink-0'
            }
          />
          <span className="truncate max-w-[125px] sm:max-w-[170px]">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-1.5 shrink-0">
          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear period filter"
              className="w-4 h-4 rounded-full hover:bg-[#b85028]/15 flex items-center justify-center text-[#b85028] cursor-pointer"
            >
              <X size={11} weight="bold" />
            </button>
          )}
          <CaretDown
            size={13}
            weight="bold"
            className={`text-[#8a726a] transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute ${
            computedAlign === 'right'
              ? 'right-0 left-auto'
              : 'left-0 right-auto'
          } top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-[#e8e1dd] shadow-xl p-3.5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Header Segmented Control */}
          <div className="grid grid-cols-3 p-1 bg-[#faf2ee] rounded-md border border-[#e8e1dd]/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'month'
                  ? 'bg-white text-[#b85028] shadow-2xs font-extrabold'
                  : 'text-[#8a726a] hover:text-[#1e1b19]'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('year')}
              className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'year'
                  ? 'bg-white text-[#b85028] shadow-2xs font-extrabold'
                  : 'text-[#8a726a] hover:text-[#1e1b19]'
              }`}
            >
              Year
            </button>
            <button
              type="button"
              onClick={handleClear}
              className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                !isFiltered
                  ? 'bg-white text-[#b85028] shadow-2xs font-extrabold'
                  : 'text-[#8a726a] hover:text-[#1e1b19]'
              }`}
            >
              All Time
            </button>
          </div>

          {/* TAB 1: Month Selection with Year Stepper */}
          {activeTab === 'month' && (
            <div className="flex flex-col gap-2.5">
              {/* Year Navigator */}
              <div className="flex items-center justify-between px-1 py-1 rounded-md bg-[#fdfbf9] border border-[#e8e1dd]/60">
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="w-7 h-7 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous year"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#1e1b19]">
                    {viewYear}
                  </span>
                  {year === viewYear && month !== undefined && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#b85028]" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleNextYear}
                  className="w-7 h-7 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] flex items-center justify-center transition-colors cursor-pointer"
                  title="Next year"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>

              {/* 12 Months Grid (4 columns x 3 rows) */}
              <div className="grid grid-cols-4 gap-1.5">
                {months.map((m) => {
                  const isSelected = year === viewYear && month === m.monthNum;
                  return (
                    <button
                      key={m.monthNum}
                      type="button"
                      onClick={() => handleSelectMonth(m.monthNum)}
                      className={`h-8 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#b85028] text-white shadow-xs font-bold'
                          : 'bg-[#faf2ee]/70 hover:bg-[#faf2ee] text-[#57423b] hover:text-[#1e1b19] border border-transparent hover:border-[#e8e1dd]'
                      }`}
                    >
                      {m.short}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Full Year Selection */}
          {activeTab === 'year' && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-[#8a726a] px-1">
                {t('activities:filters.selectProgramYear', {
                  defaultValue: 'Select an entire program year:',
                })}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {availableYears.map((y) => {
                  const isSelected = year === y && month === undefined;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYearOnly(y)}
                      className={`py-2 px-3 rounded-md border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#fff5f2] border-[#b85028] text-[#b85028] shadow-2xs'
                          : 'bg-[#faf2ee] hover:bg-[#f4ece9] border-[#e8e1dd] text-[#1e1b19]'
                      }`}
                    >
                      <span>{y}</span>
                      {isSelected ? (
                        <Check
                          size={14}
                          weight="bold"
                          className="text-[#b85028]"
                        />
                      ) : (
                        <span className="text-[10px] font-normal text-[#8a726a]">
                          All
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Footer / Reset */}
          <div className="flex items-center justify-between pt-2 border-t border-[#f4ece9] text-[11px]">
            <button
              type="button"
              onClick={handleClear}
              className="text-[#8a726a] hover:text-[#b85028] font-semibold transition-colors cursor-pointer"
            >
              Reset to All
            </button>
            <span className="text-[#8a726a] text-[10px]">
              {isFiltered ? 'Filter active' : 'Showing all time'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
