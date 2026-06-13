import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import PriceHeader from './PriceHeader';
import ShiftRow from './ShiftRow';
import TotalRow from './TotalRow';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { calcRowTotals, calcDifference, calcSales } from '../../utils/calculations';
import { validateShift } from '../../utils/validators';


const createEmptyRow = (index) => ({
  rowIndex: index,
  nozzleId: '',
  nozzleName: '',
  nozzleIsActive: true,
  employeeId: '',
  employeeName: '',
  employeeIsActive: true,
  openingReading: 0,
  closingReading: 0,
  difference: 0,
  salesRs: 0,
  cash: 0,
  cc: 0,
  upi: 0,
  cashParty: 0,
  notes500: 0,
  notes200: 0,
  notes100: 0,
  notes50: 0,
  notes20: 0,
  notes10: 0,
  coins5: 0,
  coins2: 0,
  coins1: 0,
  hasNotes: false,
  isOpeningAutoFilled: false,
});

const ShiftGrid = ({ date, shiftNumber, shiftData, nozzles, employees, onSave, readOnly, carryoverData }) => {
  const [price, setPrice] = useState(shiftData?.price || 0);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [banner, setBanner] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [notesModalRowIndex, setNotesModalRowIndex] = useState(null);
  const [modalNotes, setModalNotes] = useState({
    notes500: 0,
    notes200: 0,
    notes100: 0,
    notes50: 0,
    notes20: 0,
    notes10: 0,
    coins5: 0,
    coins2: 0,
    coins1: 0,
  });

  const handleOpenNotesModal = (index) => {
    const row = rows[index];
    setNotesModalRowIndex(index);
    setModalNotes({
      notes500: row.notes500 || 0,
      notes200: row.notes200 || 0,
      notes100: row.notes100 || 0,
      notes50: row.notes50 || 0,
      notes20: row.notes20 || 0,
      notes10: row.notes10 || 0,
      coins5: row.coins5 || 0,
      coins2: row.coins2 || 0,
      coins1: row.coins1 || 0,
    });
  };

  // Initialize rows from shift data or nozzles
  useEffect(() => {
    if (shiftData?.rows?.length) {
      setRows(shiftData.rows);
      setPrice(shiftData.price || 0);
    } else {
      const activeNozzles = nozzles.filter((n) => n.isActive);
      const initialRows = activeNozzles.map((nozzle, i) => {
        const carryover = carryoverData?.[i];
        return {
          ...createEmptyRow(i),
          nozzleId: nozzle.id,
          nozzleName: nozzle.name,
          nozzleIsActive: true,
          openingReading: carryover?.openingReading || 0,
          isOpeningAutoFilled: !!carryover?.openingReading,
        };
      });
      setRows(initialRows);
    }
  }, [shiftData, nozzles, carryoverData]);

  // Recalculate totals when rows change
  useEffect(() => {
    setTotals(calcRowTotals(rows));
  }, [rows]);

  const handleRowChange = useCallback((index, updatedRow) => {
    setRows((prev) => prev.map((r, i) => (i === index ? updatedRow : r)));
  }, []);

  // Recalculate all rows when price changes
  const handlePriceChange = (newPrice) => {
    setPrice(newPrice);
    setRows((prev) =>
      prev.map((row) => {
        if (row.closingReading > 0 && row.openingReading > 0) {
          const diff = calcDifference(row.closingReading, row.openingReading);
          const sales = calcSales(diff, newPrice);
          const cc = parseFloat(row.cc) || 0;
          const upi = parseFloat(row.upi) || 0;
          const cashParty = parseFloat(row.cashParty) || 0;
          const cash = row.hasNotes
            ? (parseFloat(row.cash) || 0)
            : Math.max(0, parseFloat((sales - cc - upi - cashParty).toFixed(2)));
          return { ...row, difference: diff, salesRs: sales, cash };
        }
        return row;
      })
    );
  };

  const usedNozzleIds = rows.map((r) => r.nozzleId).filter(Boolean);

  const handleSave = async () => {
    const shiftPayload = { price, rows, carryoverApplied: !!carryoverData };
    const errors = validateShift(shiftPayload);

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowErrorModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave(date, shiftNumber, shiftPayload);
      if (result?.carryoverUpdated) {
        setBanner(`Shift ${shiftNumber < 3 ? shiftNumber + 1 : '1 (next day)'}'s opening readings have been updated`);
      }
      toast.success(`Shift ${shiftNumber} saved successfully`);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to save shift');
    } finally {
      setIsSaving(false);
    }
  };

  const isSaved = shiftData?.isSaved;
  const canEdit = isSaved && !readOnly;
  const isWritable = (!isSaved || isEditing) && !readOnly;

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <PriceHeader
        date={date}
        shiftNumber={shiftNumber}
        price={price}
        onPriceChange={handlePriceChange}
        readOnly={!isWritable}
      />

      {/* Carryover banner */}
      {banner && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border border-warning text-amber-800 text-sm">
          <span>⚠️ {banner}</span>
          <button onClick={() => setBanner('')} className="text-amber-600 hover:text-amber-800" aria-label="Dismiss banner">✕</button>
        </div>
      )}

      {/* Save success animation */}
      {showSaveSuccess && (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-200 animate-fade-in">
          <svg className="h-5 w-5 text-success animate-check-in" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-sm font-semibold text-green-700">Shift {shiftNumber} saved successfully!</span>
        </div>
      )}

      {/* Data grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="bg-adani-navy text-white">
              <th className="px-2 py-3 text-left text-xs font-semibold w-[150px]">Nozzle</th>
              <th className="px-2 py-3 text-left text-xs font-semibold w-[180px]">Employee</th>
              <th className="px-2 py-3 text-right text-xs font-semibold w-[130px]">Opening</th>
              <th className="px-2 py-3 text-right text-xs font-semibold w-[130px]">Closing</th>
              <th className="px-2 py-3 text-right text-xs font-semibold w-[110px]">Diff (KG)</th>
              <th className="px-2 py-3 text-right text-xs font-semibold w-[140px]">Sales (₹)</th>
              <th className="px-2 py-3 text-right text-xs font-semibold w-[110px]">CC</th>
              <th className="px-2 py-3 text-right text-xs font-semibold w-[110px]">UPI</th>
              <th className="px-2 py-3 text-right text-xs font-semibold w-[130px]">Cash</th>
              <th className="px-2 py-3 text-right text-xs font-semibold w-[110px]">Cash Party</th>
              <th className="px-2 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <ShiftRow
                key={i}
                row={row}
                index={i}
                striped={i % 2 === 1}
                nozzles={nozzles}
                employees={employees}
                usedNozzleIds={usedNozzleIds}
                price={price}
                onChange={handleRowChange}
                onOpenNotesModal={handleOpenNotesModal}
                readOnly={!isWritable}
                errors={validationErrors.find((e) => e.rowIndex === i + 1)?.errors}
              />
            ))}
            <TotalRow totals={totals} />
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 px-4 py-4 border-t border-gray-100">
        {readOnly && (
          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-adani-gray rounded-full">
            Read-Only
          </span>
        )}

        {canEdit && !isEditing && (
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit Shift {shiftNumber}
          </Button>
        )}

        {isWritable && (
          <Button onClick={handleSave} loading={isSaving}>
            Save Shift {shiftNumber}
          </Button>
        )}
      </div>

      {/* Validation Errors Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Validation Errors"
      >
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {validationErrors.map((rowErr, i) => (
            <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-error mb-1">
                {rowErr.nozzle} (Row {rowErr.rowIndex})
              </p>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                {rowErr.errors.map((err, j) => (
                  <li key={j}>{err.message || err}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Cash Notes Calculator Modal */}
      {notesModalRowIndex !== null && (() => {
        const selectedRow = rows[notesModalRowIndex];
        const expectedCash = selectedRow
          ? parseFloat(((selectedRow.salesRs || 0) - (selectedRow.cc || 0) - (selectedRow.upi || 0) - (selectedRow.cashParty || 0)).toFixed(2))
          : 0;
        const notesTotal =
          (modalNotes.notes500 || 0) * 500 +
          (modalNotes.notes200 || 0) * 200 +
          (modalNotes.notes100 || 0) * 100 +
          (modalNotes.notes50 || 0) * 50 +
          (modalNotes.notes20 || 0) * 20 +
          (modalNotes.notes10 || 0) * 10 +
          (modalNotes.coins5 || 0) * 5 +
          (modalNotes.coins2 || 0) * 2 +
          (modalNotes.coins1 || 0) * 1;
        const diff = expectedCash - notesTotal;

        return (
          <Modal
            isOpen={notesModalRowIndex !== null}
            onClose={() => setNotesModalRowIndex(null)}
            title={`Cash Notes — ${selectedRow?.nozzleName || `Row ${notesModalRowIndex + 1}`}`}
            maxWidth="450px"
          >
            <div className="space-y-4">
              <div className="text-sm text-gray-500 pb-2 border-b border-gray-100">
                Employee: <span className="font-semibold text-gray-800">{selectedRow?.employeeName || 'Unassigned'}</span>
              </div>

              {/* Notes grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 px-2 pb-1 border-b border-gray-100">
                  <span>Denomination</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-right">Amount (₹)</span>
                </div>

                {[
                  { label: '₹500 Note', value: 500, key: 'notes500' },
                  { label: '₹200 Note', value: 200, key: 'notes200' },
                  { label: '₹100 Note', value: 100, key: 'notes100' },
                  { label: '₹50 Note', value: 50, key: 'notes50' },
                  { label: '₹20 Note', value: 20, key: 'notes20' },
                  { label: '₹10 Note', value: 10, key: 'notes10' },
                  { label: '₹5 Coin', value: 5, key: 'coins5' },
                  { label: '₹2 Coin', value: 2, key: 'coins2' },
                  { label: '₹1 Coin', value: 1, key: 'coins1' },
                ].map((note) => {
                  const qty = modalNotes[note.key] === 0 ? '' : modalNotes[note.key];
                  const amt = (modalNotes[note.key] || 0) * note.value;
                  return (
                    <div key={note.key} className="grid grid-cols-3 items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded-md">
                      <span className="text-sm font-medium text-gray-700">{note.label}</span>
                      <div className="flex justify-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={qty}
                          disabled={!isWritable}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                            setModalNotes((prev) => ({ ...prev, [note.key]: val }));
                          }}
                          className="w-24 h-8 px-2 text-right text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-adani-navy focus:border-adani-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 text-right">
                        ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Comparison Section */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-1.5 text-sm border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Expected Cash (Sales - CC - UPI - Cash Party):</span>
                  <span className="font-semibold text-gray-900">₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Counted Cash Total:</span>
                  <span className="font-bold text-adani-navy">₹{notesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5">
                  <span className="font-medium text-gray-700">Difference:</span>
                  <span className={`font-bold ${diff === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {diff === 0 ? 'Balanced' : `₹${diff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2">
                {isWritable ? (
                  <button
                    type="button"
                    onClick={() => {
                      const updatedRow = {
                        ...selectedRow,
                        notes500: 0,
                        notes200: 0,
                        notes100: 0,
                        notes50: 0,
                        notes20: 0,
                        notes10: 0,
                        coins5: 0,
                        coins2: 0,
                        coins1: 0,
                        hasNotes: false,
                        cash: Math.max(0, parseFloat(((selectedRow.salesRs || 0) - (selectedRow.cc || 0) - (selectedRow.upi || 0) - (selectedRow.cashParty || 0)).toFixed(2))),
                      };
                      handleRowChange(notesModalRowIndex, updatedRow);
                      setNotesModalRowIndex(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium focus:outline-none"
                  >
                    Reset to Auto-filled
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setNotesModalRowIndex(null)}>
                    {isWritable ? 'Cancel' : 'Close'}
                  </Button>
                  {isWritable && (
                    <Button
                      onClick={() => {
                        const updatedRow = {
                          ...selectedRow,
                          notes500: modalNotes.notes500 || 0,
                          notes200: modalNotes.notes200 || 0,
                          notes100: modalNotes.notes100 || 0,
                          notes50: modalNotes.notes50 || 0,
                          notes20: modalNotes.notes20 || 0,
                          notes10: modalNotes.notes10 || 0,
                          coins5: modalNotes.coins5 || 0,
                          coins2: modalNotes.coins2 || 0,
                          coins1: modalNotes.coins1 || 0,
                          cash: notesTotal,
                          hasNotes: true,
                        };
                        handleRowChange(notesModalRowIndex, updatedRow);
                        setNotesModalRowIndex(null);
                      }}
                    >
                      Save Notes
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};

export default ShiftGrid;
