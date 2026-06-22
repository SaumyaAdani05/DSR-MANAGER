// DSR Manager — Automated Validation and Security Testing Suite
import assert from 'assert';

// Mock localStorage globally for testing rate limiting in Node
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// Import code to test
import { validatePassword, validateRow, validateShift, validateDailyRecord } from './src/utils/validators.js';
import { sanitizeCellVal } from './src/services/exportService.js';
import { checkLockout, recordFailure, resetAttempts } from './src/utils/rateLimiter.js';

let passedTests = 0;
let failedTests = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(error);
    failedTests++;
  }
};

console.log('====================================================');
console.log('RUNNING DSR MANAGER SECURITY AND VALIDATION TESTS...');
console.log('====================================================\n');

// 1. Password Rules Testing
test('Password validation - strong rules', () => {
  // Meet all rules: uppercase, lowercase, digit, special, 6-12 chars
  assert.strictEqual(validatePassword('Adani@mem051'), true, 'Valid password rejected');
  assert.strictEqual(validatePassword('A1@a2#'), true, 'Valid short password rejected');
  
  // Too short
  assert.strictEqual(validatePassword('A1@a'), false, 'Too short password allowed');
  // Too long
  assert.strictEqual(validatePassword('Adani@mem0510123'), false, 'Too long password allowed');
  // Missing uppercase
  assert.strictEqual(validatePassword('adani@mem05'), false, 'Password without uppercase allowed');
  // Missing lowercase
  assert.strictEqual(validatePassword('ADANI@MEM05'), false, 'Password without lowercase allowed');
  // Missing special character
  assert.strictEqual(validatePassword('Adanimem0510'), false, 'Password without special char allowed');
  // Invalid special character (only @, #, $ are allowed)
  assert.strictEqual(validatePassword('Adani%mem05'), false, 'Password with invalid special char allowed');
});

// 2. Row/Shift Validation Testing
test('Row validation - input boundaries & reconciliation', () => {
  // Valid row
  const validRow = {
    nozzleId: 'n-1',
    employeeId: 'emp-1',
    nozzleName: 'N1',
    employeeName: 'Ramesh',
    openingReading: 100.0,
    closingReading: 200.0,
    difference: 100.0,
    salesRs: 9600.0,
    cash: 5000.0,
    cc: 2000.0,
    upi: 2000.0,
    cashParty: 600.0,
    partyId: 'party-1',
    partyName: 'Ramesh Trucking'
  };
  assert.strictEqual(validateRow(validRow, 0), null, 'Valid row should return no errors');

  // Invalid readings: closing < opening
  const invalidReadingsRow = {
    ...validRow,
    openingReading: 200.0,
    closingReading: 150.0
  };
  const readErrors = validateRow(invalidReadingsRow, 0);
  assert.notStrictEqual(readErrors, null, 'Closing < Opening must be rejected');
  assert.ok(readErrors.errors.some(e => e.message.includes('Closing Reading must be ≥ Opening Reading')));

  // Negative payment value
  const negativePaymentRow = {
    ...validRow,
    cc: -100.0
  };
  const negErrors = validateRow(negativePaymentRow, 0);
  assert.notStrictEqual(negErrors, null, 'Negative payments must be rejected');
  assert.ok(negErrors.errors.some(e => e.message.includes('CC cannot be negative')));

  // Negative expense value for daily record
  const negativeExpenseRecord = {
    expenses: [{ amount: -50.0, note: 'Tea' }],
    cms: 100.0
  };
  const negExpenseErrors = validateDailyRecord(negativeExpenseRecord);
  assert.ok(negExpenseErrors.length > 0, 'Negative expense must be rejected');
  assert.ok(negExpenseErrors.some(e => e.includes('amount cannot be negative')), 'Expected negative amount error');

  // Missing expense description for positive amount
  const missingNoteRecord = {
    expenses: [{ amount: 50.0, note: '' }],
    cms: 100.0
  };
  const missingNoteErrors = validateDailyRecord(missingNoteRecord);
  assert.ok(missingNoteErrors.length > 0, 'Missing note for positive expense must be rejected');
  assert.ok(missingNoteErrors.some(e => e.includes('description is required')), 'Expected description required error');

  // Negative CMS value for daily record
  const negativeCMSRecord = {
    expenses: [{ amount: 50.0, note: 'Tea' }],
    cms: -100.0
  };
  const negCMSErrors = validateDailyRecord(negativeCMSRecord);
  assert.ok(negCMSErrors.length > 0, 'Negative CMS must be rejected');
  assert.ok(negCMSErrors.some(e => e.includes('CMS cannot be negative')), 'Expected negative CMS error');

  // Mismatch reconciliation (payments != sales)
  const unreconciledRow = {
    ...validRow,
    cash: 1000.0 // total payments: 1000 + 2000 + 2000 + 600 = 5600 != 9600
  };
  const reconErrors = validateRow(unreconciledRow, 0);
  assert.notStrictEqual(reconErrors, null, 'Unreconciled row must return errors');
  assert.ok(reconErrors.errors.some(e => e.field === 'Reconciliation'));
});

