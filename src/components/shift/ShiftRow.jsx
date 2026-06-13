import { calcDifference, calcSales, isReconciled } from '../../utils/calculations';
import { formatNumber } from '../../utils/formatters';
import SearchDropdown from '../ui/SearchDropdown';

const ShiftRow = ({
  row,
  index,
  striped,
  nozzles,
  employees,
  usedNozzleIds,
  price,
  onChange,
  onOpenNotesModal,
  readOnly,
  errors,
}) => {
  const hasError = errors && errors.length > 0;
  const reconciled = row.salesRs > 0 ? isReconciled(row) : null;

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

    // Auto-calculate cash from salesRs, cc, upi, and cashParty if hasNotes is false
    if (!updated.hasNotes) {
      const sales = updated.salesRs || 0;
      const cc = parseFloat(updated.cc) || 0;
      const upi = parseFloat(updated.upi) || 0;
      const cashParty = parseFloat(updated.cashParty) || 0;
      updated.cash = Math.max(0, parseFloat((sales - cc - upi - cashParty).toFixed(2)));
    }

    onChange(index, updated);
  };

  const handleNozzleSelect = (nozzleId) => {
    const nozzle = nozzles.find((n) => n.id === nozzleId);
    onChange(index, {
      ...row,
      nozzleId,
      nozzleName: nozzle?.name || '',
      nozzleIsActive: nozzle?.isActive ?? true,
    });
  };

  const handleEmployeeSelect = (employeeId) => {
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
      
      const updatedRow = { ...row, difference: diff, salesRs: sales };
      
      if (!row.hasNotes) {
        const cc = parseFloat(row.cc) || 0;
        const upi = parseFloat(row.upi) || 0;
        const cashParty = parseFloat(row.cashParty) || 0;
        updatedRow.cash = Math.max(0, parseFloat((sales - cc - upi - cashParty).toFixed(2)));
      }
      onChange(index, updatedRow);
    }
  };

  // Map options for search dropdowns
  const nozzleOptions = nozzles.map((n) => ({
    id: n.id,
    name: n.name,
    disabled: usedNozzleIds.includes(n.id) && row.nozzleId !== n.id,
  }));

  const employeeOptions = employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    disabled: false,
  }));

  return (
    <tr
      className={`border-b border-gray-100 transition-colors duration-100
        ${hasError ? 'border-l-[3px] border-l-error bg-red-50/50' : ''}
        ${striped && !hasError ? 'bg-adani-navy/[0.02]' : ''}
        hover:bg-blue-50/60`}
    >
      {/* Nozzle Search Dropdown */}
      <td className="px-2 py-2 w-[150px]">
        <SearchDropdown
          options={nozzleOptions}
          value={row.nozzleId || ''}
          onChange={handleNozzleSelect}
          placeholder="Nozzle"
          disabled={readOnly}
        />
      </td>

      {/* Employee Search Dropdown */}
      <td className="px-2 py-2 w-[180px]">
        <SearchDropdown
          options={employeeOptions}
          value={row.employeeId || ''}
          onChange={handleEmployeeSelect}
          placeholder="Employee"
          disabled={readOnly}
        />
      </td>

      {/* Opening Reading */}
      <td className="px-2 py-2 w-[130px]">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.openingReading || ''}
          onChange={(e) => handleFieldChange('openingReading', parseFloat(e.target.value) || 0)}
          onBlur={handleBlur}
          disabled={readOnly}
          className={`w-full h-10 px-3 text-right text-sm border border-adani-border rounded-md
            focus:outline-none focus:ring-2 focus:ring-adani-navy
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${row.isOpeningAutoFilled ? 'italic text-adani-gray' : 'text-gray-900'}
          `}
          aria-label={`Opening reading for row ${index + 1}`}
        />
      </td>

      {/* Closing Reading */}
      <td className="px-2 py-2 w-[130px]">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.closingReading || ''}
          onChange={(e) => handleFieldChange('closingReading', parseFloat(e.target.value) || 0)}
          onBlur={handleBlur}
          disabled={readOnly}
          className="w-full h-10 px-3 text-right text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`Closing reading for row ${index + 1}`}
        />
      </td>

      {/* Difference (KG) */}
      <td className="px-2 py-2 w-[110px]">
        <div className="h-10 px-3 flex items-center justify-end text-sm bg-gray-50 rounded-md text-gray-700 cursor-not-allowed">
          {formatNumber(row.difference || 0)}
        </div>
      </td>

      {/* Sales (₹) */}
      <td className="px-2 py-2 w-[140px]">
        <div className="h-10 px-3 flex items-center justify-end text-sm bg-gray-50 rounded-md text-gray-700 cursor-not-allowed">
          {formatNumber(row.salesRs || 0)}
        </div>
      </td>

      {/* CC */}
      <td className="px-2 py-2 w-[110px]">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.cc ?? ''}
          onChange={(e) => handleFieldChange('cc', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          className="w-full h-10 px-3 text-right text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`Credit card for row ${index + 1}`}
        />
      </td>

      {/* UPI */}
      <td className="px-2 py-2 w-[110px]">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.upi ?? ''}
          onChange={(e) => handleFieldChange('upi', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          className="w-full h-10 px-3 text-right text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`UPI for row ${index + 1}`}
        />
      </td>

      {/* Cash (Auto-filled / Note Calculator) */}
      <td className="px-2 py-2 w-[130px]">
        <div className="relative flex items-center">
          <input
            type="text"
            readOnly
            value={formatNumber(row.cash || 0)}
            onClick={() => onOpenNotesModal(index)}
            className="w-full h-10 pl-3 pr-8 text-right text-sm border border-adani-border rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-adani-navy bg-gray-50 hover:bg-gray-100 font-semibold text-gray-900 transition-colors"
            aria-label={`Cash for row ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => onOpenNotesModal(index)}
            className="absolute right-2 text-adani-gray hover:text-adani-navy focus:outline-none"
            title={row.hasNotes ? 'View/Edit cash notes breakdown' : 'View/Enter cash notes breakdown'}
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

      {/* Cash Party */}
      <td className="px-2 py-2 w-[110px]">
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.cashParty ?? ''}
          onChange={(e) => handleFieldChange('cashParty', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          className="w-full h-10 px-3 text-right text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={`Cash party for row ${index + 1}`}
        />
      </td>

      {/* Reconciliation indicator */}
      {reconciled !== null && (
        <td className="px-1 py-2 w-8">
          {reconciled ? (
            <svg
              className="h-5 w-5 text-success"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="Balanced"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-warning"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="Mismatch"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </td>
      )}
    </tr>
  );
};

export default ShiftRow;
