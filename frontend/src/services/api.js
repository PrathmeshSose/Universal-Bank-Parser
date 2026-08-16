const TOKEN_KEY = "ubp_token";
const USER_KEY = "ubp_user";

let API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

API_BASE_URL = API_BASE_URL.replace(/\/+$/, "");

/* =========================================================
   API CONFIG
========================================================= */

export const setApiBaseUrl = (url) => {
  if (url) {
    API_BASE_URL = url.replace(/\/+$/, "");
  }
};

export const getApiBaseUrl = () => API_BASE_URL;

/* =========================================================
   AUTH
========================================================= */

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/* =========================================================
   LOGIN
========================================================= */

export const loginApi = async (email, password) => {
  if (!email?.trim() || !password) {
    throw new Error("Email and password are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = {
    id: `local-${Date.now()}`,
    name: normalizedEmail.split("@")[0],
    email: normalizedEmail,
    role: "USER",
  };

  const token = `local-token-${Date.now()}`;

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthToken(token);

  return {
    success: true,
    token,
    user,
  };
};

/* =========================================================
   REGISTER
========================================================= */

export const registerApi = async (name, email, password) => {
  if (!name?.trim() || !email?.trim() || !password) {
    throw new Error("Name, email and password are required.");
  }

  const user = {
    id: `local-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: "USER",
  };

  const token = `local-token-${Date.now()}`;

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthToken(token);

  return {
    success: true,
    token,
    user,
  };
};

/* =========================================================
   LOGOUT
========================================================= */

export const logoutApi = () => {
  clearAuthToken();
};

/* =========================================================
   BACKEND HEALTH
========================================================= */

export const checkBackendHealthApi = async () => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    return {
      connected: response.ok,
      status: response.status,
      serverData: data,
    };
  } catch (error) {
    return {
      connected: false,
      status: 0,
      error: error?.message || "Backend unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
};

/* =========================================================
   BANKS
========================================================= */

export const getBanksApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/banks`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && Array.isArray(data?.banks)) {
      return {
        success: true,
        banks: data.banks,
      };
    }
  } catch {
    // Local fallback
  }

  return {
    success: true,
    banks: [
      {
        id: "SBI",
        name: "State Bank of India",
      },
      {
        id: "HDFC",
        name: "HDFC Bank",
      },
      {
        id: "ICICI",
        name: "ICICI Bank",
      },
      {
        id: "Axis",
        name: "Axis Bank",
      },
    ],
  };
};

/* =========================================================
   UPLOAD BANK STATEMENT
========================================================= */

export const uploadBankStatementApi = async (
  file,
  bankName = "HDFC",
  password = ""
) => {
  if (!file) {
    throw new Error("No PDF file selected.");
  }

  if (!(file instanceof File)) {
    throw new Error("Invalid PDF file.");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed.");
  }

  if (file.size === 0) {
    throw new Error("The selected PDF is empty.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be 5 MB or smaller.");
  }

  if (!bankName?.trim()) {
    throw new Error("Please select a bank.");
  }

  const formData = new FormData();

  formData.append("document", file, file.name);
  formData.append("bankName", bankName.trim());

  if (password) {
    formData.append("password", password);
  }

  const token = getAuthToken();

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log("======================================");
  console.log("UPLOAD STARTED");
  console.log("File:", file.name);
  console.log("Size:", file.size);
  console.log("Type:", file.type);
  console.log("Bank:", bankName);
  console.log("Backend:", API_BASE_URL);
  console.log("======================================");

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      `Cannot connect to backend at ${API_BASE_URL}. Make sure backend is running.`
    );
  }

  const rawText = await response.text();

  let result = {};

  try {
    result = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(
      `Backend returned invalid JSON (${response.status}).`
    );
  }

  console.log("UPLOAD RESPONSE:", result);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error ||
        `Upload failed with HTTP ${response.status}.`
    );
  }

  if (result?.status !== "success") {
    throw new Error(
      result?.message || "Backend did not successfully process the PDF."
    );
  }

  const transactions =
    result?.data?.transactions ??
    result?.transactions ??
    result?.data ??
    [];

  if (!Array.isArray(transactions)) {
    throw new Error(
      "Backend returned no transaction array."
    );
  }

  return {
    success: true,
    status: "success",
    message:
      result?.message ||
      "PDF processed successfully.",
    data: result?.data,
    transactions,
    downloadUrl: result?.downloadUrl || null,
  };
};

/* =========================================================
   CSV EXPORT
========================================================= */

export const exportToGoogleSheetsApi = async (
  verifiedTransactions,
  spreadsheetId = null,
  sheetName = "Bank_Transactions"
) => {
  if (!Array.isArray(verifiedTransactions)) {
    throw new Error("Invalid transaction data.");
  }

  if (verifiedTransactions.length === 0) {
    throw new Error("There are no transactions to export.");
  }

  const escapeCsv = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    const text = String(value);

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n") ||
      text.includes("\r")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const headers = [
    "Date",
    "Description",
    "Previous Balance",
    "Debit",
    "Credit",
    "Current Balance",
    "Validation Status",
    "Line Number",
  ];

  const rows = verifiedTransactions.map((tx, index) => [
    tx.date || "",
    tx.description || "",
    tx.prevBalance ?? "",
    tx.debit ?? "",
    tx.credit ?? "",
    tx.currBalance ?? "",
    tx.flagged ? "Flagged" : "Valid",
    tx.lineNo ?? index + 1,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `${sheetName || "Bank_Transactions"}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  return {
    success: true,
    downloaded: true,
    message: "Transactions downloaded successfully.",
  };
};

/* =========================================================
   DEMO DATA
   ONLY FOR EXPLICIT DEMO BUTTON.
   NEVER USED BY REAL PDF UPLOAD.
========================================================= */

export const getMockSbiTransactions = () => [
  {
    id: "tx-101",
    lineNo: 1,
    date: "2026-07-01",
    description: "NEFT CREDIT - JULY SALARY",
    prevBalance: 150000,
    debit: 0,
    credit: 85000,
    currBalance: 235000,
  },
  {
    id: "tx-102",
    lineNo: 2,
    date: "2026-07-03",
    description: "ATM CASH WITHDRAWAL",
    prevBalance: 235000,
    debit: 10000,
    credit: 0,
    currBalance: 225000,
  },
  {
    id: "tx-103",
    lineNo: 3,
    date: "2026-07-05",
    description: "UPI PAYMENT - VENDOR SUPPLIES PVT LTD",
    prevBalance: 225000,
    debit: 45250,
    credit: 0,
    currBalance: 179750,
  },
  {
    id: "tx-104",
    lineNo: 4,
    date: "2026-07-08",
    description: "CHEQUE PAYMENT - VENDOR INVOICE #948210",
    prevBalance: 179750,
    debit: 20000,
    credit: 0,
    currBalance: 159750,
  },
  {
    id: "tx-105",
    lineNo: 5,
    date: "2026-07-11",
    description: "RTGS INWARD - DIVIDEND RECEIVED",
    prevBalance: 159750,
    debit: 0,
    credit: 32400,
    currBalance: 192150,
  },
  {
    id: "tx-106",
    lineNo: 6,
    date: "2026-07-14",
    description: "BILL PAYMENT - ELECTRICITY CHARGES",
    prevBalance: 192150,
    debit: 4150,
    credit: 0,
    currBalance: 188000,
  },
];