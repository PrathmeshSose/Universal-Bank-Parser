import { useEffect, useMemo, useState } from "react";

import {
  ShieldCheck,
  Upload,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  FileText,
  Eye,
} from "lucide-react";

import {
  checkBackendHealthApi,
  uploadBankStatementApi,
  exportToGoogleSheetsApi,
  getMockSbiTransactions,
  logoutApi,
} from "./services/api";

import Login from "./components/Login";
import Register from "./components/Register";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import AdminPanel from "./components/AdminPanel";
import TransactionGrid from "./components/TransactionGrid";
import DocumentViewer from "./components/DocumentViewer";
import GoogleSheetsModal from "./components/GoogleSheetsModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function App() {
  /* =========================================================
     AUTHENTICATION
  ========================================================= */

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("ubp_user");

      if (!savedUser) {
        return null;
      }

      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Unable to restore user session:", error);
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    try {
      logoutApi();
    } catch (error) {
      console.error("Logout failed:", error);
    }

    localStorage.removeItem("ubp_user");
    localStorage.removeItem("ubp_token");

    setCurrentUser(null);
    setAuthMode("login");
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const [activeTab, setActiveTab] = useState("parser");
  const [adminSection, setAdminSection] = useState("users");

  /* =========================================================
     BACKEND
  ========================================================= */

  const [backendConnected, setBackendConnected] = useState(false);

  /* =========================================================
     FILE
  ========================================================= */

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* =========================================================
     TRANSACTIONS
  ========================================================= */

  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedBank, setSelectedBank] = useState("HDFC");

  /* =========================================================
     MODALS
  ========================================================= */

  const [showPdf, setShowPdf] = useState(false);
  const [showExport, setShowExport] = useState(false);

  /* =========================================================
     MESSAGES
  ========================================================= */

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =========================================================
     BACKEND HEALTH CHECK
  ========================================================= */

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    let mounted = true;

    const checkBackend = async () => {
      try {
        const result = await checkBackendHealthApi();

        if (!mounted) {
          return;
        }

        setBackendConnected(Boolean(result?.connected));
      } catch (err) {
        console.error("Backend health check failed:", err);

        if (mounted) {
          setBackendConnected(false);
        }
      }
    };

    checkBackend();

    const interval = setInterval(checkBackend, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

  /* =========================================================
     PREVIEW URL CLEANUP
  ========================================================= */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /* =========================================================
     FILE VALIDATION
  ========================================================= */

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return "Please select a file.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "File must be 5 MB or smaller.";
    }

    const fileName = selectedFile.name?.toLowerCase() || "";

    const validExtension =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg");

    const validMimeType = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ].includes(selectedFile.type);

    if (!validExtension && !validMimeType) {
      return "Only PDF, PNG and JPG files are supported.";
    }

    return null;
  };

  /* =========================================================
     HANDLE FILE
  ========================================================= */

  const handleFile = (selectedFile) => {
    setError("");
    setMessage("");

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreviewUrl(objectUrl);
    setShowPdf(false);
  };

  /* =========================================================
     FILE INPUT
  ========================================================= */

  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }

    event.target.value = "";
  };

  /* =========================================================
     DRAG & DROP
  ========================================================= */

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  /* =========================================================
     REMOVE FILE
  ========================================================= */

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl("");
    setShowPdf(false);
    setMessage("");
    setError("");
  };

  /* =========================================================
     NUMBER HELPER
  ========================================================= */

  const numberValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const cleaned = String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/\s/g, "")
      .trim();

    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
  };

  /* =========================================================
     NORMALIZE TRANSACTIONS
  ========================================================= */

  const normalizeTransactions = (data) => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item, index) => ({
      id:
        item?.id ??
        item?._id ??
        `tx-${Date.now()}-${index}`,

      lineNo:
        item?.lineNo ??
        item?.line ??
        index + 1,

      date:
        item?.date ??
        item?.Date ??
        "",

      description:
        item?.description ??
        item?.Description ??
        "",

      prevBalance: numberValue(
        item?.prevBalance ??
        item?.previousBalance ??
        item?.["Previous Balance"]
      ),

      debit: numberValue(
        item?.debit ??
        item?.Debit ??
        item?.withdrawal ??
        item?.Withdrawal
      ),

      credit: numberValue(
        item?.credit ??
        item?.Credit ??
        item?.deposit ??
        item?.Deposit
      ),

      currBalance: numberValue(
        item?.currBalance ??
        item?.currentBalance ??
        item?.balance ??
        item?.Balance
      ),

      flagged:
        item?.flagged === true ||
        item?.isValid === false ||
        item?.valid === false ||
        item?.validationStatus === "invalid",
    }));
  };

  /* =========================================================
     UPLOAD STATEMENT
  ========================================================= */

