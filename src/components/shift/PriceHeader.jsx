import { formatDisplayDate } from '../../utils/formatters';

const PriceHeader = ({ date, shiftNumber, price, onPriceChange, readOnly }) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 px-4 py-3 bg-adani-lightGray border-b border-adani-border">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-xs font-medium text-adani-gray">Date</span>
          <p className="text-sm font-semibold text-adani-navy">{formatDisplayDate(date)}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-adani-gray">Shift</span>
          <p className="text-sm font-semibold text-adani-navy">SHIFT {shiftNumber}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="price-input" className="text-xs font-medium text-adani-gray">
          Today&apos;s Price
        </label>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-adani-navy">₹</span>
          <input
            id="price-input"
            type="number"
            step="0.01"
            min="0"
            value={price || ''}
            onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
            disabled={readOnly}
            className={`w-24 h-9 px-2 text-right text-sm font-semibold border rounded-md
              focus:outline-none focus:ring-2 focus:ring-adani-navy
              ${readOnly ? 'bg-gray-100 text-adani-gray cursor-not-allowed' : 'bg-white text-adani-navy border-adani-border'}
            `}
            aria-label="Today's price per KG"
          />
          <span className="text-xs text-adani-gray">/KG</span>
        </div>
      </div>
    </div>
  );
};

export default PriceHeader;
