/**
 * API Service Layer — connects to teammate's Express Node.js backend.
 * Uses Zero-Storage RAM streaming & Google Sheets Service Account integration.
 */

// Default backend API URL (can be changed dynamically via UI settings)
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
let IS_DEMO_MODE = true; // Enabled by default for immediate visual testing

export const setApiBaseUrl = (url) => {
  API_BASE_URL = url;
};

export const getApiBaseUrl = () => API_BASE_URL;

export const setDemoMode = (isDemo) => {
  IS_DEMO_MODE = isDemo;
};

export const isDemoModeActive = () => IS_DEMO_MODE;

/**
 * Upload Bank Statement PDF/Image to Backend (RAM Buffer / Zero Storage)
 */
export const uploadBankStatementApi = async (file, bankTemplate = 'sbi_auto') => {
  if (IS_DEMO_MODE) {
    console.log('[Demo Mode] Simulating AI extraction for file:', file.name);
    // Simulate server response delay for AI extraction
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      bankDetected: 'Auto Detected (Generic Format)',
      documentType: file.name.endsWith('.pdf') ? 'PDF Document' : 'Scanned Receipt',
      transactions: getMockSbiTransactions(),
    };
  }

  try {
    const formData = new FormData();
    formData.append('statement', file);
    formData.append('template', bankTemplate);

    const response = await fetch(`${API_BASE_URL}/api/upload-statement`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Backend error ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      bankDetected: data.bankDetected || 'Auto Detected',
      documentType: data.documentType || 'Bank Statement',
      transactions: data.transactions || [],
    };
  } catch (error) {
    console.warn('Backend API connection failed, falling back to local simulation:', error.message);
    throw error;
  }
};

/**
 * Push Verified Transactions to Google Sheets API
 */
export const exportToGoogleSheetsApi = async (verifiedTransactions, spreadsheetId, sheetName = 'Sheet1') => {
  if (IS_DEMO_MODE) {
    console.log('[Demo Mode] Simulating Service Account Google Sheets Sync:', { spreadsheetId, sheetName, rowCount: verifiedTransactions.length });
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return {
      success: true,
      spreadsheetId,
      sheetName,
      rowsExported: verifiedTransactions.length,
      googleSheetsUrl: spreadsheetId 
        ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` 
        : 'https://docs.google.com/spreadsheets/d/1sample_demo_sheet_id/edit',
      timestamp: new Date().toISOString()
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/export-sheets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spreadsheetId,
      sheetName,
      transactions: verifiedTransactions,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Export failed with status ${response.status}`);
  }

  return await response.json();
};

/**
 * Check backend connection status
 */
export const checkBackendHealthApi = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => ({ status: 'ok' }));
      return { connected: true, serverData: data };
    }
    return { connected: false, status: response.status };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

// Demo mock transaction data with 2 intentional math errors to demonstrate validation
export const getMockSbiTransactions = () => [
  {
    id: 'tx-101',
    lineNo: 1,
    date: '2026-07-01',
    description: 'NEFT CREDIT — JULY SALARY',
    prevBalance: 150000.00,
    debit: 0.00,
    credit: 85000.00,
    currBalance: 235000.00, // Correct: 150000 + 85000 = 235000
  },
  {
    id: 'tx-102',
    lineNo: 2,
    date: '2026-07-03',
    description: 'ATM CASH WITHDRAWAL',
    prevBalance: 235000.00,
    debit: 10000.00,
    credit: 0.00,
    currBalance: 225000.00, // Correct: 235000 - 10000 = 225000
  },
  {
    id: 'tx-103',
    lineNo: 3,
    date: '2026-07-05',
    description: 'UPI PAYMENT — VENDOR SUPPLIES PVT LTD',
    prevBalance: 225000.00,
    debit: 45250.00,
    credit: 0.00,
    currBalance: 184750.00, // ⚠️ DEMO ERROR: 225000 - 45250 = 179750 (Off by 5000)
  },
  {
    id: 'tx-104',
    lineNo: 4,
    date: '2026-07-08',
    description: 'CHEQUE PAYMENT — VENDOR INVOICE #948210',
    prevBalance: 179750.00,
    debit: 20000.00,
    credit: 0.00,
    currBalance: 159750.00, // Correct
  },
  {
    id: 'tx-105',
    lineNo: 5,
    date: '2026-07-11',
    description: 'RTGS INWARD — DIVIDEND RECEIVED',
    prevBalance: 159750.00,
    debit: 0.00,
    credit: 32400.00,
    currBalance: 195000.00, // ⚠️ DEMO ERROR: 159750 + 32400 = 192150 (Off by 2850)
  },
  {
    id: 'tx-106',
    lineNo: 6,
    date: '2026-07-14',
    description: 'BILL PAYMENT — ELECTRICITY CHARGES',
    prevBalance: 192150.00,
    debit: 4150.00,
    credit: 0.00,
    currBalance: 188000.00, // Correct
  }
];
