import { formatNumber } from '../../utils/formatters';

export default function DailySalesBar({ shiftData = {} }) {
  // Compute daily totals from saved shifts
  const totals = Object.values(shiftData).reduce(
    (acc, shift) => {
      if (!shift?.isSaved) return acc;
      const t = shift.totals || {};
      return {
        difference: acc.difference + (t.totalDifference || 0),
        salesRs: acc.salesRs + (t.totalSalesRs || 0),
        cash: acc.cash + (t.totalCash || 0),
        cc: acc.cc + (t.totalCC || 0),
        upi: acc.upi + (t.totalUPI || 0),
        cashParty: acc.cashParty + (t.totalCashParty || 0),
      };
    },
    { difference: 0, salesRs: 0, cash: 0, cc: 0, upi: 0, cashParty: 0 }
  );

  return (
    <div className="mt-6 bg-[#EFF6FF] border border-blue-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-xs font-bold text-adani-navy uppercase tracking-wider mb-3">
        DAILY TOTAL (All Saved Shifts)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Diff */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm transition-all duration-150 hover:shadow-md">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Sales Volume</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            {formatNumber(totals.difference)} <span className="text-xs font-normal">KG</span>
          </span>
        </div>

        {/* Sales */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm transition-all duration-150 hover:shadow-md">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Total Sales</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.salesRs)}
          </span>
        </div>

        {/* Cash */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm transition-all duration-150 hover:shadow-md">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Cash Collected</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.cash)}
          </span>
        </div>

        {/* CC */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm transition-all duration-150 hover:shadow-md">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Credit Card</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.cc)}
          </span>
        </div>

        {/* UPI */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm transition-all duration-150 hover:shadow-md">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">UPI / Digital</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.upi)}
          </span>
        </div>

        {/* Cash Party */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm transition-all duration-150 hover:shadow-md">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Cash Party</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.cashParty)}
          </span>
        </div>
      </div>
    </div>
  );
}
