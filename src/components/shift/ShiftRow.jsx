import { calcDifference, calcSales } from '../../utils/calculations';
import { formatNumber } from '../../utils/formatters';

const ShiftRow = ({ row, index, nozzles, employees, usedNozzleIds, price, onChange, onOpenNotesModal, readOnly, errors }) => {
  const hasError = errors && errors.length > 0;

  const handleFieldChange = (field, value) => {
    const updated = { ...row, [field]: value };

    // Recalculate on closing reading change
    if (field === 'closingReading' || field === 'openingReading') {
      const opening = field === 'openingReading' ? parseFloat(value) || 0 : parseFloat(row.openingReading) || 0;
      const closing = field === 'closingReading' ? parseFloat(value) || 0 : parseFloat(row.closingReading) || 0;
      if (closing >= opening && opening > 0) {
        updated.difference = calcDifference(closing, opening);
        updated.salesRs = calcSales(updated.difference, price);
      }
    }

    // Clear auto-fill flag when opening reading is manually edited
    if (field === 'openingReading') {
      updated.isOpeningAutoFilled = false;
    }

    // Auto-calculate cash from salesRs, cc, and upi if hasNotes is false
    if (!updated.hasNotes) {
      const sales = updated.salesRs || 0;
      const cc = parseFloat(updated.cc) || 0;
      const upi = parseFloat(updated.upi) || 0;
      updated.cash = Math.max(0, parseFloat((sales - cc - upi).toFixed(2)));
    }

    onChange(index, updated);
  };

  const handleNozzleChange = (e) => {
    const nozzleId = e.target.value;
    const nozzle = nozzles.find((n) => n.id === nozzleId);
    handleFieldChange('nozzleId', nozzleId);
    onChange(index, {
      ...row,
      nozzleId,
      nozzleName: nozzle?.name || '',
      nozzleIsActive: nozzle?.isActive ?? true,
    });
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const employee = employees.find((emp) => emp.id === employeeId);
    onChange(index, {
      ...row,
      employeeId,
      employeeName: employee?.name || '',
      employeeIsActive: employee?.isActive ?? true,
    });
  };

  const handleBlur = () => {
    const opening = parseFloat(row.openingReading) || 0;
    const closing = parseFloat(row.closingReading) || 0;
    if (closing >= opening && opening > 0) {
      const diff = calcDifference(closing, opening);
      const sales = calcSales(diff, price);
      onChange(index, { ...row, difference: diff, salesRs: sales });
    }
  };

  return (
    <tr className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors
      ${hasError ? 'border-l-[3px] border-l-error bg-red-50/50' : ''}
    `}>
      {/* Nozzle */}
      <td className="px-2 py-2">
        <select
          value={row.nozzleId || ''}
          onChange={handleNozzleChange}
          disabled={readOnly}
          className="w-full h-9 px-2 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`Nozzle for row ${index + 1}`}
        >
          <option value="">Select</option>
          {nozzles.map((n) => (
            <option
              key={n.id}
              value={n.id}
              disabled={usedNozzleIds.includes(n.id) && row.nozzleId !== n.id}
              className={!n.isActive ? 'text-greyedOut' : ''}
            >
              {n.name}
            </option>
          ))}
        </select>
      </td>

      {/* Employee */}
      <td className="px-2 py-2">
        <select
          value={row.employeeId || ''}
          onChange={handleEmployeeChange}
          disabled={readOnly}
          className="w-full h-9 px-2 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`Employee for row ${index + 1}`}
        >
          <option value="">Select</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id} className={!emp.isActive ? 'text-greyedOut' : ''}>
              {emp.name}
            </option>
          ))}
        </select>
      </td>

      {/* Opening Reading */}
      <td className="px-2 py-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.openingReading || ''}
          onChange={(e) => handleFieldChange('openingReading', parseFloat(e.target.value) || 0)}
          onBlur={handleBlur}
          disabled={readOnly}
          className={`w-full h-9 px-2 text-right text-sm border border-adani-border rounded-md
            focus:outline-none focus:ring-2 focus:ring-adani-navy
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${row.isOpeningAutoFilled ? 'italic text-adani-gray' : 'text-gray-900'}
          `}
          aria-label={`Opening reading for row ${index + 1}`}
        />
      </td>

      {/* Closing Reading */}
      <td className="px-2 py-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.closingReading || ''}
          onChange={(e) => handleFieldChange('closingReading', parseFloat(e.target.value) || 0)}
          onBlur={handleBlur}
          disabled={readOnly}
          className="w-full h-9 px-2 text-right text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`Closing reading for row ${index + 1}`}
        />
      </td>

      {/* Difference (KG) */}
      <td className="px-2 py-2">
        <div className="h-9 px-2 flex items-center justify-end text-sm bg-gray-50 rounded-md text-gray-700 cursor-not-allowed">
          {formatNumber(row.difference || 0)}
        </div>
      </td>

      {/* Sales (₹) */}
      <td className="px-2 py-2">
        <div className="h-9 px-2 flex items-center justify-end text-sm bg-gray-50 rounded-md text-gray-700 cursor-not-allowed">
          {formatNumber(row.salesRs || 0)}
        </div>
      </td>

      {/* CC */}
      <td className="px-2 py-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.cc ?? ''}
          onChange={(e) => handleFieldChange('cc', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          className="w-full h-9 px-2 text-right text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`Credit card for row ${index + 1}`}
        />
      </td>

      {/* UPI */}
      <td className="px-2 py-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.upi ?? ''}
          onChange={(e) => handleFieldChange('upi', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          className="w-full h-9 px-2 text-right text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`UPI for row ${index + 1}`}
        />
      </td>

      {/* Cash (Auto-filled / Note Calculator) */}
      <td className="px-2 py-2">
        <div className="relative flex items-center">
          <input
            type="text"
            readOnly
            value={formatNumber(row.cash || 0)}
            onClick={() => onOpenNotesModal(index)}
            className="w-full h-9 pl-2 pr-8 text-right text-sm border border-adani-border rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-adani-navy bg-gray-50 hover:bg-gray-100 font-semibold text-gray-900 transition-colors"
            aria-label={`Cash for row ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => onOpenNotesModal(index)}
            className="absolute right-2 text-adani-gray hover:text-adani-navy focus:outline-none"
            title={row.hasNotes ? "View/Edit cash notes breakdown" : "View/Enter cash notes breakdown"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-gray-500 hover:text-adani-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {row.hasNotes ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              )}
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ShiftRow;
