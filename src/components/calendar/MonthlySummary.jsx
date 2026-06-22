import { formatNumber } from '../../utils/formatters';

export default function MonthlySummary({ monthName, year, totals }) {
  return (
    <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-5 shadow-sm mt-6">
      <h3 className="text-xs font-bold text-adani-navy uppercase tracking-wider mb-3">
        Monthly Summary — {monthName} {year}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {/* Diff */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Sales Volume</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            {formatNumber(totals.totalDifference || 0)} <span className="text-xs font-normal">KG</span>
          </span>
        </div>

        {/* Sales */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Total Sales</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.totalSalesRs || 0)}
          </span>
        </div>

        {/* Cash */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Cash Collected</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.totalCash || 0)}
          </span>
        </div>

        {/* CC */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Credit Card</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.totalCC || 0)}
          </span>
        </div>

        {/* UPI */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">UPI / Digital</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.totalUPI || 0)}
          </span>
        </div>

        {/* Cash Party */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Cash Party</span>
          <span className="text-base font-bold text-adani-navy mt-0.5 block">
            ₹{formatNumber(totals.totalCashParty || 0)}
          </span>
        </div>

        {/* Monthly Expense */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Monthly Expense</span>
          <span className="text-base font-bold text-amber-600 mt-0.5 block">
            ₹{formatNumber(totals.totalExpense || 0)}
          </span>
        </div>

        {/* CMS (Bank) */}
        <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">CMS (Bank)</span>
          <span className="text-base font-bold text-green-600 mt-0.5 block">
            ₹{formatNumber(totals.totalCMS || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
