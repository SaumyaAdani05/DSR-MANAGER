import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getMonthlyData, getCompletedMonths } from '../../services/shiftService';
import { exportMonthlyPDF } from '../../services/exportService';
import { formatDisplayDate, formatNumber, getMonthName } from '../../utils/formatters';
import { getTodayStr, getCutoffDate } from '../../utils/dateUtils';

const MonthlyReport = ({ isOpen, onClose, stationName }) => {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [data, setData] = useState([]);
  const [grandTotals, setGrandTotals] = useState(null);
  const [loading, setLoading] = useState(false);

  // Build list of available months within retention
  useEffect(() => {
    if (!isOpen) return;
    const loadCompletedMonths = async () => {
      try {
        const completed = await getCompletedMonths();
        setAvailableMonths(completed);
      } catch (err) {
        console.error('Failed to load completed months:', err);
        toast.error('Failed to load completed months');
      }
    };
    loadCompletedMonths();
  }, [isOpen]);

  const handleMonthSelect = async (monthValue) => {
    setSelectedMonth(monthValue);
    if (!monthValue) {
      setData([]);
      setGrandTotals(null);
      return;
    }

    setLoading(true);
    try {
      const [year, month] = monthValue.split('-').map(Number);
      const rows = await getMonthlyData(year, month);
      setData(rows);

      const totals = rows.reduce(
        (acc, r) => ({
          totalDifference: acc.totalDifference + r.totalDifference,
          totalSalesRs: acc.totalSalesRs + r.totalSalesRs,
          totalCash: acc.totalCash + r.totalCash,
          totalCC: acc.totalCC + r.totalCC,
          totalUPI: acc.totalUPI + r.totalUPI,
          totalCashParty: acc.totalCashParty + r.totalCashParty,
          totalExpense: acc.totalExpense + (r.totalExpense || 0),
          totalCMS: acc.totalCMS + (r.totalCMS || 0),
        }),
        { totalDifference: 0, totalSalesRs: 0, totalCash: 0, totalCC: 0, totalUPI: 0, totalCashParty: 0, totalExpense: 0, totalCMS: 0 }
      );
      setGrandTotals(totals);
    } catch (error) {
      toast.error('Failed to load monthly data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!data.length || !grandTotals) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    exportMonthlyPDF(getMonthName(month), year, data, grandTotals, stationName);
    toast.success('PDF exported successfully');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monthly DSR Report" maxWidth="720px">
      <div className="space-y-4">
        {/* Month selector */}
        <div>
          <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Month
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => handleMonthSelect(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy"
          >
            <option value="">Choose a month</option>
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-adani-navy" />
          </div>
        )}

        {/* Data table */}
        {!loading && data.length > 0 && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-adani-navy text-white">
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-right font-semibold">Diff (KG)</th>
                  <th className="px-3 py-2 text-right font-semibold">Sales (₹)</th>
                  <th className="px-3 py-2 text-right font-semibold">Cash</th>
                  <th className="px-3 py-2 text-right font-semibold">CC</th>
                  <th className="px-3 py-2 text-right font-semibold">UPI</th>
                  <th className="px-3 py-2 text-right font-semibold">Cash Party</th>
                  <th className="px-3 py-2 text-right font-semibold">Expense</th>
                  <th className="px-3 py-2 text-right font-semibold">CMS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.date} className={`border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-3 py-2">{formatDisplayDate(row.date)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.totalDifference)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.totalSalesRs)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.totalCash)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.totalCC)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.totalUPI)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.totalCashParty)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.totalExpense || 0)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.totalCMS || 0)}</td>
                  </tr>
                ))}
                {grandTotals && (
                  <tr className="bg-blue-50 font-bold border-t-2 border-adani-navy">
                    <td className="px-3 py-2 text-adani-navy">TOTAL</td>
                    <td className="px-3 py-2 text-right text-adani-navy">{formatNumber(grandTotals.totalDifference)}</td>
                    <td className="px-3 py-2 text-right text-adani-navy">{formatNumber(grandTotals.totalSalesRs)}</td>
                    <td className="px-3 py-2 text-right text-adani-navy">{formatNumber(grandTotals.totalCash)}</td>
                    <td className="px-3 py-2 text-right text-adani-navy">{formatNumber(grandTotals.totalCC)}</td>
                    <td className="px-3 py-2 text-right text-adani-navy">{formatNumber(grandTotals.totalUPI)}</td>
                    <td className="px-3 py-2 text-right text-adani-navy">{formatNumber(grandTotals.totalCashParty)}</td>
                    <td className="px-3 py-2 text-right text-adani-navy">{formatNumber(grandTotals.totalExpense)}</td>
                    <td className="px-3 py-2 text-right text-adani-navy">{formatNumber(grandTotals.totalCMS)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && selectedMonth && data.length === 0 && (
          <p className="text-center text-adani-gray py-6">No records found for this month.</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {data.length > 0 && (
            <Button onClick={handleExportPDF}>Export PDF</Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MonthlyReport;
