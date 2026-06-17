import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';
import { getTodayStr, getCutoffDate, getNextDateStr } from '../utils/dateUtils.js';
import { getMonthName } from '../utils/formatters.js';
import { markAttendanceFromShift } from './attendanceService.js';
import { saveCashPartyEntry } from './billService.js';

const syncCashPartyEntries = async (date, shiftNumber, rows) => {
  const existingEntries = await db.cashPartyEntries
    .where('date').equals(date)
    .and(e => e.shiftNumber === shiftNumber)
    .toArray();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const existing = existingEntries.find(e => e.rowIndex === i);

    if (row.cashParty > 0) {
      if (existing) {
        if (
          existing.partyId !== row.partyId ||
          existing.cashPartyAmount !== row.cashParty ||
          existing.diffKg !== row.difference ||
          existing.salesRs !== row.salesRs
        ) {
          await db.cashPartyEntries.update(existing.id, {
            partyId: row.partyId,
            partyName: row.partyName,
            diffKg: row.difference,
            salesRs: row.salesRs,
            cashPartyAmount: row.cashParty,
          });
          await queueSync('cash_party_entries', existing.id, {
            id: existing.id,
            date,
            shift_number: shiftNumber,
            row_index: i,
            party_id: row.partyId,
            party_name: row.partyName,
            diff_kg: row.difference,
            sales_rs: row.salesRs,
            cash_party_amount: row.cashParty,
            status: existing.status,
            amount_paid: existing.amountPaid,
            payment_date: existing.paymentDate,
            bill_number: existing.billNumber,
          });
        }
      } else {
        await saveCashPartyEntry({
          date,
          shiftNumber,
          rowIndex: i,
          partyId: row.partyId,
          partyName: row.partyName,
          diffKg: row.difference,
          salesRs: row.salesRs,
          cashPartyAmount: row.cashParty,
        });
      }
    } else {
      if (existing) {
        await db.cashPartyEntries.delete(existing.id);
        await queueSync('cash_party_entries', existing.id, null, 'delete');
      }
    }
  }

  for (const existing of existingEntries) {
    if (existing.rowIndex >= rows.length) {
      await db.cashPartyEntries.delete(existing.id);
      await queueSync('cash_party_entries', existing.id, null, 'delete');
    }
  }
};

export const saveShift = async (date, shiftNumber, shiftData) => {
  const now = new Date().toISOString();
  
  const rows = shiftData.rows || [];
  const totals = {
    totalDifference: parseFloat(
      (shiftData.totals?.totalDifference != null
        ? shiftData.totals.totalDifference
        : rows.reduce((sum, r) => sum + (parseFloat(r.difference) || 0), 0)
      ).toFixed(2)
    ),
    totalSalesRs: parseFloat(
      (shiftData.totals?.totalSalesRs != null
        ? shiftData.totals.totalSalesRs
        : rows.reduce((sum, r) => sum + (parseFloat(r.salesRs) || 0), 0)
      ).toFixed(2)
    ),
    totalCash: parseFloat(
      (shiftData.totals?.totalCash != null
        ? shiftData.totals.totalCash
        : rows.reduce((sum, r) => sum + (parseFloat(r.cash) || 0), 0)
      ).toFixed(2)
    ),
    totalCC: parseFloat(
      (shiftData.totals?.totalCC != null
        ? shiftData.totals.totalCC
        : rows.reduce((sum, r) => sum + (parseFloat(r.cc) || 0), 0)
      ).toFixed(2)
    ),
    totalUPI: parseFloat(
      (shiftData.totals?.totalUPI != null
        ? shiftData.totals.totalUPI
        : rows.reduce((sum, r) => sum + (parseFloat(r.upi) || 0), 0)
      ).toFixed(2)
    ),
    totalCashParty: parseFloat(
      (shiftData.totals?.totalCashParty != null
        ? shiftData.totals.totalCashParty
        : rows.reduce((sum, r) => sum + (parseFloat(r.cashParty) || 0), 0)
      ).toFixed(2)
    ),
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

  await db.shifts.put(record);

  await db.calendar.put({ date, hasData: true, updatedAt: now });

  // Auto-mark attendance
  await markAttendanceFromShift(date, parseInt(shiftNumber), rows);

  // Sync cash party entries
  await syncCashPartyEntries(date, parseInt(shiftNumber), rows);

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
export const forceUpdateCarryover = async (date, shiftNumber, savedRows, savedPrice) => {
  let nextShiftNum = shiftNumber + 1;
  let nextDate = date;

  if (shiftNumber === 3) {
    nextDate = getNextDateStr(date);
    nextShiftNum = 1;
  }

  const nextShift = await getShift(nextDate, nextShiftNum);
  if (!nextShift) return false;

  let updated = false;

  // Determine the price for the next shift
  let nextPrice = parseFloat(nextShift.price) || 0;
  if (nextPrice === 0 && savedPrice > 0) {
    nextPrice = savedPrice;
    updated = true;
  }

  const updatedRows = nextShift.rows.map((row) => {
    const match = savedRows.find((r) => r.nozzleId === row.nozzleId);
    let opening = parseFloat(row.openingReading) || 0;
    let isOpeningAutoFilled = row.isOpeningAutoFilled;

    if (match) {
      const matchClosing = parseFloat(match.closingReading) || 0;
      if (matchClosing !== opening) {
        opening = matchClosing;
        isOpeningAutoFilled = true;
        updated = true;
      }
    }

    const closing = parseFloat(row.closingReading) || 0;
    const diff = closing >= opening && opening > 0 ? parseFloat((closing - opening).toFixed(2)) : 0;
    const sales = parseFloat((diff * nextPrice).toFixed(2));
    const cc = parseFloat(row.cc) || 0;
    const upi = parseFloat(row.upi) || 0;
    const cashParty = parseFloat(row.cashParty) || 0;
    
    const cash = row.hasNotes
      ? (parseFloat(row.cash) || 0)
      : Math.max(0, parseFloat((sales - cc - upi - cashParty).toFixed(2)));

    // Check if difference, sales, or cash changed due to reading or price updates
    if (
      opening !== (parseFloat(row.openingReading) || 0) ||
      diff !== (parseFloat(row.difference) || 0) ||
      sales !== (parseFloat(row.salesRs) || 0) ||
      cash !== (parseFloat(row.cash) || 0)
    ) {
      updated = true;
    }

    return {
      ...row,
      openingReading: opening,
      isOpeningAutoFilled,
      difference: diff,
      salesRs: sales,
      cash,
    };
  });

  if (updated) {
    const totals = updatedRows.reduce(
      (acc, r) => ({
        totalDifference: parseFloat((acc.totalDifference + (r.difference || 0)).toFixed(2)),
        totalSalesRs: parseFloat((acc.totalSalesRs + (r.salesRs || 0)).toFixed(2)),
        totalCash: parseFloat((acc.totalCash + (parseFloat(r.cash) || 0)).toFixed(2)),
        totalCC: parseFloat((acc.totalCC + (parseFloat(r.cc) || 0)).toFixed(2)),
        totalUPI: parseFloat((acc.totalUPI + (parseFloat(r.upi) || 0)).toFixed(2)),
        totalCashParty: parseFloat((acc.totalCashParty + (parseFloat(r.cashParty) || 0)).toFixed(2)),
      }),
      { totalDifference: 0, totalSalesRs: 0, totalCash: 0, totalCC: 0, totalUPI: 0, totalCashParty: 0 }
    );

    await saveShift(nextDate, nextShiftNum, {
      ...nextShift,
      price: nextPrice,
      rows: updatedRows,
      totals,
    });
    return true;
  }

  return false;
};

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
