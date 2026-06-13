import { getCutoffDate } from '../utils/dateUtils';

const RECORDS_KEY = 'dsr_records';
const CALENDAR_KEY = 'dsr_calendar';

export const cleanOldRecords = async () => {
  try {
    const cutoffStr = getCutoffDate();
    const recordsData = localStorage.getItem(RECORDS_KEY);
    if (!recordsData) return;

    const records = JSON.parse(recordsData);
    const updatedRecords = {};
    const deletedDates = [];

    for (const date of Object.keys(records)) {
      if (date < cutoffStr) {
        deletedDates.push(date);
      } else {
        updatedRecords[date] = records[date];
      }
    }

    if (deletedDates.length === 0) return;

    localStorage.setItem(RECORDS_KEY, JSON.stringify(updatedRecords));

    // Update calendar metadata
    const calendarData = localStorage.getItem(CALENDAR_KEY);
    if (calendarData) {
      const dates = JSON.parse(calendarData);
      const updatedDates = dates.filter((d) => !deletedDates.includes(d));
      localStorage.setItem(CALENDAR_KEY, JSON.stringify(updatedDates));
    }

    console.log(`Cleaned up ${deletedDates.length} old records from localStorage`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};
