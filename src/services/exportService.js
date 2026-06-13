import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDisplayDate, formatExportDate, formatNumber, formatINR } from '../utils/formatters';

export const exportDSR = (date, shift1, shift2, shift3, stationName) => {
  const wb = XLSX.utils.book_new();

  [shift1, shift2, shift3].forEach((shift, i) => {
    const shiftName = `SHIFT${i + 1}`;
    const rows = [
      [stationName],
      [`Date: ${formatDisplayDate(date)}`],
      [],
      ['Nozzle', 'Employee', 'Opening Reading', 'Closing Reading', 'Difference (KG)', 'Sales (₹)', 'Cash', 'CC', 'UPI', 'Cash Party'],
      ...shift.rows.map((r) => [
        r.nozzleName,
        r.employeeName,
        r.openingReading,
        r.closingReading,
        r.difference,
        r.salesRs,
        r.cash,
        r.cc,
        r.upi,
        r.cashParty,
      ]),
      [
        'TOTAL', '', '', '',
        shift.totals.totalDifference,
        shift.totals.totalSalesRs,
        shift.totals.totalCash,
        shift.totals.totalCC,
        shift.totals.totalUPI,
        shift.totals.totalCashParty,
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
      { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, shiftName);
  });

  const filename = `${formatExportDate(date)}_DSR.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportMonthlyPDF = (monthName, year, rows, grandTotals, stationName) => {
  const pdfDoc = new jsPDF();

  pdfDoc.setFontSize(16);
  pdfDoc.text(stationName, 14, 15);
  pdfDoc.setFontSize(12);
  pdfDoc.text(`Monthly DSR — ${monthName} ${year}`, 14, 25);

  autoTable(pdfDoc, {
    startY: 30,
    head: [['Date', 'Diff (KG)', 'Sales (₹)', 'Cash', 'CC', 'UPI', 'Cash Party']],
    body: rows.map((r) => [
      formatDisplayDate(r.date),
      r.totalDifference.toFixed(2),
      r.totalSalesRs.toFixed(2),
      r.totalCash.toFixed(2),
      r.totalCC.toFixed(2),
      r.totalUPI.toFixed(2),
      r.totalCashParty.toFixed(2),
    ]),
    foot: [[
      'TOTAL',
      grandTotals.totalDifference.toFixed(2),
      grandTotals.totalSalesRs.toFixed(2),
      grandTotals.totalCash.toFixed(2),
      grandTotals.totalCC.toFixed(2),
      grandTotals.totalUPI.toFixed(2),
      grandTotals.totalCashParty.toFixed(2),
    ]],
    theme: 'striped',
    headStyles: { fillColor: [0, 48, 135] },
    footStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  pdfDoc.save(`${monthName}_DSR.pdf`);
};

export const checkAllShiftsComplete = async (date, getAllShifts) => {
  const shifts = await getAllShifts(date);
  const incomplete = [];

  for (let i = 1; i <= 3; i++) {
    const shift = shifts[`shift${i}`];
    if (!shift || !shift.isSaved) {
      incomplete.push(`Shift ${i}`);
    }
  }

  return { isComplete: incomplete.length === 0, incomplete, shifts };
};
