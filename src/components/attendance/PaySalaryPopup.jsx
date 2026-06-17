import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { recordSalaryPayment } from '../../services/advanceService.js';
import { formatINR, getTodayIST, formatDisplayDate } from '../../utils/formatters.js';

export default function PaySalaryPopup({ isOpen, onClose, row, startDate, endDate, onSuccess }) {
  const [paymentDate, setPaymentDate] = useState(getTodayIST());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentDate(getTodayIST());
    }
  }, [isOpen]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!row) return;

    setLoading(true);
    try {
      const paymentData = {
        employeeId: row.employee.id,
        employeeName: row.employee.name,
        periodStart: startDate,
        periodEnd: endDate,
        totalShifts: row.totalShifts,
        totalWage: row.totalWage,
        advanceGiven: row.advanceGiven,
        deductionAmount: row.deductionAmount,
        netPayable: row.netPayable,
      };

      await recordSalaryPayment(paymentData);
      toast.success(`Salary payment recorded for ${row.employee.name}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to record salary payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Salary Payment">
      {row && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1.5 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Employee:</span>
              <span className="font-semibold text-gray-800">{row.employee.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pay Period:</span>
              <span className="font-medium text-gray-700">
                {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1">
              <span className="text-gray-500">Shifts Worked:</span>
              <span className="font-semibold text-gray-800">{row.totalShifts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Earned Wage:</span>
              <span className="font-semibold text-gray-800">{formatINR(row.totalWage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Advance Outstanding:</span>
              <span className="font-semibold text-amber-600">{formatINR(row.advanceGiven)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">This Month Deduction:</span>
              <span className="font-semibold text-amber-600">{formatINR(row.deductionAmount || 0)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5">
              <span className="text-gray-500 font-semibold text-gray-700">Net Payable:</span>
              <span className={`font-bold ${row.netPayable < 0 ? 'text-adani-red' : 'text-green-600'}`}>
                {formatINR(row.netPayable)}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="sal-date" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Payment Date
            </label>
            <Input
              id="sal-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Confirm Payout
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
