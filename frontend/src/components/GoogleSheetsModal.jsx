import React, { useState } from 'react';
import { FileSpreadsheet, CheckCircle2, ShieldCheck, AlertTriangle, Loader2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportToGoogleSheetsApi } from '../services/api';

export const GoogleSheetsModal = ({ isOpen, onClose, transactions, errorCount }) => {
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('Bank_Transactions');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessData, setSyncSuccessData] = useState(null);
  const [syncError, setSyncError] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSyncSuccessData(null);
    setSyncError(null);
    onClose();
  };

  const handleExport = async (e) => {
    e.preventDefault();
    if (errorCount > 0) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await exportToGoogleSheetsApi(transactions, sheetId, sheetName);
      setIsSyncing(false);
      setSyncSuccessData(result);

      // Celebratory confetti!
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      setIsSyncing(false);
      setSyncError(err.message || 'Failed to sync with Google Sheets API');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Sync to Google Sheets</h3>
              <p className="text-xs text-purple-200">Service Account Push — Zero Storage</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {syncSuccessData ? (
            /* ─── Success View ─── */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800">Synced Successfully! 🎉</h4>
                <p className="text-slate-500 mt-1">
                  <strong>{syncSuccessData.rowsExported} verified rows</strong> exported to Google Sheets.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left space-y-1.5 text-emerald-950 text-[11px]">
                <div>📋 Sheet Tab: <strong>{syncSuccessData.sheetName}</strong></div>
                <div>🕐 Time: <strong>{new Date().toLocaleTimeString('en-IN')}</strong></div>
                <div className="pt-1 border-t border-emerald-200 text-emerald-700 font-medium">
                  ✅ Zero Storage Confirmed — No file data retained after processing
                </div>
              </div>

              {/* Only show link if a real Sheet ID was provided */}
              <div className="pt-2 flex items-center justify-center gap-3">
                {syncSuccessData.googleSheetsUrl && sheetId.trim() !== '' && (
                  <a
                    href={syncSuccessData.googleSheetsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-md"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Open Google Sheet
                  </a>
                )}
                <button
                  onClick={handleClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2 rounded-xl text-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ─── Form View ─── */
            <form onSubmit={handleExport} className="space-y-4">

              {/* Validation lock warning */}
              {errorCount > 0 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Export Locked — Math Errors Detected</strong>
                    You have <strong>{errorCount} row(s)</strong> with mathematical discrepancies (highlighted red in the grid).
                    Fix all red cells before exporting.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="font-bold">All checks passed!</strong> {transactions.length} verified rows ready to export.
                  </div>
                </div>
              )}

              {/* Google Sheet ID */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Google Spreadsheet ID <span className="text-slate-400 font-normal">(optional for demo)</span>:
                </label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  placeholder="Paste Spreadsheet ID from your Google Sheet URL..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 focus:ring-2 focus:ring-purple-600 outline-none text-xs"
                />
                {/* Step-by-step guide */}
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
                  <p className="font-bold text-blue-950">📋 How to get your Spreadsheet ID:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-blue-800">
                    <li>Go to <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="underline font-semibold text-blue-700 hover:text-blue-900">sheets.google.com</a> and create a new sheet</li>
                    <li>Your URL will look like: <code className="bg-blue-100 px-1 rounded">docs.google.com/spreadsheets/d/<strong>YOUR_ID_HERE</strong>/edit</code></li>
                    <li>Copy the bold part between <code>/d/</code> and <code>/edit</code></li>
                    <li>Paste it in the field above</li>
                  </ol>
                  <p className="text-blue-700 italic">Leave empty to test in Demo Mode (simulates export, no real sheet needed)</p>
                </div>
              </div>

              {/* Sheet Tab Name */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Target Sheet Tab Name:
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="e.g. Sheet1"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-600 outline-none text-xs"
                />
              </div>

              {syncError && (
                <div className="p-2.5 bg-red-100 text-red-800 rounded-lg text-xs border border-red-200">
                  ⚠️ {syncError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={errorCount > 0 || isSyncing}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition shadow-md text-xs ${
                    errorCount > 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      Export {transactions.length} Rows
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
