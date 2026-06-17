import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { addAdvance } from '../../services/advanceService.js';
import { getTodayIST } from '../../utils/formatters.js';

export default function AddAdvancePopup({ isOpen, onClose, employee, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayIST());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(getTodayIST());
      setNote('');
    }
  }, [isOpen]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    const advAmt = parseFloat(amount);
    if (isNaN(advAmt) || advAmt <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      await addAdvance(employee.id, employee.name, advAmt, date, note);
      toast.success(`Advance of ₹${advAmt} recorded for ${employee.name}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to record advance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Employee Advance">
      {employee && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Employee Name
            </label>
            <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold text-gray-800 cursor-not-allowed">
              {employee.name}
            </div>
          </div>

          <div>
            <label htmlFor="adv-amount" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Advance Amount (₹)
            </label>
            <Input
              id="adv-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter advance amount"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="adv-date" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Date Given
            </label>
            <Input
              id="adv-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="adv-note" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Note (Optional)
            </label>
            <Input
              id="adv-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. medical expense, festival advance"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Record Advance
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
