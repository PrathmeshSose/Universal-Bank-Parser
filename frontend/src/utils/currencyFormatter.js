/**
 * Utility functions for Indian Rupee formatting and numerical parsing.
 */

export const formatRupee = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? "₹0.00" : "0.00";
  }

  const num = Number(amount);

  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return showSymbol ? `₹${formatted}` : formatted;
};

export const parseRupeeNumber = (val) => {
  if (typeof val === "number") {
    return val;
  }

  if (!val) {
    return 0;
  }

  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  const parsed = parseFloat(cleaned);

  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatRupeeCompact = (amount) => {
  const num = Number(amount);

  if (Number.isNaN(num)) {
    return "₹0";
  }

  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }

  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }

  if (Math.abs(num) >= 1000) {
    return `₹${(num / 1000).toFixed(1)} K`;
  }

  return `₹${num.toFixed(2)}`;
};