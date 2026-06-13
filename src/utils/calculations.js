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
  totalCashParty: parseFloat(
    rows.reduce((sum, r) => sum + (r.cashParty || 0), 0).toFixed(2)
  ),
});

export const isReconciled = (row) => {
  const cash = parseFloat(row.cash) || 0;
  const cc = parseFloat(row.cc) || 0;
  const upi = parseFloat(row.upi) || 0;
  const cashParty = parseFloat(row.cashParty) || 0;
  const sales = parseFloat(row.salesRs) || 0;
  
  return parseFloat((cash + cc + upi + cashParty).toFixed(2)) === parseFloat(sales.toFixed(2));
};
