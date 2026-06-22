import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  addMonths,
  isAfter,
  isBefore,
  subDays,
  startOfDay,
  parseISO,
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useShift } from '../context/ShiftContext';
import { getMonthlyData } from '../services/shiftService';
import Header from '../components/layout/Header';
import SideDrawer from '../components/layout/SideDrawer';
import MonthlySummary from '../components/calendar/MonthlySummary';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { stationName } = useSettings();
  const { datesWithData, selectDate } = useShift();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyTotals, setMonthlyTotals] = useState({
    totalDifference: 0,
    totalSalesRs: 0,
    totalCash: 0,
    totalCC: 0,
    totalUPI: 0,
    totalCashParty: 0,
    totalExpense: 0,
    totalCMS: 0,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const yearStr = format(currentMonth, 'yyyy');
  const monthStr = format(currentMonth, 'MM');
  const monthName = format(currentMonth, 'MMMM');

  // Load monthly summary totals
  const loadMonthlySummary = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getMonthlyData(parseInt(yearStr), parseInt(monthStr));
      const sums = rows.reduce(
        (acc, r) => ({
          totalDifference: acc.totalDifference + (r.totalDifference || 0),
          totalSalesRs: acc.totalSalesRs + (r.totalSalesRs || 0),
          totalCash: acc.totalCash + (r.totalCash || 0),
          totalCC: acc.totalCC + (r.totalCC || 0),
          totalUPI: acc.totalUPI + (r.totalUPI || 0),
          totalCashParty: acc.totalCashParty + (r.totalCashParty || 0),
          totalExpense: acc.totalExpense + (r.totalExpense || 0),
          totalCMS: acc.totalCMS + (r.totalCMS || 0),
        }),
        {
          totalDifference: 0,
          totalSalesRs: 0,
          totalCash: 0,
          totalCC: 0,
          totalUPI: 0,
          totalCashParty: 0,
          totalExpense: 0,
          totalCMS: 0,
        }
      );
      setMonthlyTotals(sums);
    } catch (err) {
      console.error('Failed to load monthly summary:', err);
    } finally {
      setLoading(false);
    }
  }, [yearStr, monthStr]);

  useEffect(() => {
    loadMonthlySummary();
  }, [loadMonthlySummary]);

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday-start padding index: Sun = 0, Mon = 1 ... Sat = 6
  // Monday is index 0 in our layout: padding slots = (startDay === 0 ? 6 : startDay - 1)
  const startDay = getDay(monthStart);
  const paddingSlots = startDay === 0 ? 6 : startDay - 1;

  const today = startOfDay(new Date());
  const minSelectableDate = subDays(today, 60);

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const handleDateClick = async (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await selectDate(dateStr);
    navigate(`/dashboard/${dateStr}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-adani-lightGray">
      <Header stationName={stationName} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-adani-navy">Calendar</h1>
          <Button variant="ghost" onClick={() => navigate('/')}>
            ← Dashboard
          </Button>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-adani-navy">
              {monthName} {yearStr}
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handlePrevMonth}>
                ◀ Prev
              </Button>
              <Button variant="secondary" size="sm" onClick={handleNextMonth}>
                Next ▶
              </Button>
            </div>
          </div>

          {/* Grid Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-adani-gray border-b border-gray-100 pb-2 mb-2">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Pad leading days */}
            {Array.from({ length: paddingSlots }).map((_, i) => (
              <div key={`pad-${i}`} className="h-16 bg-gray-50/50 rounded-lg border border-gray-100/50" />
            ))}

            {/* Days in Month */}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isTodayDate = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
              const hasData = datesWithData.includes(dateStr);

              // Date bounds: selectable within past 60 days up to today
              const isSelectable = !isAfter(day, today) && !isBefore(day, minSelectableDate);

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => handleDateClick(day)}
                  className={`h-16 rounded-lg border flex flex-col items-center justify-between p-1.5 transition-all
                    ${
                      isSelectable
                        ? 'border-gray-200 hover:border-adani-navy hover:bg-blue-50/40 cursor-pointer active:scale-95'
                        : 'border-gray-100 bg-gray-50/40 text-gray-300 cursor-not-allowed'
                    }
                    ${isTodayDate ? 'ring-2 ring-adani-red ring-offset-1 font-bold' : ''}
                  `}
                >
                  <span className={`text-sm ${isTodayDate ? 'text-adani-red font-bold' : 'text-gray-800'}`}>
                    {format(day, 'd')}
                  </span>

                  {/* Dot Indicator */}
                  {hasData && (
                    <span className="h-1.5 w-1.5 rounded-full bg-adani-red mb-0.5 animate-pulse-dot" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly Summary aggregates */}
        {loading ? (
          <div className="flex justify-center items-center py-10 mt-6 bg-white rounded-xl shadow-card">
            <LoadingSpinner size="md" label="Loading monthly summary" />
          </div>
        ) : (
          <MonthlySummary monthName={monthName} year={yearStr} totals={monthlyTotals} />
        )}
      </main>
    </div>
  );
}
