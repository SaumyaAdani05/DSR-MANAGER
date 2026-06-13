import { createContext, useContext, useState, useCallback } from 'react';
import {
  loadShiftData,
  loadCalendarMetadata,
} from '../services/shiftService';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import toast from 'react-hot-toast';

const IST = 'Asia/Kolkata';

/** Return today's date string in IST (YYYY-MM-DD) */
const getTodayIST = () => format(toZonedTime(new Date(), IST), 'yyyy-MM-dd');

const ShiftContext = createContext(null);

export const useShift = () => {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error('useShift must be used within ShiftProvider');
  return ctx;
};

export const ShiftProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [activeShift, setActiveShift] = useState(1);
  const [shiftData, setShiftData] = useState({ 1: null, 2: null, 3: null });
  const [datesWithData, setDatesWithData] = useState([]);
  const [shiftLoading, setShiftLoading] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Calendar metadata                                                  */
  /* ------------------------------------------------------------------ */
  const loadCalendar = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const dates = await loadCalendarMetadata();
      setDatesWithData(dates ?? []);
    } catch (err) {
      console.error('Failed to load calendar metadata:', err);
    }
  }, [isAuthenticated]);

  /* ------------------------------------------------------------------ */
  /*  Load a single shift                                                */
  /* ------------------------------------------------------------------ */
  const loadShift = useCallback(
    async (date, shiftNum) => {
      setShiftLoading(true);
      try {
        const data = await loadShiftData(date, shiftNum);
        setShiftData((prev) => ({ ...prev, [shiftNum]: data }));
        return data;
      } catch (err) {
        console.error(`Failed to load shift ${shiftNum} for ${date}:`, err);
        toast.error(`Failed to load Shift ${shiftNum}`);
        return null;
      } finally {
        setShiftLoading(false);
      }
    },
    []
  );

  /* ------------------------------------------------------------------ */
  /*  Load all 3 shifts for a date                                       */
  /* ------------------------------------------------------------------ */
  const loadAllShifts = useCallback(
    async (date) => {
      setShiftLoading(true);
      try {
        const [s1, s2, s3] = await Promise.all([
          loadShiftData(date, 1),
          loadShiftData(date, 2),
          loadShiftData(date, 3),
        ]);
        setShiftData({ 1: s1, 2: s2, 3: s3 });

        // Determine which tab to show
        if (s3?.isSaved) setActiveShift(3);
        else if (s2?.isSaved) setActiveShift(2);
        else setActiveShift(1);
      } catch (err) {
        console.error(`Failed to load shifts for ${date}:`, err);
        toast.error('Failed to load shift data');
      } finally {
        setShiftLoading(false);
      }
    },
    []
  );

  /* ------------------------------------------------------------------ */
  /*  Date selection                                                     */
  /* ------------------------------------------------------------------ */
  const selectDate = useCallback(
    async (date) => {
      setSelectedDate(date);
      setShiftData({ 1: null, 2: null, 3: null });
      await loadAllShifts(date);
    },
    [loadAllShifts]
  );

  /* ------------------------------------------------------------------ */
  /*  Shift tab switching                                                */
  /* ------------------------------------------------------------------ */
  const switchShift = useCallback(
    async (shiftNum) => {
      setActiveShift(shiftNum);
      if (!shiftData[shiftNum]) {
        await loadShift(selectedDate, shiftNum);
      }
    },
    [shiftData, selectedDate, loadShift]
  );

  /* ------------------------------------------------------------------ */
  /*  Update shift data in local state (after save, edit, etc.)          */
  /* ------------------------------------------------------------------ */
  const updateLocalShiftData = useCallback((shiftNum, data) => {
    setShiftData((prev) => ({ ...prev, [shiftNum]: data }));
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const isToday = selectedDate === getTodayIST();

  const value = {
    selectedDate,
    selectDate,
    activeShift,
    switchShift,
    shiftData,
    updateLocalShiftData,
    datesWithData,
    loadCalendar,
    loadShift,
    loadAllShifts,
    shiftLoading,
    isToday,
    getTodayIST,
  };

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
};
