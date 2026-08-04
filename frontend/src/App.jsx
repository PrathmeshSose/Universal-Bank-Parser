import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FileUpload } from './components/FileUpload';
import { DocumentViewer } from './components/DocumentViewer';
import { TransactionGrid } from './components/TransactionGrid';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ApiModal } from './components/ApiModal';
import { CorporateOverview } from './components/CorporateOverview';
import { validateAllTransactions } from './services/mathValidator';
import { uploadBankStatementApi, getMockSbiTransactions } from './services/api';
import { formatRupee, parseRupeeNumber } from './utils/currencyFormatter';
import { FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState('parser'); // 'parser' | 'corporate'
  const [selectedBank, setSelectedBank] = useState('sbi_auto');
  const [currentFile, setCurrentFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawTransactions, setRawTransactions] = useState(getMockSbiTransactions());
  const [validationResult, setValidationResult] = useState({
    validatedRows: [],
    hasErrors: true,
    totalErrors: 2,
    totalDebit: 0,
    totalCredit: 0,
    isFullyVerified: false,
  });

  // Modal States
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Recalculate math validation whenever raw transactions change
  useEffect(() => {
    const result = validateAllTransactions(rawTransactions);
    setValidationResult(result);
  }, [rawTransactions]);

  // Handle File Upload & Extraction
  const handleFileUpload = async (file) => {
    setCurrentFile(file);
    setIsProcessing(true);

    try {
      const response = await uploadBankStatementApi(file, selectedBank);
      setIsProcessing(false);
      if (response.transactions) {
        setRawTransactions(response.transactions);
      }
    } catch (err) {
      setIsProcessing(false);
      alert('Upload Error: ' + err.message);
    }
  };

  // Load Preset Sample Data
  const handleLoadSample = (type) => {
    if (type === 'sample1') {
      setCurrentFile({
        name: 'Demo_Statement_With_Math_Errors.pdf',
        size: 145000,
      });
      setRawTransactions(getMockSbiTransactions());
    } else {
      setCurrentFile({
        name: 'Demo_Statement_Clean_Verified.pdf',
        size: 98000,
      });
      // 4 clean transactions — all math is correct, no red errors
      setRawTransactions([
        { id: 'c-01', lineNo: 1, date: '2026-07-02', description: 'OPENING BALANCE CARRIED FORWARD', prevBalance: 50000.00, debit: 0, credit: 0, currBalance: 50000.00 },
        { id: 'c-02', lineNo: 2, date: '2026-07-05', description: 'NEFT CREDIT — MONTHLY SALARY', prevBalance: 50000.00, debit: 0, credit: 60000.00, currBalance: 110000.00 },
        { id: 'c-03', lineNo: 3, date: '2026-07-10', description: 'UPI PAYMENT — RENT TRANSFER', prevBalance: 110000.00, debit: 25000.00, credit: 0, currBalance: 85000.00 },
        { id: 'c-04', lineNo: 4, date: '2026-07-15', description: 'IMPS CREDIT — FREELANCE PAYMENT', prevBalance: 85000.00, debit: 0, credit: 15000.00, currBalance: 100000.00 },
      ]);
    }
  };

  // Handle Cell Editing (Inline Grid Edit)
  const handleUpdateCell = (rowId, field, newValue) => {
    setRawTransactions((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: newValue };
          // If numeric field updated, parse numeric value
          if (['prevBalance', 'debit', 'credit', 'currBalance'].includes(field)) {
            updated[field] = parseRupeeNumber(newValue);
          }
          return updated;
        }
        return row;
      })
    );
  };

  // Add New Row
  const handleAddRow = () => {
    const lastRow = rawTransactions[rawTransactions.length - 1];
    const prevBal = lastRow ? parseRupeeNumber(lastRow.currBalance) : 100000;

    const newRow = {
      id: `tx-${Date.now()}`,
      lineNo: rawTransactions.length + 1,
      date: new Date().toISOString().split('T')[0],
      description: 'NEW MANUAL TRANSACTION ITEM',
      prevBalance: prevBal,
      debit: 0.0,
      credit: 5000.0,
      currBalance: prevBal + 5000.0,
    };

    setRawTransactions([...rawTransactions, newRow]);
  };

  // Delete Row
  const handleDeleteRow = (rowId) => {
    setRawTransactions(rawTransactions.filter((r) => r.id !== rowId));
  };

  // Reset to Original Extracted Data
  const handleResetData = () => {
    setRawTransactions(getMockSbiTransactions());
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none">
      {/* Top Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiModal={() => setIsApiModalOpen(true)}
      />

      {/* Main Workspace Layout (Sidebar + Main Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {activeTab === 'corporate' ? (
            <CorporateOverview onOpenParser={() => setActiveTab('parser')} />
          ) : (
            <div className="space-y-5 animate-fade-in">
              {/* File Upload Zone */}
              <FileUpload
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
                selectedBank={selectedBank}
                setSelectedBank={setSelectedBank}
                onLoadSample={handleLoadSample}
              />

              {/* Split-Screen Verification Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
                {/* Left Pane: Document Previewer (5 Cols) */}
                <div className="lg:col-span-5 h-[560px]">
                  <DocumentViewer
                    currentFile={currentFile}
                    selectedBank={selectedBank}
                    transactions={validationResult.validatedRows}
                  />
                </div>

                {/* Right Pane: Interactive Editable Data Grid (7 Cols) */}
                <div className="lg:col-span-7 h-[560px] flex flex-col">
                  <TransactionGrid
                    transactions={validationResult.validatedRows}
                    onUpdateCell={handleUpdateCell}
                    onAddRow={handleAddRow}
                    onDeleteRow={handleDeleteRow}
                    onResetData={handleResetData}
                  />
                </div>
              </div>

              {/* Bottom Validation Status Summary & Export Bar */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-30">
                {/* Rupee Financial Metrics */}
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Total Debits</span>
                    <strong className="text-red-400 font-mono text-sm">{formatRupee(validationResult.totalDebit)}</strong>
                  </div>
                  <div className="h-6 w-px bg-slate-800 hidden sm:block" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Total Credits</span>
                    <strong className="text-emerald-400 font-mono text-sm">{formatRupee(validationResult.totalCredit)}</strong>
                  </div>
                  <div className="h-6 w-px bg-slate-800 hidden sm:block" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Verification Status</span>
                    {validationResult.totalErrors > 0 ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-950 text-red-300 font-bold px-2.5 py-0.5 rounded-full border border-red-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        {validationResult.totalErrors} Math Error(s) Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-950 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        100% Math Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Google Sheets Export Action */}
                <div className="flex items-center gap-3">
                  {validationResult.totalErrors > 0 && (
                    <span className="text-[11px] text-amber-300 hidden md:block">
                      💡 Click red cells to edit math &amp; unlock sync
                    </span>
                  )}
                  <button
                    onClick={() => setIsSheetsModalOpen(true)}
                    disabled={validationResult.totalErrors > 0}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition shadow-lg ${
                      validationResult.totalErrors > 0
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white animate-pulse'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Sync to Google Sheets (Service Account)
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        transactions={validationResult.validatedRows}
        errorCount={validationResult.totalErrors}
      />

      <ApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}

export default App;
