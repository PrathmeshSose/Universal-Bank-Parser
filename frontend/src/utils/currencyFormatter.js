/**
 * Financial Currency and Number Formatters
 */

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/,/g, ''));
  if (isNaN(num)) return amount;

  if (currency === 'INR') {
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const parseAmount = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  
  const strVal = String(val).trim();
  const isNegative = strVal.startsWith('-') || (strVal.startsWith('(') && strVal.endsWith(')')) || strVal.toUpperCase().endsWith('DR');

  const cleaned = strVal.replace(/[^0-9.]+/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) return 0;
  return isNegative ? -Math.abs(parsed) : Math.abs(parsed);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return dateStr.trim();
};
