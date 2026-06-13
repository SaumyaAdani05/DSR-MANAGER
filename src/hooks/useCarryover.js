import { useCallback } from 'react';
import { loadShiftData } from '../services/shiftService';
import { subDays, format } from 'date-fns';

/**
 * Hook for meter-reading carryover logic.
 * Maps closing readings from a previous shift/day to opening readings of the next.
 */
export const useCarryover = () => {
  /**
   * Extract closing readings from previous shift rows, keyed by rowIndex.
   * @param {Array} prevShiftRows – rows array from the previous shift document
   * @returns {Object} { [rowIndex]: closingReading }
   */
  const getCarryoverFromPrevShift = useCallback((prevShiftRows) => {
    if (!prevShiftRows || !Array.isArray(prevShiftRows)) return {};
    const carryover = {};
    prevShiftRows.forEach((row) => {
      if (row.closingReading != null && row.closingReading > 0) {
        carryover[row.rowIndex] = row.closingReading;
      }
    });
    return carryover;
  }, []);

  /**
   * Extract closing readings from the previous day's Shift 3.
   * Identical logic to getCarryoverFromPrevShift – separate function for clarity.
   * @param {Array} prevDayShift3Rows – rows from previous day's shift 3
   * @returns {Object} { [rowIndex]: closingReading }
   */
  const getCarryoverFromPrevDay = useCallback((prevDayShift3Rows) => {
    return getCarryoverFromPrevShift(prevDayShift3Rows);
  }, [getCarryoverFromPrevShift]);

  /**
   * Apply carryover data to current rows by matching rowIndex.
   * Sets isOpeningAutoFilled = true on applied rows.
   * @param {Array} currentRows – the current shift's row array
   * @param {Object} carryoverData – { [rowIndex]: closingReading }
   * @returns {Array} updated rows with openingReading filled
   */
  const applyCarryover = useCallback((currentRows, carryoverData) => {
    if (!carryoverData || Object.keys(carryoverData).length === 0) {
      return currentRows;
    }

    return currentRows.map((row) => {
      const carryoverValue = carryoverData[row.rowIndex];
      if (carryoverValue != null) {
        return {
          ...row,
          openingReading: carryoverValue,
          isOpeningAutoFilled: true,
        };
      }
      return row;
    });
  }, []);

  /**
   * Check whether the previous shift (or previous day's shift 3) has saved data.
   * For Shift 1 → checks previous day's Shift 3.
   * For Shift 2 / 3 → checks current day's previous shift.
   * @param {string} date – YYYY-MM-DD
   * @param {number} shiftNum – 1, 2, or 3
   * @returns {Promise<{ exists: boolean, rows: Array|null }>}
   */
  const checkPreviousShiftExists = useCallback(async (date, shiftNum) => {
    try {
      if (shiftNum === 1) {
        // Previous day's Shift 3
        const prevDate = format(subDays(new Date(date + 'T00:00:00'), 1), 'yyyy-MM-dd');
        const prevShift = await loadShiftData(prevDate, 3);
        return {
          exists: !!prevShift?.isSaved,
          rows: prevShift?.rows ?? null,
        };
      }

      // Shift 2 → check Shift 1, Shift 3 → check Shift 2
      const prevShiftNum = shiftNum - 1;
      const prevShift = await loadShiftData(date, prevShiftNum);
      return {
        exists: !!prevShift?.isSaved,
        rows: prevShift?.rows ?? null,
      };
    } catch (err) {
      console.error('Failed to check previous shift:', err);
      return { exists: false, rows: null };
    }
  }, []);

  return {
    getCarryoverFromPrevShift,
    getCarryoverFromPrevDay,
    applyCarryover,
    checkPreviousShiftExists,
  };
};
