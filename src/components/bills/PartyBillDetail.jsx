import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import MarkAsPaidPopup from './MarkAsPaidPopup.jsx';
import { getPartyBillEntries } from '../../services/billService.js';
import { exportBillPDF, exportBillExcel } from '../../services/exportService.js';
import { formatDisplayDate, formatINR, formatNumber, getTodayIST } from '../../utils/formatters.js';

export default function PartyBillDetail({ party, stationName, onBack }) {
  const getStartOfMonth = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getTodayIST());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Payment settling state
  const [payingEntry, setPayingEntry] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getPartyBillEntries(party.id, startDate, endDate);
      setEntries(list);
    } catch (err) {
      console.error('Failed to load party bills:', err);
      toast.error('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  }, [party.id, startDate, endDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handlePrint = () => {
    window.print();
  };

  const handleTriggerPay = (entry) => {
    setPayingEntry(entry);
    setShowPayModal(true);
  };

  // Specific single invoice PDF export
  const handleExportSinglePDF = async (entry) => {
    try {
      const billData = {
        party,
        entries: [entry],
        billNumber: entry.billNumber,
        dateRange: { start: formatDisplayDate(entry.date), end: formatDisplayDate(entry.date) },
        totalAmount: parseFloat(entry.cashPartyAmount),
        totalPaid: parseFloat(entry.amountPaid || 0),
        outstanding: parseFloat((entry.cashPartyAmount - (entry.amountPaid || 0)).toFixed(2)),
      };
      exportBillPDF(billData, stationName);
      toast.success('Invoice PDF generated');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  // Date range PDF export
  const handleExportRangePDF = async () => {
    try {
      const totalAmount = entries.reduce((s, e) => s + (parseFloat(e.cashPartyAmount) || 0), 0);
      const totalPaid = entries.reduce((s, e) => s + (parseFloat(e.amountPaid) || 0), 0);
      const outstanding = parseFloat((totalAmount - totalPaid).toFixed(2));
      const billNumber = entries[0]?.billNumber || 'REPORT';
      
      const billData = {
        party,
        entries,
        billNumber,
        dateRange: { start: formatDisplayDate(startDate), end: formatDisplayDate(endDate) },
        totalAmount,
        totalPaid,
        outstanding,
      };
      exportBillPDF(billData, stationName);
      toast.success('Statement PDF generated');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      const totalAmount = entries.reduce((s, e) => s + (parseFloat(e.cashPartyAmount) || 0), 0);
      const totalPaid = entries.reduce((s, e) => s + (parseFloat(e.amountPaid) || 0), 0);
      const outstanding = parseFloat((totalAmount - totalPaid).toFixed(2));

      const allPartyData = [{
        party,
        entries,
        totalAmount,
        totalPaid,
        outstanding,
      }];
      exportBillExcel(allPartyData, stationName);
      toast.success('Excel spreadsheet generated');
    } catch (err) {
      toast.error('Failed to generate Excel sheet');
    }
  };

  const totalDiff = entries.reduce((s, e) => s + (parseFloat(e.diffKg) || 0), 0);
  const totalSales = entries.reduce((s, e) => s + (parseFloat(e.salesRs) || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (parseFloat(e.cashPartyAmount) || 0), 0);
  const totalPaid = entries.reduce((s, e) => s + (parseFloat(e.amountPaid) || 0), 0);
  const netOutstanding = parseFloat((totalCredit - totalPaid).toFixed(2));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>← Back to List</Button>
          <span className="text-xl font-bold text-adani-navy">{party.name} Bills</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handlePrint} disabled={entries.length === 0}>
            Print Statement
          </Button>
          <Button variant="secondary" onClick={handleExportExcel} disabled={entries.length === 0}>
            Excel Export
          </Button>
          <Button onClick={handleExportRangePDF} disabled={entries.length === 0}>
            PDF Statement
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow-card border border-gray-100 no-print">
        <div className="w-48">
          <label htmlFor="start-date" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Start Date
          </label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-48">
          <label htmlFor="end-date" className="block text-xs font-semibold text-gray-700 mb-1.5">
            End Date
          </label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">{stationName}</h1>
        <p className="text-sm text-gray-600">Credit Statement for {party.name}</p>
        <p className="text-xs text-gray-500">Period: {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}</p>
      </div>

      <section className="bg-white rounded-lg shadow-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-adani-navy no-print">
            Transactions Statement ({formatDisplayDate(startDate)} - {formatDisplayDate(endDate)})
          </h2>
          {netOutstanding > 0 && (
            <div className="text-sm font-bold">
              Outstanding Dues: <span className="text-adani-red">{formatINR(netOutstanding)}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-adani-navy border-t-transparent rounded-full" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No credit transactions recorded in this date range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-medium pb-2">
                  <th className="py-2">Date</th>
                  <th className="py-2">Bill No</th>
                  <th className="py-2 text-right">Diff (KG)</th>
                  <th className="py-2 text-right">Sales (₹)</th>
                  <th className="py-2 text-right">Credit (₹)</th>
                  <th className="py-2 text-center w-24">Status</th>
                  <th className="py-2 text-right">Paid (₹)</th>
                  <th className="py-2 text-center">Pay Date</th>
                  <th className="py-2 text-center w-28 no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">{formatDisplayDate(entry.date)}</td>
                    <td className="py-3 text-gray-700">{entry.billNumber}</td>
                    <td className="py-3 text-right text-gray-600">{formatNumber(entry.diffKg)}</td>
                    <td className="py-3 text-right text-gray-600">{formatINR(entry.salesRs)}</td>
                    <td className="py-3 text-right font-semibold text-adani-navy">{formatINR(entry.cashPartyAmount)}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        entry.status === 'paid'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : entry.status === 'partial'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-adani-red border border-red-200'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-green-600 font-semibold">{formatINR(entry.amountPaid || 0)}</td>
                    <td className="py-3 text-center text-gray-500">{entry.paymentDate ? formatDisplayDate(entry.paymentDate) : '\u2014'}</td>
                    <td className="py-3 text-center no-print">
                      <div className="flex justify-center gap-1.5">
                        {entry.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleTriggerPay(entry)}
                            className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-2 py-1 rounded transition-colors"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleExportSinglePDF(entry)}
                          className="border border-adani-navy text-adani-navy hover:bg-blue-50 text-[11px] font-bold px-2 py-1 rounded transition-colors"
                          title="Download Invoice PDF"
                        >
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="font-bold border-t-2 border-gray-200 bg-gray-50/50">
                  <td className="py-3 pl-2 text-gray-900" colSpan={2}>GRAND TOTAL</td>
                  <td className="py-3 text-right text-gray-900">{formatNumber(totalDiff)}</td>
                  <td className="py-3 text-right text-gray-900">{formatINR(totalSales)}</td>
                  <td className="py-3 text-right text-adani-navy">{formatINR(totalCredit)}</td>
                  <td className="py-3"></td>
                  <td className="py-3 text-right text-green-600">{formatINR(totalPaid)}</td>
                  <td className="py-3" colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payment Settlement Popup */}
      <MarkAsPaidPopup
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        entry={payingEntry}
        onSuccess={loadEntries}
      />
    </div>
  );
}
