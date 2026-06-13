export const calcDifference = (closing, opening) =>
  parseFloat((closing - opening).toFixed(2));

export const calcSales = (difference, price) =>
  parseFloat((difference * price).toFixed(2));

export const calcRowTotals = (rows) => ({
  totalDifference: parseFloat(
    rows.reduce((sum, r) => sum + (r.difference || 0), 0).toFixed(2)
  ),
  totalSalesRs: parseFloat(
    rows.reduce((sum, r) => sum + (r.salesRs || 0), 0).toFixed(2)
  ),
  totalCash: parseFloat(
    rows.reduce((sum, r) => sum + (r.cash || 0), 0).toFixed(2)
  ),
  totalCC: parseFloat(
    rows.reduce((sum, r) => sum + (r.cc || 0), 0).toFixed(2)
  ),
  totalUPI: parseFloat(
    rows.reduce((sum, r) => sum + (r.upi || 0), 0).toFixed(2)
  ),
});

export const isReconciled = (row) =>
  parseFloat((row.cash + row.cc + row.upi).toFixed(2)) ===
  parseFloat((row.salesRs || 0).toFixed(2));
