import { db } from '../db/localDB';
import { queueSync } from './syncService';
import { getCutoffDate } from '../utils/dateUtils';

export const cleanOldRecords = async () => {
  try {
    const cutoffStr = getCutoffDate();

    // 1. Clean up shifts
    const expiredShifts = await db.shifts.where('date').below(cutoffStr).toArray();
    if (expiredShifts.length > 0) {
      for (const shift of expiredShifts) {
        // Delete from Dexie
        await db.shifts.delete([shift.date, shift.shiftNumber]);

        // Queue deletion for Supabase
        await queueSync(
          'shifts',
          `${shift.date}_${shift.shiftNumber}`,
          { date: shift.date, shift_number: shift.shiftNumber },
          'delete'
        );
      }
      console.log(`Cleaned up ${expiredShifts.length} old shifts locally and queued for sync deletion`);
    }

    // 2. Clean up calendar metadata
    const expiredCalendar = await db.calendar.where('date').below(cutoffStr).toArray();
    if (expiredCalendar.length > 0) {
      for (const entry of expiredCalendar) {
        // Delete from Dexie
        await db.calendar.delete(entry.date);

        // Queue deletion for Supabase
        await queueSync('calendar', entry.date, { date: entry.date }, 'delete');
      }
      console.log(`Cleaned up ${expiredCalendar.length} old calendar entries locally and queued for sync deletion`);
    }
  } catch (error) {
    console.error('Data retention cleanup error:', error);
  }
};
