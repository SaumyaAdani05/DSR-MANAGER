import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDisplayDate, formatExportDate, formatNumber, formatINR, getTodayIST } from '../utils/formatters.js';

export const sanitizeCellVal = (val) => {
  if (typeof val === 'string' && /^[=\+\-@]/.test(val)) {
    return `'${val}`;
  }
  return val;
};

// Date range generation helper (capped at 31 days)
const getDatesInRange = (start, end) => {
  const dates = [];
  let curr = new Date(start);
  const last = new Date(end);
  let count = 0;
  while (curr <= last && count < 32) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
    count++;
  }
  return dates;
};

export const exportDSR = (date, shift1, shift2, shift3, stationName) => {
  const wb = XLSX.utils.book_new();

  [shift1, shift2, shift3].forEach((shift, i) => {
    const shiftName = `SHIFT${i + 1}`;
    const rows = [
      [sanitizeCellVal(stationName)],
      [`Date: ${formatDisplayDate(date)}`],
      [],
      ['Nozzle', 'Employee', 'Opening Reading', 'Closing Reading', 'Difference (KG)', 'Sales (₹)', 'Cash', 'CC', 'UPI', 'Cash Party'],
      ...shift.rows.map((r) => [
        sanitizeCellVal(r.nozzleName),
        sanitizeCellVal(r.employeeName),
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
  pdfDoc.text(sanitizeCellVal(stationName), 14, 15);
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

export const exportBillPDF = (billData, stationName) => {
  const { party, entries, billNumber, dateRange, totalAmount, totalPaid, outstanding } = billData;

  const pdfDoc = new jsPDF();

  // Premium Header Banner
  pdfDoc.setFillColor(0, 48, 135); // Adani Navy
  pdfDoc.rect(0, 0, 210, 35, 'F');

  pdfDoc.setTextColor(255, 255, 255);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(20);
  pdfDoc.text(sanitizeCellVal(stationName), 14, 18);

  pdfDoc.setFontSize(10);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text('INVOICE & CREDIT STATEMENT', 14, 27);

  // Bill details
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('INVOICE TO:', 196, 18, { align: 'right' });
  pdfDoc.text(sanitizeCellVal(party.name), 196, 25, { align: 'right' });

  // Reset text color
  pdfDoc.setTextColor(0, 0, 0);

  // Metadata block
  pdfDoc.setFontSize(10);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Invoice / Bill No:', 14, 48);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(billNumber || 'REPORT', 50, 48);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Statement Period:', 14, 55);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(`${dateRange?.start} to ${dateRange?.end}`, 50, 55);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Date of Issue:', 14, 62);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(formatDisplayDate(getTodayIST()), 50, 62);

  // Table
  const head = [['Date', 'Bill No', 'Diff (KG)', 'Sales (₹)', 'Credit (₹)', 'Paid (₹)', 'Status']];
  const body = entries.map((entry) => [
    formatDisplayDate(entry.date),
    entry.billNumber,
    formatNumber(entry.diffKg),
    formatINR(entry.salesRs),
    formatINR(entry.cashPartyAmount),
    formatINR(entry.amountPaid || 0),
    entry.status.toUpperCase(),
  ]);

  const foot = [[
    'GRAND TOTAL',
    '',
    formatNumber(entries.reduce((s, e) => s + (parseFloat(e.diffKg) || 0), 0)),
    formatINR(entries.reduce((s, e) => s + (parseFloat(e.salesRs) || 0), 0)),
    formatINR(totalAmount),
    formatINR(totalPaid),
    outstanding > 0 ? `OUTSTANDING: ${formatINR(outstanding)}` : 'SETTLED',
  ]];

  autoTable(pdfDoc, {
    startY: 70,
    head,
    body,
    foot,
    theme: 'striped',
    headStyles: { fillColor: [0, 48, 135] },
    footStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  // Outstanding Summary Card at bottom
  let finalY = pdfDoc.lastAutoTable.finalY + 15;
  if (finalY > 240) {
    pdfDoc.addPage();
    finalY = 20;
  }

  pdfDoc.setFillColor(245, 247, 250);
  pdfDoc.rect(14, finalY, 182, 35, 'F');
  pdfDoc.setDrawColor(0, 48, 135);
  pdfDoc.setLineWidth(0.5);
  pdfDoc.line(14, finalY, 14, finalY + 35);

  pdfDoc.setFontSize(10);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Summary Balance Dues:', 20, finalY + 10);
  
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text('Total Credit Extended:', 20, finalY + 18);
  pdfDoc.text(`${formatINR(totalAmount)}`, 70, finalY + 18);
  
  pdfDoc.text('Total Amount Settled:', 20, finalY + 26);
  pdfDoc.text(`${formatINR(totalPaid)}`, 70, finalY + 26);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Net Outstanding Balance:', 110, finalY + 18);
  pdfDoc.setFontSize(14);
  pdfDoc.setTextColor(226, 35, 26); // Adani Red
  pdfDoc.text(`${formatINR(outstanding)}`, 110, finalY + 28);

  // Signature box
  pdfDoc.setTextColor(0, 0, 0);
  pdfDoc.setFontSize(9);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text('Authorized Signature / Stamp', 196, finalY + 47, { align: 'right' });
  pdfDoc.setDrawColor(200, 200, 200);
  pdfDoc.line(146, finalY + 41, 196, finalY + 41);

  pdfDoc.save(`Invoice_${party.name}_${billNumber}.pdf`);
};

export const exportBillExcel = (allPartyData, stationName) => {
  const wb = XLSX.utils.book_new();

  allPartyData.forEach(({ party, entries, totalAmount, totalPaid, outstanding }) => {
    // Determine start/end date for subtitle
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const start = sorted[0]?.date ? formatDisplayDate(sorted[0].date) : 'N/A';
    const end = sorted[sorted.length - 1]?.date ? formatDisplayDate(sorted[sorted.length - 1].date) : 'N/A';

    const rows = [
      [sanitizeCellVal(stationName)],
      [`Credit Statement for: ${sanitizeCellVal(party.name)}`],
      [`Period: ${start} to ${end}`],
      [],
      [
        'Date',
        'Bill Number',
        'Difference (KG)',
        'Sales (₹)',
        'Credit Amount (₹)',
        'Paid Amount (₹)',
        'Payment Date',
        'Status'
      ],
      ...entries.map((entry) => [
        formatDisplayDate(entry.date),
        entry.billNumber,
        entry.diffKg,
        entry.salesRs,
        entry.cashPartyAmount,
        entry.amountPaid || 0,
        entry.paymentDate ? formatDisplayDate(entry.paymentDate) : '—',
        entry.status.toUpperCase(),
      ]),
      [
        'GRAND TOTAL',
        '',
        entries.reduce((s, e) => s + (parseFloat(e.diffKg) || 0), 0),
        entries.reduce((s, e) => s + (parseFloat(e.salesRs) || 0), 0),
        totalAmount,
        totalPaid,
        '',
        outstanding > 0 ? `OUTSTANDING: ${outstanding}` : 'SETTLED'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 16 }, { wch: 14 },
      { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }
    ];

    // Sheet names in Excel must be unique and <= 31 chars
    const sheetName = party.name.substring(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const filename = `Credit_Statement_${formatExportDate(getTodayIST())}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportAttendancePDF = (register, stationName, startDate, endDate, wage) => {
  const pdfDoc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  pdfDoc.setFontSize(16);
  pdfDoc.text(sanitizeCellVal(stationName), 14, 15);
  pdfDoc.setFontSize(11);
  pdfDoc.text(`Attendance & Payroll Register (${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)})`, 14, 22);
  pdfDoc.setFontSize(9);
  pdfDoc.text(`Base Wage: ${formatINR(wage)} / shift`, 14, 27);

  const dateCols = getDatesInRange(startDate, endDate);

  const head = [
    [
      'Employee Name',
      ...dateCols.map((d) => d.split('-')[2]),
      'Shifts',
      'Wage',
      'Advance',
      'Deduction',
      'Net Settle',
      'Status',
    ],
  ];

  const body = register.map((row) => {
    return [
      sanitizeCellVal(row.employee.name),
      ...dateCols.map((d) => {
        const shifts = row.byDate[d] || [];
        return shifts.sort().join(',');
      }),
      row.totalShifts,
      row.totalWage.toFixed(2),
      row.advanceGiven.toFixed(2),
      row.deductionAmount.toFixed(2),
      row.netPayable.toFixed(2),
      row.status.toUpperCase(),
    ];
  });

  // Calculate totals for footer
  const totalShiftsAll = register.reduce((s, r) => s + r.totalShifts, 0);
  const totalWageAll = register.reduce((s, r) => s + r.totalWage, 0);
  const totalAdvanceAll = register.reduce((s, r) => s + r.advanceGiven, 0);
  const totalDeductionAll = register.reduce((s, r) => s + r.deductionAmount, 0);
  const totalNetAll = register.reduce((s, r) => s + r.netPayable, 0);

  const foot = [
    [
      'TOTAL',
      ...dateCols.map(() => ''),
      totalShiftsAll,
      totalWageAll.toFixed(2),
      totalAdvanceAll.toFixed(2),
      totalDeductionAll.toFixed(2),
      totalNetAll.toFixed(2),
      '',
    ],
  ];

  autoTable(pdfDoc, {
    startY: 32,
    head,
    body,
    foot,
    theme: 'striped',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [0, 48, 135] },
    footStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  pdfDoc.save(`Attendance_${formatExportDate(startDate)}_to_${formatExportDate(endDate)}.pdf`);
};

export const exportAttendanceExcel = (register, stationName, startDate, endDate, wage) => {
  const wb = XLSX.utils.book_new();
  const dateCols = getDatesInRange(startDate, endDate);

  const rows = [
    [sanitizeCellVal(stationName)],
    [`Attendance & Payroll Register (${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)})`],
    [`Base Wage: ${wage} / shift`],
    [],
    [
      'Employee Name',
      ...dateCols.map((d) => d.split('-')[2]),
      'Total Shifts',
      'Total Wage (₹)',
      'Advance Taken (₹)',
      'Deductions (₹)',
      'Net Payable (₹)',
      'Status',
    ],
    ...register.map((row) => [
      sanitizeCellVal(row.employee.name),
      ...dateCols.map((d) => {
        const shifts = row.byDate[d] || [];
        return shifts.sort().join(',');
      }),
      row.totalShifts,
      row.totalWage,
      row.advanceGiven,
      row.deductionAmount,
      row.netPayable,
      row.status.toUpperCase(),
    ]),
    [
      'TOTAL',
      ...dateCols.map(() => ''),
      register.reduce((s, r) => s + r.totalShifts, 0),
      register.reduce((s, r) => s + r.totalWage, 0),
      register.reduce((s, r) => s + r.advanceGiven, 0),
      register.reduce((s, r) => s + r.deductionAmount, 0),
      register.reduce((s, r) => s + r.netPayable, 0),
      '',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set widths: first column wider, dates smaller, totals medium
  const cols = [{ wch: 18 }];
  dateCols.forEach(() => cols.push({ wch: 5 }));
  cols.push({ wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 10 });
  ws['!cols'] = cols;

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Register');

  const filename = `Attendance_${formatExportDate(startDate)}_to_${formatExportDate(endDate)}.xlsx`;
  XLSX.writeFile(wb, filename);
};
