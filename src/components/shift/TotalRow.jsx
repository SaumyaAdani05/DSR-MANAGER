import { formatNumber } from '../../utils/formatters';

const TotalRow = ({ totals }) => {
  return (
    <tr className="bg-blue-50 border-t-2 border-adani-navy font-bold">
      <td className="px-2 py-3 text-sm text-adani-navy">TOTAL</td>
      <td className="px-2 py-3"></td>
      <td className="px-2 py-3"></td>
      <td className="px-2 py-3"></td>
      <td className="px-2 py-3 text-right text-sm text-adani-navy">
        {formatNumber(totals?.totalDifference || 0)} KG
      </td>
      <td className="px-2 py-3 text-right text-sm text-adani-navy">
        ₹{formatNumber(totals?.totalSalesRs || 0)}
      </td>
      <td className="px-2 py-3 text-right text-sm text-adani-navy">
        {formatNumber(totals?.totalCC || 0)}
      </td>
      <td className="px-2 py-3 text-right text-sm text-adani-navy">
        {formatNumber(totals?.totalUPI || 0)}
      </td>
      <td className="px-2 py-3 text-right text-sm text-adani-navy">
        {formatNumber(totals?.totalCash || 0)}
      </td>
    </tr>
  );
};

export default TotalRow;
