import { calcEditExpiry } from '../utils/dateUtils';
import { calcRowTotals } from '../utils/calculations';

const RECORDS_KEY = 'dsr_records';
const CALENDAR_KEY = 'dsr_calendar';

// Helper to load all records
const loadAllRecords = () => {
  const data = localStorage.getItem(RECORDS_KEY);
  return data ? JSON.parse(data) : {};
};

// Helper to save all records
const saveAllRecords = (records) => {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const getShift = async (date, shiftNum) => {
  const records = loadAllRecords();
  return records[date]?.shifts?.[`shift${shiftNum}`] || null;
};

export const getDateRecord = async (date) => {
  const records = loadAllRecords();
  return records[date] || null;
};

export const saveShift = async (date, shiftNum, shiftData) => {
  const records = loadAllRecords();
  const now = new Date();
  const editExpiry = calcEditExpiry(now);
  const totals = calcRowTotals(shiftData.rows);

  const shiftDoc = {
    shiftNumber: shiftNum,
    date,
    price: shiftData.price,
    rows: shiftData.rows.map((row, i) => ({
      rowIndex: i,
      nozzleId: row.nozzleId || '',
      nozzleName: row.nozzleName || '',
      nozzleIsActive: row.nozzleIsActive !== false,
      employeeId: row.employeeId || '',
      employeeName: row.employeeName || '',
      employeeIsActive: row.employeeIsActive !== false,
      openingReading: parseFloat(row.openingReading) || 0,
      closingReading: parseFloat(row.closingReading) || 0,
      difference: parseFloat(row.difference) || 0,
      salesRs: parseFloat(row.salesRs) || 0,
      cash: parseFloat(row.cash) || 0,
      cc: parseFloat(row.cc) || 0,
      upi: parseFloat(row.upi) || 0,
      notes500: parseInt(row.notes500) || 0,
      notes200: parseInt(row.notes200) || 0,
      notes100: parseInt(row.notes100) || 0,
      notes50: parseInt(row.notes50) || 0,
      notes20: parseInt(row.notes20) || 0,
      notes10: parseInt(row.notes10) || 0,
      coins5: parseInt(row.coins5) || 0,
      coins2: parseInt(row.coins2) || 0,
      coins1: parseInt(row.coins1) || 0,
      hasNotes: !!row.hasNotes,
      isOpeningAutoFilled: row.isOpeningAutoFilled || false,
    })),
    totals,
    savedAt: now.toISOString(),
    editWindowExpiry: editExpiry.toISOString(),
    isLocked: false,
    isSaved: true,
    carryoverApplied: shiftData.carryoverApplied || false,
    createdAt: shiftData.createdAt || now.toISOString(),
  };

  if (!records[date]) {
    records[date] = {
      date,
      shifts: {},
      shiftsCompleted: [],
    };
  }

  records[date].shifts[`shift${shiftNum}`] = shiftDoc;
  records[date].lastModifiedAt = now.toISOString();
  if (!records[date].shiftsCompleted.includes(shiftNum)) {
    records[date].shiftsCompleted.push(shiftNum);
  }

  saveAllRecords(records);

  // Update calendar metadata
  const calendarData = await getCalendarData();
  if (!calendarData.includes(date)) {
    calendarData.push(date);
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(calendarData));
  }

  return shiftDoc;
};

export const forceUpdateCarryover = async (date, shiftNum, closingRows) => {
  let nextDate = date;
  let nextShiftNum = shiftNum + 1;

  if (nextShiftNum > 3) {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 1);
    nextDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    nextShiftNum = 1;
  }

  const records = loadAllRecords();
  const nextShift = records[nextDate]?.shifts?.[`shift${nextShiftNum}`];

  if (nextShift) {
    const updatedRows = nextShift.rows.map((row, i) => ({
      ...row,
      openingReading: closingRows[i]?.closingReading ?? row.openingReading,
      isOpeningAutoFilled: true,
    }));
    nextShift.rows = updatedRows;
    nextShift.lastModifiedAt = new Date().toISOString();
    saveAllRecords(records);
    return true;
  }
  return false;
};

export const getCalendarData = async () => {
  const data = localStorage.getItem(CALENDAR_KEY);
  return data ? JSON.parse(data) : [];
};

export const getAllShiftsForDate = async (date) => {
  const shifts = {};
  for (let i = 1; i <= 3; i++) {
    shifts[`shift${i}`] = await getShift(date, i);
  }
  return shifts;
};

export const getMonthlyData = async (year, month) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const records = loadAllRecords();
  const monthlyRows = [];

  for (const date of Object.keys(records)) {
    if (date >= startDate && date <= endDate) {
      const dayRecord = records[date];
      const shifts = await getAllShiftsForDate(date);

      let dayTotals = { totalDifference: 0, totalSalesRs: 0, totalCash: 0, totalCC: 0, totalUPI: 0 };
      let allShiftsFilled = true;

      for (let i = 1; i <= 3; i++) {
        const shift = shifts[`shift${i}`];
        if (shift?.totals) {
          dayTotals.totalDifference += shift.totals.totalDifference || 0;
          dayTotals.totalSalesRs += shift.totals.totalSalesRs || 0;
          dayTotals.totalCash += shift.totals.totalCash || 0;
          dayTotals.totalCC += shift.totals.totalCC || 0;
          dayTotals.totalUPI += shift.totals.totalUPI || 0;
        } else {
          allShiftsFilled = false;
        }
      }

      monthlyRows.push({
        date,
        ...dayTotals,
        allShiftsFilled,
      });
    }
  }

  monthlyRows.sort((a, b) => a.date.localeCompare(b.date));
  return monthlyRows;
};
