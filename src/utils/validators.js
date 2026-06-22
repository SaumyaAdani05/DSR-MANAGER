import { isReconciled } from './calculations.js';
import { PASSWORD_RULES } from './constants.js';

export const validateRow = (row, rowIndex) => {
  const errors = [];

  if (!row.nozzleId) errors.push({ field: 'Nozzle', message: 'Nozzle is required' });
  if (!row.employeeId) errors.push({ field: 'Employee', message: 'Employee is required' });
  if (!row.openingReading || row.openingReading <= 0)
    errors.push({ field: 'Opening Reading', message: 'Opening Reading must be greater than 0' });
  if (!row.closingReading || row.closingReading <= 0)
    errors.push({ field: 'Closing Reading', message: 'Closing Reading must be greater than 0' });
  if (row.closingReading < row.openingReading)
    errors.push({ field: 'Closing Reading', message: 'Closing Reading must be ≥ Opening Reading' });
  if (row.cash < 0) errors.push({ field: 'Cash', message: 'Cash cannot be negative' });
  if (row.cc < 0) errors.push({ field: 'CC', message: 'CC cannot be negative' });
  if (row.upi < 0) errors.push({ field: 'UPI', message: 'UPI cannot be negative' });
  if (row.cashParty < 0) errors.push({ field: 'Cash Party', message: 'Cash Party cannot be negative' });
  if (row.cashParty > 0 && !row.partyId) {
    errors.push({ field: 'Cash Party', message: 'Party selection is required when Cash Party amount is entered' });
  }
  if (row.salesRs > 0 && !isReconciled(row)) {
    const totalPayments = (row.cash || 0) + (row.cc || 0) + (row.upi || 0) + (row.cashParty || 0);
    errors.push({
      field: 'Reconciliation',
      message: `Cash + CC + UPI + Cash Party (${totalPayments.toFixed(2)}) ≠ Sales (${row.salesRs.toFixed(2)})`,
    });
  }

  return errors.length > 0 ? { rowIndex: rowIndex + 1, nozzle: row.nozzleName || `Row ${rowIndex + 1}`, errors } : null;
};

export const validateShift = (shiftData) => {
  const errors = [];

  if (!shiftData.price || shiftData.price <= 0) {
    errors.push({ rowIndex: 0, nozzle: 'Header', errors: [{ field: 'Price', message: "Today's Price must be greater than 0" }] });
  }

  shiftData.rows.forEach((row, i) => {
    const rowErrors = validateRow(row, i);
    if (rowErrors) errors.push(rowErrors);
  });

  return errors;
};

export const validatePassword = (password) => {
  const { minLength, maxLength } = PASSWORD_RULES;
  if (password.length < minLength || password.length > maxLength) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[@#$]/.test(password)) return false;
  return /^[A-Za-z\d@#$]{6,12}$/.test(password);
};

export const getPasswordErrors = (password) => {
  const errors = [];
  if (password.length < 6) errors.push('Minimum 6 characters');
  if (password.length > 12) errors.push('Maximum 12 characters');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/\d/.test(password)) errors.push('At least one number');
  if (!/[@#$]/.test(password)) errors.push('At least one special character (@, #, $)');
  return errors;
};

export const validateDailyRecord = (record) => {
  const errors = [];
  if (record.expenses && Array.isArray(record.expenses)) {
    record.expenses.forEach((exp, idx) => {
      const amt = parseFloat(exp.amount);
      if (isNaN(amt)) {
        errors.push(`Expense #${idx + 1} amount must be a number`);
      } else if (amt < 0) {
        errors.push(`Expense #${idx + 1} amount cannot be negative`);
      }
      if (amt > 0 && (!exp.note || !exp.note.trim())) {
        errors.push(`Expense #${idx + 1} description is required when amount is greater than 0`);
      }
    });
  }
  if (record.cms < 0) {
    errors.push('CMS cannot be negative');
  }
  return errors;
};