const handleUpload = async () => {
  if (!file) {
    setError("Please select a bank statement first.");
    return;
  }

  if (!backendConnected) {
    setError(
      "Backend server is offline (http://localhost:5000). Please start the backend to process uploaded statements."
    );
    setTransactions([]);
    return;
  }

  setUploading(true);
  setError("");
  setMessage("");

  try {
    const result = await uploadBankStatementApi(
      file,
      selectedBank
    );

    const extracted =
      result?.transactions ??
      result?.data?.transactions ??
      result?.data ??
      [];

    const normalized =
      normalizeTransactions(extracted);

    if (normalized.length > 0) {
      setTransactions(normalized);

      setMessage(
        `${normalized.length} transaction${
          normalized.length === 1 ? "" : "s"
        } extracted successfully.`
      );
    } else {
      setTransactions([]);
      setError(
        "No transactions were extracted from the uploaded statement."
      );
    }
  } catch (err) {
    console.error("Statement upload failed:", err);

    setTransactions([]);
    setError(
      err?.message ||
      "Unable to process the bank statement."
    );
  } finally {
    setUploading(false);
  }
};

  /* =========================================================
     DEMO DATA
  ========================================================= */

  const loadDemoData = () => {
    try {
      const demo = getMockSbiTransactions();

      const normalized = normalizeTransactions(demo);

      setTransactions(normalized);
      setFilter("all");
      setSearchTerm("");
      setError("");

      setMessage(
        "Demo statement loaded. Correct the flagged transactions to test validation."
      );
    } catch (err) {
      console.error("Demo data error:", err);

      setError(
        "Unable to load demo transaction data."
      );
    }
  };

  /* =========================================================
     CLEAN DEMO
  ========================================================= */

  const loadCleanDemoData = () => {
    const clean = [
      {
        id: "clean-1",
        lineNo: 1,
        date: "2026-07-01",
        description: "SALARY CREDIT",
        prevBalance: 50000,
        debit: 0,
        credit: 85000,
        currBalance: 135000,
      },
      {
        id: "clean-2",
        lineNo: 2,
        date: "2026-07-03",
        description: "UPI PAYMENT",
        prevBalance: 135000,
        debit: 5000,
        credit: 0,
        currBalance: 130000,
      },
      {
        id: "clean-3",
        lineNo: 3,
        date: "2026-07-06",
        description: "ATM WITHDRAWAL",
        prevBalance: 130000,
        debit: 10000,
        credit: 0,
        currBalance: 120000,
      },
      {
        id: "clean-4",
        lineNo: 4,
        date: "2026-07-10",
        description: "INTEREST CREDIT",
        prevBalance: 120000,
        debit: 0,
        credit: 1200,
        currBalance: 121200,
      },
    ];

    setTransactions(clean);
    setFilter("all");
    setSearchTerm("");
    setError("");

    setMessage("Clean verified demo data loaded.");
  };

  /* =========================================================
     TRANSACTION VALIDATION
  ========================================================= */

  const validateTransaction = (transaction) => {
    const previous = Number(
      transaction?.prevBalance || 0
    );

    const debit = Number(
      transaction?.debit || 0
    );

    const credit = Number(
      transaction?.credit || 0
    );

    const current = Number(
      transaction?.currBalance || 0
    );

    const calculated =
      previous - debit + credit;

    return (
      Math.abs(calculated - current) > 0.01
    );
  };

  /* =========================================================
     VALIDATED TRANSACTIONS
  ========================================================= */

  const validatedTransactions = useMemo(() => {
    return transactions.map((transaction) => ({
      ...transaction,
      flagged:
        validateTransaction(transaction),
    }));
  }, [transactions]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredTransactions = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return validatedTransactions.filter(
      (transaction) => {
        const matchesSearch =
          !query ||
          String(
            transaction.description || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(transaction.date || "")
            .toLowerCase()
            .includes(query) ||
          String(
            transaction.debit ?? ""
          ).includes(query) ||
          String(
            transaction.credit ?? ""
          ).includes(query);

        if (!matchesSearch) {
          return false;
        }

        if (filter === "flagged") {
          return transaction.flagged;
        }

        if (filter === "debits") {
          return Number(transaction.debit) > 0;
        }

        if (filter === "credits") {
          return Number(transaction.credit) > 0;
        }

        return true;
      }
    );
  }, [
    validatedTransactions,
    searchTerm,
    filter,
  ]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalTransactions =
    validatedTransactions.length;

  const flaggedTransactions =
    validatedTransactions.filter(
      (transaction) =>
        transaction.flagged
    ).length;

  const validTransactions =
    totalTransactions -
    flaggedTransactions;

  /* =========================================================
     ADD TRANSACTION
  ========================================================= */

  const handleAddRow = () => {
    const newTransaction = {
      id: `manual-${Date.now()}`,
      lineNo: transactions.length + 1,
      date: new Date()
        .toISOString()
        .slice(0, 10),
      description: "Manual transaction",
      prevBalance: 0,
      debit: 0,
      credit: 0,
      currBalance: 0,
    };

    setTransactions((current) => [
      ...current,
      newTransaction,
    ]);

    setMessage(
      "New transaction row added."
    );
  };

  /* =========================================================
     DELETE TRANSACTION
  ========================================================= */

  const handleDeleteRow = (id) => {
    setTransactions((current) =>
      current.filter(
        (transaction) =>
          transaction.id !== id
      )
    );

    setMessage("Transaction removed.");
  };

  /* =========================================================
     UPDATE TRANSACTION
  ========================================================= */

  const handleTransactionChange = (
    id,
    field,
    value
  ) => {
    setTransactions((current) =>
      current.map((transaction) => {
        if (transaction.id !== id) {
          return transaction;
        }

        const numericFields = [
          "debit",
          "credit",
          "prevBalance",
          "currBalance",
        ];

        return {
          ...transaction,
          [field]: numericFields.includes(
            field
          )
            ? numberValue(value)
            : value,
        };
      })
    );
  };

  /* =========================================================
     GOOGLE SHEETS EXPORT
  ========================================================= */

  const handleExport = async ({
    spreadsheetId,
    sheetName,
  } = {}) => {
    if (
      validatedTransactions.length === 0
    ) {
      setError(
        "There are no transactions to export."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      const result =
        await exportToGoogleSheetsApi(
          validatedTransactions,
          spreadsheetId || null,
          sheetName ||
          "Bank_Transactions"
        );

      setMessage(
        result?.message ||
        "Transactions exported successfully to Google Sheets."
      );

      setShowExport(false);
    } catch (err) {
      console.error(
        "Google Sheets export failed:",
        err
      );

      setError(
        err?.message ||
        "Google Sheets export failed."
      );

      throw err;
    }
  };

  /* =========================================================
     LOGIN / REGISTER
  ========================================================= */

  if (!currentUser) {
    if (authMode === "register") {
      return (
        <Register
          onRegister={handleRegister}
          onLogin={() =>
            setAuthMode("login")
          }
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onRegister={() =>
          setAuthMode("register")
        }
      />
    );
  }

  /* =========================================================
     MAIN DASHBOARD
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        backendConnected={
          backendConnected
        }
      />

      {/* MAIN LAYOUT */}

      <div className="flex min-h-[calc(100vh-102px)]">

        {/* SIDEBAR */}

        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          adminSection={adminSection}
          setAdminSection={
            setAdminSection
          }
          onOpenAdmin={(section) => {
            setAdminSection(
              section || "users"
            );
            setActiveTab("admin");
          }}
        />

        {/* CONTENT */}

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">

          {/* ADMIN */}

          {activeTab === "admin" ? (
            <AdminPanel
              currentUser={currentUser}
              initialSection={
                adminSection
              }
            />
          ) : (
            <>

              {/* PAGE HEADER */}

              <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                    Financial Document Processing
                  </p>

                  <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    Upload Bank Statement
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Upload a bank statement and let the parser extract, validate and structure your transactions.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">

                  <ShieldCheck
                    size={20}
                    className="text-emerald-600"
                  />

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Processing
                    </p>

                    <p className="text-xs font-semibold text-emerald-800">
                      Temporary RAM only
                    </p>
                  </div>

                </div>

              </section>

              {/* SUCCESS */}

              {message && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">

                  <CheckCircle2
                    size={18}
                  />

                  <span>
                    {message}
                  </span>

                  <button
                    type="button"
                    className="ml-auto"
                    onClick={() =>
                      setMessage("")
                    }
                  >
                    <X size={16} />
                  </button>

                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                  <AlertTriangle
                    size={18}
                  />

                  <span>
                    {error}
                  </span>

                  <button
                    type="button"
                    className="ml-auto"
                    onClick={() =>
                      setError("")
                    }
                  >
                    <X size={16} />
                  </button>

                </div>
              )}

              {/* UPLOAD CARD */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                <div className="flex flex-col gap-5">

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Bank Statement
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        PDF, PNG or JPG up to 5 MB.
                      </p>
                    </div>

                    <select
                      value={selectedBank}
                      onChange={(event) =>
                        setSelectedBank(
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="HDFC">
                        HDFC Bank
                      </option>

                      <option value="SBI">
                        State Bank of India
                      </option>

                      <option value="ICICI">
                        ICICI Bank
                      </option>
                    </select>

                  </div>

                  {/* DROP ZONE */}

                  <div
                    onDragOver={
                      handleDragOver
                    }
                    onDragLeave={
                      handleDragLeave
                    }
                    onDrop={handleDrop}
                    className={`rounded-2xl border-2 border-dashed p-8 text-center transition md:p-12 ${dragActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
                      }`}
                  >

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">

                      <Upload size={25} />

                    </div>

                    <h3 className="mt-4 text-base font-black text-slate-800">
                      Drop your bank statement here
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      or select a file from your computer
                    </p>

                    <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700">

                      <FileText size={15} />

                      Choose File

                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        onChange={
                          handleInputChange
                        }
                        className="hidden"
                      />

                    </label>

                    {/* SELECTED FILE */}

                    {file && (
                      <div className="mx-auto mt-5 flex max-w-md items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm">

                        <div className="flex min-w-0 items-center gap-3">

                          <FileText
                            size={18}
                            className="shrink-0 text-indigo-600"
                          />

                          <div className="min-w-0">

                            <p className="truncate text-xs font-bold text-slate-800">
                              {file.name}
                            </p>

                            <p className="text-[10px] text-slate-400">
                              {(
                                file.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>

                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={
                            removeFile
                          }
                          className="ml-3 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>

                      </div>
                    )}

                  </div>

                  {/* ACTIONS */}

                  <div className="flex flex-wrap items-center gap-2">

                    <button
                      type="button"
                      onClick={
                        handleUpload
                      }
                      disabled={
                        !file || uploading
                      }
                      className="flex items-center gap-2 rounded-xl bg-[#11152a] px-5 py-3 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <Upload size={15} />

                      {uploading
                        ? "Processing..."
                        : "Process Statement"}

                    </button>

                    <button
                      type="button"
                      onClick={
                        loadDemoData
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Load Demo
                    </button>

                    <button
                      type="button"
                      onClick={
                        loadCleanDemoData
                      }
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Clean Demo
                    </button>

                    {file && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowPdf(true)
                        }
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={15} />
                        Preview
                      </button>
                    )}

                  </div>

                </div>

              </section>

              {/* STATISTICS */}

              <section className="mt-6 grid gap-4 md:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Transactions
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {totalTransactions}
                  </p>

                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    Valid
                  </p>

                  <p className="mt-2 text-3xl font-black text-emerald-700">
                    {validTransactions}
                  </p>

                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                    Flagged
                  </p>

                  <p className="mt-2 text-3xl font-black text-red-700">
                    {flaggedTransactions}
                  </p>

                </div>

              </section>

              {/* TRANSACTIONS */}

              <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 p-5">

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                      <h2 className="text-lg font-black text-slate-900">
                        Transactions
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Review, edit and validate extracted transactions.
                      </p>

                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                      {/* SEARCH */}

                      <div className="relative">

                        <Search
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type="text"
                          value={
                            searchTerm
                          }
                          onChange={(
                            event
                          ) =>
                            setSearchTerm(
                              event.target
                                .value
                            )
                          }
                          placeholder="Search transactions..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-400 focus:bg-white sm:w-[220px]"
                        />

                      </div>

                      {/* FILTER */}

                      <select
                        value={filter}
                        onChange={(
                          event
                        ) =>
                          setFilter(
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-400"
                      >
                        <option value="all">
                          All
                        </option>

                        <option value="flagged">
                          Flagged
                        </option>

                        <option value="debits">
                          Debits
                        </option>

                        <option value="credits">
                          Credits
                        </option>
                      </select>

                      {/* ADD ROW */}

                      <button
                        type="button"
                        onClick={
                          handleAddRow
                        }
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                      >
                        <Plus size={15} />
                        Add Row
                      </button>

                      {/* EXPORT */}

                      <button
                        type="button"
                        onClick={() =>
                          setShowExport(
                            true
                          )
                        }
                        disabled={
                          validatedTransactions.length ===
                          0
                        }
                        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download
                          size={15}
                        />
                        Export
                      </button>

                    </div>

                  </div>

                </div>

                <TransactionGrid
                  transactions={
                    filteredTransactions
                  }
                  onChange={
                    handleTransactionChange
                  }
                  onDelete={
                    handleDeleteRow
                  }
                />

              </section>

            </>
          )}

        </main>

      </div>

      {/* PDF VIEWER */}

      {showPdf && file && (
        <DocumentViewer
          file={file}
          previewUrl={previewUrl}
          onClose={() =>
            setShowPdf(false)
          }
        />
      )}

      {/* GOOGLE SHEETS MODAL */}

      {showExport && (
        <GoogleSheetsModal
          transactions={
            validatedTransactions
          }
          onClose={() =>
            setShowExport(false)
          }
          onExport={handleExport}
        />
      )}

    </div>
  );
}

export default App;
