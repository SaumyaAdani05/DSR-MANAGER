import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { exportDSR, checkAllShiftsComplete } from '../../services/exportService';
import { getAllShiftsForDate } from '../../services/shiftService';
import { getTodayStr } from '../../utils/dateUtils';
import { formatDisplayDate } from '../../utils/formatters';

const ExportDSR = ({ isOpen, onClose, stationName }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [loading, setLoading] = useState(false);
  const [incomplete, setIncomplete] = useState([]);
  const [showIncomplete, setShowIncomplete] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setShowIncomplete(false);
    try {
      const result = await checkAllShiftsComplete(selectedDate, getAllShiftsForDate);

      if (!result.isComplete) {
        setIncomplete(result.incomplete);
        setShowIncomplete(true);
        return;
      }

      const { shift1, shift2, shift3 } = result.shifts;
      exportDSR(selectedDate, shift1, shift2, shift3, stationName);
      toast.success('DSR exported successfully');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to export DSR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export DSR">
      <div className="space-y-4">
        <div>
          <label htmlFor="export-date" className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            id="export-date"
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setShowIncomplete(false);
            }}
            max={getTodayStr()}
            className="w-full h-10 px-3 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy"
          />
          <p className="mt-1 text-xs text-adani-gray">
            Selected: {formatDisplayDate(selectedDate)}
          </p>
        </div>

        {showIncomplete && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-error mb-2">
              The following shifts are incomplete:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {incomplete.map((s) => (
                <li key={s}>{s} — Not completed</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-600">
              Complete all shifts before exporting.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} loading={loading}>
            Export Excel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportDSR;
