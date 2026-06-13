import { useCallback } from 'react';
import { getShift, saveShift } from '../services/shiftService';
import { getNextDateStr } from '../utils/dateUtils';

export const useCarryover = () => {
  const getCarryoverFromShift = useCallback((prevShiftRows) => {
    if (!prevShiftRows || !Array.isArray(prevShiftRows)) return [];
    return prevShiftRows.map((row) => ({
      nozzleId: row.nozzleId,
      openingReading: row.closingReading,
      isOpeningAutoFilled: true,
    }));
  }, []);

  const cascadeCarryover = useCallback(async (date, shiftNumber, savedRows) => {
    let nextShiftNum = shiftNumber + 1;
    let nextDate = date;

    if (shiftNumber === 3) {
      nextDate = getNextDateStr(date);
      nextShiftNum = 1;
    }

    const nextShift = await getShift(nextDate, nextShiftNum);
    if (!nextShift) return; // No next shift to update

    const updatedRows = nextShift.rows.map((row, i) => {
      const match = savedRows[i];
      return {
        ...row,
        openingReading: match?.closingReading != null ? match.closingReading : row.openingReading,
        isOpeningAutoFilled: true,
      };
    });

    await saveShift(nextDate, nextShiftNum, {
      ...nextShift,
      rows: updatedRows,
    });
  }, []);

  return {
    getCarryoverFromShift,
    cascadeCarryover,
  };
};
