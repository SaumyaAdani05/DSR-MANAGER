import { db } from '../db/localDB';
import { queueSync } from './syncService';
import { getTodayStr, getCutoffDate } from '../utils/dateUtils';
import { getMonthName } from '../utils/formatters';

export const saveShift = async (date, shiftNumber, shiftData) => {
  const now = new Date().toISOString();
  
  // Clean totals to ensure proper types
  const totals = {
    totalDifference: parseFloat(shiftData.totals?.totalDifference || 0),
    totalSalesRs: parseFloat(shiftData.totals?.totalSalesRs || 0),
    totalCash: parseFloat(shiftData.totals?.totalCash || 0),
    totalCC: parseFloat(shiftData.totals?.totalCC || 0),
    totalUPI: parseFloat(shiftData.totals?.totalUPI || 0),
    totalCashParty: parseFloat(shiftData.totals?.totalCashParty || 0),
  };

  const record = {
    date,
    shiftNumber: parseInt(shiftNumber),
    price: parseFloat(shiftData.price || 0),
    rows: shiftData.rows || [],
    totals,
    savedAt: now,
    lastEditedAt: now,
    isSynced: false,
    isSaved: true,
  };

  // Save locally first (instant)
  await db.shifts.put(record);

  // Update calendar metadata
  await db.calendar.put({ date, hasData: true, updatedAt: now });

  // Queue for cloud sync
  await queueSync('shifts', `${date}_${shiftNumber}`, {
    date,
    shift_number: parseInt(shiftNumber),
    price: parseFloat(shiftData.price || 0),
    rows: shiftData.rows || [],
    totals,
    last_edited_at: now,
  });

  return record;
};

export const getShift = async (date, shiftNumber) => {
  const result = await db.shifts.get([date, parseInt(shiftNumber)]);
  if (result) {
    return { ...result, isSaved: true };
  }
  return null;
};

export const getAllShiftsForDate = async (date) => {
  const list = await db.shifts.where('date').equals(date).toArray();
  // Return in a grouped format to match components' expectations
  const shiftsObj = { shift1: null, shift2: null, shift3: null };
  list.forEach((s) => {
    shiftsObj[`shift${s.shiftNumber}`] = { ...s, isSaved: true };
  });
  return shiftsObj;
};

export const getDailyTotals = async (date) => {
  const list = await db.shifts.where('date').equals(date).toArray();
  return list.reduce(
    (acc, shift) => ({
      totalDifference: acc.totalDifference + (shift.totals?.totalDifference || 0),
      totalSalesRs: acc.totalSalesRs + (shift.totals?.totalSalesRs || 0),
      totalCash: acc.totalCash + (shift.totals?.totalCash || 0),
      totalCC: acc.totalCC + (shift.totals?.totalCC || 0),
      totalUPI: acc.totalUPI + (shift.totals?.totalUPI || 0),
      totalCashParty: acc.totalCashParty + (shift.totals?.totalCashParty || 0),
    }),
    {
      totalDifference: 0,
      totalSalesRs: 0,
      totalCash: 0,
      totalCC: 0,
      totalUPI: 0,
      totalCashParty: 0,
    }
  );
};

export const getCalendarData = async () => {
  const records = await db.calendar.toArray();
  return records.filter((r) => r.hasData).map((r) => r.date);
};

export const getMonthlyData = async (year, month) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  // Fetch all shifts in that range
  const shiftsInRange = await db.shifts
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();

  // Group by date
  const groupedByDate = {};
  shiftsInRange.forEach((shift) => {
    if (!groupedByDate[shift.date]) {
      groupedByDate[shift.date] = [];
    }
    groupedByDate[shift.date].push(shift);
  });

  const monthlyRows = [];
  const endDay = new Date(year, month, 0); // last day of month
  const totalDays = endDay.getDate();

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayShifts = groupedByDate[dateStr] || [];
    
    let dayTotals = {
      totalDifference: 0,
      totalSalesRs: 0,
      totalCash: 0,
      totalCC: 0,
      totalUPI: 0,
      totalCashParty: 0,
    };
    
    // Check if shifts 1, 2, and 3 are saved
    const s1 = dayShifts.find((s) => s.shiftNumber === 1);
    const s2 = dayShifts.find((s) => s.shiftNumber === 2);
    const s3 = dayShifts.find((s) => s.shiftNumber === 3);
    const allShiftsFilled = !!s1 && !!s2 && !!s3;

    dayShifts.forEach((shift) => {
      if (shift.totals) {
        dayTotals.totalDifference += shift.totals.totalDifference || 0;
        dayTotals.totalSalesRs += shift.totals.totalSalesRs || 0;
        dayTotals.totalCash += shift.totals.totalCash || 0;
        dayTotals.totalCC += shift.totals.totalCC || 0;
        dayTotals.totalUPI += shift.totals.totalUPI || 0;
        dayTotals.totalCashParty += shift.totals.totalCashParty || 0;
      }
    });

    monthlyRows.push({
      date: dateStr,
      ...dayTotals,
      allShiftsFilled,
    });
  }

  monthlyRows.sort((a, b) => a.date.localeCompare(b.date));
  return monthlyRows;
};

// Aliased exports for backwards-compatibility
export const loadShiftData = getShift;
export const saveShiftData = saveShift;
export const loadCalendarMetadata = getCalendarData;
export const forceUpdateCarryover = async () => {};

export const isMonthFullyCompleted = async (year, month) => {
  const data = await getMonthlyData(year, month);
  return data.length > 0 && data.every((row) => row.allShiftsFilled);
};

export const getCompletedMonths = async () => {
  const today = new Date(getTodayStr());
  const cutoff = new Date(getCutoffDate());
  const completed = [];

  const d = new Date(cutoff);
  d.setDate(1);
  while (d <= today) {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const isComplete = await isMonthFullyCompleted(year, month);
    if (isComplete) {
      completed.push({
        value: `${year}-${String(month).padStart(2, '0')}`,
        label: `${getMonthName(month)} ${year}`,
        year,
        month,
      });
    }
    d.setMonth(d.getMonth() + 1);
  }
  return completed.reverse();
};
