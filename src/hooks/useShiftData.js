import { useState, useCallback } from 'react';
import {
  loadShiftData,
  saveShiftData,
} from '../services/shiftService';
import toast from 'react-hot-toast';

/**
 * Default empty row factory.
 * @param {number} rowIndex
 * @returns {Object}
 */
const createEmptyRow = (rowIndex) => ({
  rowIndex,
  nozzleId: '',
  nozzleName: '',
  nozzleIsActive: true,
  employeeId: '',
  employeeName: '',
  employeeIsActive: true,
  openingReading: '',
  closingReading: '',
  difference: 0,
  salesRs: 0,
  cash: '',
  cc: '',
  upi: '',
  notes500: 0,
  notes200: 0,
  notes100: 0,
  notes50: 0,
  notes20: 0,
  notes10: 0,
  coins5: 0,
  coins2: 0,
  coins1: 0,
  hasNotes: false,
  isOpeningAutoFilled: false,
});

/**
 * Build an initial blank shift with the given number of rows.
 * @param {number} shiftNum
 * @param {string} date
 * @param {number} rowCount
 * @returns {Object}
 */
const createBlankShift = (shiftNum, date, rowCount = 5) => ({
  shiftNumber: shiftNum,
  date,
  price: '',
  rows: Array.from({ length: rowCount }, (_, i) => createEmptyRow(i)),
  totals: {
    totalDifference: 0,
    totalSalesRs: 0,
    totalCash: 0,
    totalCC: 0,
    totalUPI: 0,
  },
  isSaved: false,
  isLocked: false,
  carryoverApplied: false,
  savedAt: null,
  editWindowExpiry: null,
});

/**
 * Recalculate per-row derived values and totals.
 */
const recalculate = (rows, price) => {
  const p = parseFloat(price) || 0;

  const updatedRows = rows.map((row) => {
    const open = parseFloat(row.openingReading) || 0;
    const close = parseFloat(row.closingReading) || 0;
    const diff = close >= open ? parseFloat((close - open).toFixed(2)) : 0;
    const sales = parseFloat((diff * p).toFixed(2));
    const cc = parseFloat(row.cc) || 0;
    const upi = parseFloat(row.upi) || 0;
    const cashParty = parseFloat(row.cashParty) || 0;
    const cash = row.hasNotes
      ? (parseFloat(row.cash) || 0)
      : Math.max(0, parseFloat((sales - cc - upi - cashParty).toFixed(2)));
    return { ...row, difference: diff, salesRs: sales, cash };
  });

  const totals = updatedRows.reduce(
    (acc, row) => ({
      totalDifference: parseFloat((acc.totalDifference + row.difference).toFixed(2)),
      totalSalesRs: parseFloat((acc.totalSalesRs + row.salesRs).toFixed(2)),
      totalCash: parseFloat((acc.totalCash + (parseFloat(row.cash) || 0)).toFixed(2)),
      totalCC: parseFloat((acc.totalCC + (parseFloat(row.cc) || 0)).toFixed(2)),
      totalUPI: parseFloat((acc.totalUPI + (parseFloat(row.upi) || 0)).toFixed(2)),
    }),
    { totalDifference: 0, totalSalesRs: 0, totalCash: 0, totalCC: 0, totalUPI: 0 }
  );

  return { rows: updatedRows, totals };
};

/**
 * Hook managing shift state for the active date.
 * Returns helpers for loading, editing, saving shifts.
 */
export const useShiftData = () => {
  const [localShift, setLocalShift] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Load                                                               */
  /* ------------------------------------------------------------------ */
  const loadShift = useCallback(async (date, shiftNum) => {
    setIsLoading(true);
    try {
      const data = await loadShiftData(date, shiftNum);
      if (data) {
        setLocalShift(data);
        setIsEditing(false);
      } else {
        setLocalShift(createBlankShift(shiftNum, date));
        setIsEditing(true);
      }
      return data;
    } catch (err) {
      console.error(`Load shift ${shiftNum}/${date} failed:`, err);
      toast.error(`Failed to load Shift ${shiftNum}`);
      setLocalShift(createBlankShift(shiftNum, date));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Save                                                               */
  /* ------------------------------------------------------------------ */
  const saveShift = useCallback(async (date, shiftNum, shiftPayload) => {
    setIsSaving(true);
    try {
      await saveShiftData(date, shiftNum, shiftPayload);
      setLocalShift((prev) => ({
        ...prev,
        ...shiftPayload,
        isSaved: true,
      }));
      setIsEditing(false);
      toast.success(`Shift ${shiftNum} saved successfully`);
      return true;
    } catch (err) {
      console.error(`Save shift ${shiftNum}/${date} failed:`, err);
      toast.error('Failed to save shift');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Enter edit mode (within 48hr window)                               */
  /* ------------------------------------------------------------------ */
  const editShift = useCallback(() => {
    setIsEditing(true);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Update a single row field                                          */
  /* ------------------------------------------------------------------ */
  const updateRow = useCallback((rowIndex, field, value) => {
    setLocalShift((prev) => {
      if (!prev) return prev;
      const updatedRows = prev.rows.map((row) => {
        if (row.rowIndex !== rowIndex) return row;
        const updated = { ...row, [field]: value };

        // If the user manually edits opening, clear the auto-fill flag
        if (field === 'openingReading') {
          updated.isOpeningAutoFilled = false;
        }

        return updated;
      });

      const { rows, totals } = recalculate(updatedRows, prev.price);
      return { ...prev, rows, totals };
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Update today's price                                               */
  /* ------------------------------------------------------------------ */
  const updatePrice = useCallback((price) => {
    setLocalShift((prev) => {
      if (!prev) return prev;
      const { rows, totals } = recalculate(prev.rows, price);
      return { ...prev, price, rows, totals };
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Add / remove rows                                                  */
  /* ------------------------------------------------------------------ */
  const addRow = useCallback(() => {
    setLocalShift((prev) => {
      if (!prev || prev.rows.length >= 15) return prev;
      const newRow = createEmptyRow(prev.rows.length);
      return { ...prev, rows: [...prev.rows, newRow] };
    });
  }, []);

  const removeRow = useCallback((rowIndex) => {
    setLocalShift((prev) => {
      if (!prev || prev.rows.length <= 1) return prev;
      const filtered = prev.rows
        .filter((r) => r.rowIndex !== rowIndex)
        .map((r, i) => ({ ...r, rowIndex: i }));
      const { rows, totals } = recalculate(filtered, prev.price);
      return { ...prev, rows, totals };
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Replace entire localShift (used by carryover logic)                */
  /* ------------------------------------------------------------------ */
  const setShift = useCallback((data) => {
    setLocalShift(data);
  }, []);

  return {
    localShift,
    setShift,
    loadShift,
    saveShift,
    editShift,
    updateRow,
    updatePrice,
    addRow,
    removeRow,
    isLoading,
    isSaving,
    isEditing,
    setIsEditing,
    createBlankShift,
    recalculate,
  };
};
