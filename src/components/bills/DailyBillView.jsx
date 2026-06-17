import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { getDailyBillEntries } from '../../services/billService.js';
import { formatDisplayDate, formatINR, formatNumber, getTodayIST } from '../../utils/formatters.js';

export default function DailyBillView({ stationName }) {
  const [date, setDate] = useState(getTodayIST());
  const [partiesSummary, setPartiesSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDailyBills = async () => {
    setLoading(true);
    try {
      const entries = await getDailyBillEntries(date);
      // Group entries by party
      const grouped = {};
      entries.forEach((entry) => {
        const pId = entry.partyId;
        if (!grouped[pId]) {
          grouped[pId] = {
            partyName: entry.partyName,
            diffKg: 0,
            salesRs: 0,
            cashPartyAmount: 0,
            amountPaid: 0,
            entriesCount: 0,
            pendingCount: 0,
          };
        }
        grouped[pId].diffKg += parseFloat(entry.diffKg) || 0;
        grouped[pId].salesRs += parseFloat(entry.salesRs) || 0;
        grouped[pId].cashPartyAmount += parseFloat(entry.cashPartyAmount) || 0;
        grouped[pId].amountPaid += parseFloat(entry.amountPaid) || 0;
        grouped[pId].entriesCount += 1;
        if (entry.status !== 'paid') {
          grouped[pId].pendingCount += 1;
        }
      });

      const list = Object.keys(grouped).map((pId) => {
        const item = grouped[pId];
        let status = 'paid';
        if (item.pendingCount > 0) {
          status = item.amountPaid > 0 ? 'partial' : 'pending';
        }
        return {
          partyId: pId,
          ...item,
          status,
        };
      });

      setPartiesSummary(list);
    } catch (err) {
      console.error('Failed to load daily bills:', err);
      toast.error('Failed to load daily bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyBills();
  }, [date]);

  const handlePrint = () => {
    window.print();
  };

  // Inline PDF/Excel exports for Daily Bill
  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(stationName, 14, 15);
    doc.setFontSize(12);
    doc.text(`Daily Bills Summary — ${formatDisplayDate(date)}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Party Name', 'Diff (KG)', 'Sales (₹)', 'Credit Amount (₹)', 'Status']],
      body: partiesSummary.map((p) => [
        p.partyName,
        p.diffKg.toFixed(2),
        formatINR(p.salesRs),
        formatINR(p.cashPartyAmount),
        p.status.toUpperCase(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 48, 135] },
    });

    doc.save(`DailyBills_${date}.pdf`);
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const rows = [
      [stationName],
      [`Daily Bills Summary — ${formatDisplayDate(date)}`],
      [],
      ['Party Name', 'Diff (KG)', 'Sales (₹)', 'Credit Amount (₹)', 'Status'],
      ...partiesSummary.map((p) => [
        p.partyName,
        p.diffKg,
        p.salesRs,
        p.cashPartyAmount,
        p.status.toUpperCase(),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Bills');
    XLSX.writeFile(wb, `DailyBills_${date}.xlsx`);
  };

  const totalDiff = partiesSummary.reduce((s, p) => s + p.diffKg, 0);
  const totalSales = partiesSummary.reduce((s, p) => s + p.salesRs, 0);
  const totalCredit = partiesSummary.reduce((s, p) => s + p.cashPartyAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 bg-white p-4 rounded-lg shadow-card border border-gray-100 no-print">
        <div className="w-48">
          <label htmlFor="daily-bill-date" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Select Date
          </label>
          <Input
            id="daily-bill-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={handlePrint} disabled={partiesSummary.length === 0}>
            Print View
          </Button>
          <Button variant="secondary" onClick={handleExportExcel} disabled={partiesSummary.length === 0}>
            Excel Export
          </Button>
          <Button onClick={handleExportPDF} disabled={partiesSummary.length === 0}>
            PDF Export
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">{stationName}</h1>
        <p className="text-sm text-gray-600">Daily Bills Summary — {formatDisplayDate(date)}</p>
      </div>

      <section className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-sm font-semibold text-adani-navy mb-4 no-print">
          Daily Summary for {formatDisplayDate(date)}
        </h2>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-adani-navy border-t-transparent rounded-full" />
          </div>
        ) : partiesSummary.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No credit transactions recorded on this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-medium pb-2">
                  <th className="py-2">Party Name</th>
                  <th className="py-2 text-right">Diff (KG)</th>
                  <th className="py-2 text-right">Sales (₹)</th>
                  <th className="py-2 text-right">Credit Amount (₹)</th>
                  <th className="py-2 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {partiesSummary.map((p) => (
                  <tr key={p.partyId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">{p.partyName}</td>
                    <td className="py-3 text-right text-gray-700">{formatNumber(p.diffKg)}</td>
                    <td className="py-3 text-right text-gray-700">{formatINR(p.salesRs)}</td>
                    <td className="py-3 text-right font-semibold text-adani-navy">{formatINR(p.cashPartyAmount)}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        p.status === 'paid'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : p.status === 'partial'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-adani-red border border-red-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="font-bold border-t-2 border-gray-200 bg-gray-50/50">
                  <td className="py-3 pl-2 text-gray-900">GRAND TOTAL</td>
                  <td className="py-3 text-right text-gray-900">{formatNumber(totalDiff)}</td>
                  <td className="py-3 text-right text-gray-900">{formatINR(totalSales)}</td>
                  <td className="py-3 text-right text-adani-navy">{formatINR(totalCredit)}</td>
                  <td className="py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
