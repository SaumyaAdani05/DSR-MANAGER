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

  const monthName = new Date(viewYear, viewMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
        className={`relative h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-full text-sm transition-all
          ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-100'}
          ${isSelected ? 'bg-adani-navy text-white hover:bg-adani-navyLight' : ''}
          ${isToday && !isSelected ? 'ring-2 ring-adani-red text-adani-red font-bold' : ''}
        `}
        aria-label={`${day} ${monthName}${hasData ? ', has data' : ''}${isToday ? ', today' : ''}`}
      >
        <span>{day}</span>
        {hasData && (
          <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-adani-red'}`} />
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-4 w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-adani-navy"
          aria-label="Previous month"
        >
          ◀
        </button>
        <h3 className="text-sm font-semibold text-adani-navy">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-adani-navy"
          aria-label="Next month"
        >
          ▶
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-adani-gray">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days}
      </div>
    </div>
  );
};

export default DatePicker;
