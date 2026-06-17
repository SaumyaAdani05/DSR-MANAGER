import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { markAsPaid } from '../../services/billService.js';
import { formatINR, getTodayIST } from '../../utils/formatters.js';

export default function MarkAsPaidPopup({ isOpen, onClose, entry, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayIST());
  const [loading, setLoading] = useState(false);

  const outstanding = entry ? parseFloat((entry.cashPartyAmount - entry.amountPaid).toFixed(2)) : 0;

  useEffect(() => {
    if (isOpen && entry) {
      setAmount(outstanding.toString());
      setPaymentDate(getTodayIST());
    }
  }, [isOpen, entry, outstanding]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    const payAmt = parseFloat(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }
    if (payAmt > outstanding) {
      toast.error(`Amount paid cannot exceed outstanding balance of ${formatINR(outstanding)}`);
      return;
    }

    setLoading(true);
    try {
      await markAsPaid(entry.id, payAmt);
      toast.success('Payment recorded successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Credit Payment">
      {entry && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Party:</span>
              <span className="font-semibold text-gray-800">{entry.partyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bill No / Date:</span>
              <span className="font-medium text-gray-700">{entry.billNumber} ({entry.date})</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1">
              <span className="text-gray-500">Total Credit:</span>
              <span className="font-semibold text-gray-800">{formatINR(entry.cashPartyAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Already Paid:</span>
              <span className="font-semibold text-green-600">{formatINR(entry.amountPaid || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold text-gray-700">Remaining Due:</span>
              <span className="font-bold text-adani-red">{formatINR(outstanding)}</span>
            </div>
          </div>

          <div>
            <label htmlFor="pay-amount" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Amount Paid (₹)
            </label>
            <Input
              id="pay-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount paid"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="pay-date" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Payment Date
            </label>
            <Input
              id="pay-date"
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
              Confirm Payment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
