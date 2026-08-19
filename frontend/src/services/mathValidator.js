import { parseAmount } from '../utils/currencyFormatter.js';

/**
 * Mathematical Validation Engine (SRS FR-4.2, FR-4.3)
 * Formula: Current Balance = Previous Balance + Credit - Debit
 *
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} { auditedTransactions, stats, hasFlags, flagCount }
 */
export const auditTransactions = (transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      auditedTransactions: [],
      stats: { totalDebit: 0, totalCredit: 0, initialBalance: 0, finalBalance: 0 },
      hasFlags: false,
      flagCount: 0
    };
  }

  let totalDebit = 0;
  let totalCredit = 0;
  let flagCount = 0;

  const auditedTransactions = transactions.map((row, index) => {
    const debit = parseAmount(row.Debit || row.debit);
    const credit = parseAmount(row.Credit || row.credit);
    const reportedBalance = parseAmount(row.Balance || row.balance || row.currBalance);

    totalDebit += debit;
    totalCredit += credit;

    let isFlagged = false;
    let expectedBalance = reportedBalance;
    let diff = 0;

    // We can mathematically verify starting from row 1 using the previous row's balance
    if (index === 0) {
      if (debit > 0 && credit > 0) {
        isFlagged = true;
        flagCount++;
        diff = Math.abs(debit + credit);
      }
    } else if (index > 0) {
      const prevRow = transactions[index - 1];
      const prevBalance = parseAmount(prevRow.Balance || prevRow.balance || prevRow.currBalance);
      
      expectedBalance = prevBalance + credit - debit;
      diff = Math.abs(reportedBalance - expectedBalance);

      // Tolerate rounding difference under 0.05
      if (diff > 0.05 && reportedBalance !== 0) {
        isFlagged = true;
        flagCount++;
      }
    }

    return {
      ...row,
      _id: row._id || `tx_${index}_${Math.random().toString(36).slice(2, 9)}`,
      _index: index,
      _isFlagged: isFlagged,
      _expectedBalance: expectedBalance,
      _diff: diff
    };
  });

  const initialBalance = parseAmount(transactions[0]?.Balance || transactions[0]?.balance || 0);
  const finalBalance = parseAmount(transactions[transactions.length - 1]?.Balance || transactions[transactions.length - 1]?.balance || 0);

  return {
    auditedTransactions,
    stats: {
      totalDebit,
      totalCredit,
      initialBalance,
      finalBalance,
      rowCount: transactions.length
    },
    hasFlags: flagCount > 0,
    flagCount
  };
};
