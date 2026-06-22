import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { validateDailyRecord } from '../../utils/validators';

export default function DailyRecordForm({ date, initialRecord, onSave, readOnly }) {
  const [expenses, setExpenses] = useState([]);
  const [cms, setCms] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync state when initialRecord or date changes
  useEffect(() => {
    if (initialRecord) {
      setExpenses(Array.isArray(initialRecord.expenses) ? initialRecord.expenses : []);
      setCms(initialRecord.cms || 0);
      setIsEditing(false);
    }
  }, [initialRecord, date]);

  const handleSave = async (e) => {
    e.preventDefault();
    const recordPayload = {
      expenses: expenses.map(e => ({
        amount: parseFloat(e.amount) || 0,
        note: (e.note || '').trim()
      })),
      cms: parseFloat(cms) || 0,
    };

    const errors = validateDailyRecord(recordPayload);
    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      return;
    }

    setIsSaving(true);
    try {
      await onSave(recordPayload);
      toast.success('Daily records saved successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save daily records');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpenseChange = (index, field, value) => {
    const updated = [...expenses];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setExpenses(updated);
  };

  const handleAddExpense = () => {
    setExpenses([...expenses, { amount: 0, note: '' }]);
  };

  const handleRemoveExpense = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const totalExpense = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const isFormDisabled = readOnly || (!isEditing && initialRecord?.updatedAt);

  return (
    <div className="bg-white rounded-lg shadow-card p-6 border border-gray-100 mt-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <h3 className="text-sm font-bold text-adani-navy uppercase tracking-wider">
          Daily Expenses & CMS (Date Level)
        </h3>
        {readOnly && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-adani-gray rounded-full">
            Read-Only
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Daily Expenses
            </span>
            {!isFormDisabled && (
              <button
                type="button"
                onClick={handleAddExpense}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-adani-navy border border-adani-border rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Expense Row
              </button>
            )}
          </div>

          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4 text-center bg-gray-50 rounded-md border border-dashed border-gray-200">
              No expenses recorded for this day.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Header labels for larger screens */}
              <div className="hidden md:flex gap-4 px-1 text-xs font-bold text-gray-400 uppercase">
                <div className="w-1/4">Amount (₹)</div>
                <div className="flex-1">Description / Note</div>
                <div className="w-10"></div>
              </div>

              {expenses.map((exp, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg md:rounded-none border md:border-0 border-gray-100">
                  <div className="w-full md:w-1/4">
                    <label className="block md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={exp.amount === 0 ? '' : exp.amount}
                      disabled={isFormDisabled}
                      onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed font-medium text-gray-900 bg-white"
                    />
                  </div>

                  <div className="w-full flex-1">
                    <label className="block md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Description / Note
                    </label>
                    <input
                      type="text"
                      placeholder="Expense note (e.g. Tea/snacks, stationery, cleaning)"
                      value={exp.note}
                      disabled={isFormDisabled}
                      onChange={(e) => handleExpenseChange(index, 'note', e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 bg-white"
                    />
                  </div>

                  {!isFormDisabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(index)}
                      className="h-10 w-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md transition-colors self-end md:self-auto"
                      title="Delete expense"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {expenses.length > 0 && (
            <div className="flex justify-between items-center bg-gray-50 border border-gray-100 p-3.5 rounded-lg">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Expenses:</span>
              <span className="text-base font-bold text-amber-600">₹{totalExpense.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CMS */}
            <div>
              <label htmlFor="daily-cms" className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                CMS Bank Deposit (₹)
              </label>
              <input
                id="daily-cms"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cms === 0 ? '' : cms}
                disabled={isFormDisabled}
                onChange={(e) => setCms(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed font-medium text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            {initialRecord?.updatedAt && !isEditing ? (
              <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                Edit Daily Records
              </Button>
            ) : (
              <>
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setExpenses(Array.isArray(initialRecord.expenses) ? initialRecord.expenses : []);
                      setCms(initialRecord.cms || 0);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" loading={isSaving}>
                  Save Daily Records
                </Button>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
