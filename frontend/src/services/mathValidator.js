import { parseRupeeNumber } from '../utils/currencyFormatter';

/**
 * Validates a single transaction row.
 * Mathematical Check: Previous Balance - Debit + Credit = Current Balance
 */
export const validateTransactionRow = (row) => {
  const prevBal = parseRupeeNumber(row.prevBalance);
  const debit = parseRupeeNumber(row.debit);
  const credit = parseRupeeNumber(row.credit);
  const currBal = parseRupeeNumber(row.currBalance);

  // Expected Balance = Prev Balance - Debit + Credit
  const expectedCurrBal = prevBal - debit + credit;
  const difference = Math.abs(currBal - expectedCurrBal);

  const isValid = difference < 0.01; // floating point tolerance

  return {
    isValid,
    expectedCurrBal,
    difference,
    errorField: isValid ? null : 'currBalance',
    errorMessage: isValid
      ? null
      : `Math discrepancy: Expected ₹${expectedCurrBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} but found ₹${currBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Diff: ₹${difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`
  };
};

/**
 * Validates an array of transaction rows and checks sequential integrity
 */
export const validateAllTransactions = (transactions) => {
  let hasErrors = false;
  let totalErrors = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  const validatedRows = transactions.map((row, index) => {
    const rowValidation = validateTransactionRow(row);
    
    // Calculate total debits & credits
    totalDebit += parseRupeeNumber(row.debit);
    totalCredit += parseRupeeNumber(row.credit);

    if (!rowValidation.isValid) {
      hasErrors = true;
      totalErrors++;
    }

    return {
      ...row,
      validation: rowValidation,
    };
  });

  return {
    validatedRows,
    hasErrors,
    totalErrors,
    totalDebit,
    totalCredit,
    isFullyVerified: totalErrors === 0 && transactions.length > 0
  };
};
