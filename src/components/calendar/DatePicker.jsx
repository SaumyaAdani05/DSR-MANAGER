import { useState } from 'react';
import { getTodayStr, getDaysInMonth, getFirstDayOfMonth, isWithinRetention, isFutureDate, formatDateStr } from '../../utils/dateUtils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DatePicker = ({ selectedDate, datesWithData = [], onDateSelect }) => {
  const today = getTodayStr();
  const [year, month] = (selectedDate || today).split('-').map(Number);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    const [todayYear, todayMonth] = today.split('-').map(Number);
    setViewYear(todayYear);
    setViewMonth(todayMonth);
    onDateSelect(today);
  };

  const monthName = new Date(viewYear, viewMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Check if we're viewing the current month
  const [todayYear, todayMonth] = today.split('-').map(Number);
  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth;

  const days = [];
  // Empty cells for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(new Date(viewYear, viewMonth - 1, day));
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDate;
    const hasData = datesWithData.includes(dateStr);
    const isFuture = isFutureDate(dateStr);
    const isInRange = isWithinRetention(dateStr);
    const isDisabled = isFuture || !isInRange;

    days.push(
      <button
        key={day}
        onClick={() => !isDisabled && onDateSelect(dateStr)}
        disabled={isDisabled}
        className={`relative h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-full text-sm transition-all duration-150
          ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50 hover:scale-105 active:scale-95'}
          ${isSelected ? 'bg-adani-navy text-white shadow-md hover:bg-adani-navyLight hover:scale-100' : ''}
          ${isToday && !isSelected ? 'ring-2 ring-adani-red text-adani-red font-bold' : ''}
          ${hasData && !isSelected && !isToday ? 'font-semibold text-adani-navy' : ''}
        `}
        aria-label={`${day} ${monthName}${hasData ? ', has data' : ''}${isToday ? ', today' : ''}`}
      >
        <span>{day}</span>
        {hasData && (
          <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-adani-red'}`} />
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-4 w-full sm:w-[320px] transition-shadow hover:shadow-card-hover">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-adani-navy transition-all duration-150 active:scale-90"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3 className="text-sm font-bold text-adani-navy tracking-tight">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-adani-navy transition-all duration-150 active:scale-90"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center text-[11px] font-semibold text-adani-gray uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days}
      </div>

      {/* Today button */}
      {!isCurrentMonth && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={goToToday}
            className="w-full flex items-center justify-center gap-1.5 h-8 text-xs font-semibold text-adani-navy rounded-lg hover:bg-blue-50 transition-all duration-150 active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Jump to Today
          </button>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