// 3. Formula Injection Sanitization Testing
test('Excel Export - Formula Injection Sanitization', () => {
  // Neutralize characters: =, +, -, @
  assert.strictEqual(sanitizeCellVal('=SUM(A1:A10)'), '\'=SUM(A1:A10)', 'Formula injection not neutralized');
  assert.strictEqual(sanitizeCellVal('+123'), '\'+123', 'Plus prefix not neutralized');
  assert.strictEqual(sanitizeCellVal('-456'), '\'-456', 'Minus prefix not neutralized');
  assert.strictEqual(sanitizeCellVal('@test'), '\'@test', 'At prefix not neutralized');
  
  // Normal strings and numbers should remain unmodified
  assert.strictEqual(sanitizeCellVal('N1'), 'N1', 'Valid string modified incorrectly');
  assert.strictEqual(sanitizeCellVal(100.25), 100.25, 'Numeric values modified incorrectly');
  assert.strictEqual(sanitizeCellVal('Memnagar CNG'), 'Memnagar CNG', 'Valid station name modified');
});

// 4. Rate Limiter Testing
test('Rate Limiter - lockouts & progressive delays', () => {
  const key = 'test@example.com';
  
  // Starts with 0 attempts and no lockout
  let status = checkLockout(key);
  assert.strictEqual(status.locked, false);
  assert.strictEqual(status.attempts, 0);
  assert.strictEqual(status.delayMs, 0);

  // 1st failed attempt
  recordFailure(key);
  status = checkLockout(key);
  assert.strictEqual(status.attempts, 1);
  assert.strictEqual(status.delayMs, 0);

  // 3rd failed attempt starts progressive delay (baseDelayMs * 2^(3-3) = 1s)
  recordFailure(key); // 2nd
  recordFailure(key); // 3rd
  status = checkLockout(key);
  assert.strictEqual(status.attempts, 3);
  assert.strictEqual(status.delayMs, 1000);

  // 4th failed attempt delay (baseDelayMs * 2^(4-3) = 2s)
  recordFailure(key);
  status = checkLockout(key);
  assert.strictEqual(status.attempts, 4);
  assert.strictEqual(status.delayMs, 2000);

  // 5th failed attempt locks out user for 5 minutes
  recordFailure(key);
  status = checkLockout(key);
  assert.strictEqual(status.locked, true);
  assert.ok(status.remainingTime > 0);

  // Resetting attempts clears lockout
  resetAttempts(key);
  status = checkLockout(key);
  assert.strictEqual(status.locked, false);
  assert.strictEqual(status.attempts, 0);
  assert.strictEqual(status.delayMs, 0);
});

console.log('\n====================================================');
console.log(`TEST SUMMARY: Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
