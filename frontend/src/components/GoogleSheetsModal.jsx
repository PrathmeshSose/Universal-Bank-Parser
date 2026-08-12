import { useState } from "react";
import { Download, X, CheckCircle2, AlertTriangle } from "lucide-react";

const DEFAULT_SPREADSHEET_ID =
  "1i0oKXZ46ni-nzpZkkTc6ESXuq14deuZ5-kfbx-kWu3o";

function GoogleSheetsModal({
  transactions = [],
  onClose,
  onExport,
}) {
  const [spreadsheetId, setSpreadsheetId] = useState(
    DEFAULT_SPREADSHEET_ID
  );

  const [sheetName, setSheetName] = useState(
    "Bank_Transactions"
  );

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setError("");

    const id = spreadsheetId.trim();

    if (!id) {
      setError("Google Spreadsheet ID is required.");
      return;
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      setError("There are no transactions to export.");
      return;
    }

    try {
      setExporting(true);

      await onExport({
        spreadsheetId: id,
        sheetName:
          sheetName.trim() || "Bank_Transactions",
      });
    } catch (err) {
      console.error("Export failed:", err);

      setError(
        err?.message ||
        "Export failed. Please check the Google Spreadsheet configuration."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Export to Google Sheets
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Export validated transaction data
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="space-y-5 p-6">

          {/* STATUS */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2
              size={18}
              className="text-emerald-600"
            />

            <div>
              <p className="text-xs font-bold text-emerald-800">
                Ready to export
              </p>

              <p className="mt-0.5 text-[11px] text-emerald-700">
                {transactions.length} transaction
                {transactions.length === 1 ? "" : "s"} will be exported.
              </p>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-xs leading-5 text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* SPREADSHEET ID */}
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Google Spreadsheet ID
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) =>
                setSpreadsheetId(e.target.value)
              }
              placeholder="Paste Google Spreadsheet ID"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <p className="mt-2 text-[10px] leading-4 text-slate-400">
              Spreadsheet ID is the value between
              <span className="font-semibold"> /d/ </span>
              and
              <span className="font-semibold"> /edit </span>
              in your Google Sheets URL.
            </p>
          </div>

          {/* SHEET NAME */}
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Sheet Name
            </label>

            <input
              type="text"
              value={sheetName}
              onChange={(e) =>
                setSheetName(e.target.value)
              }
              placeholder="Bank_Transactions"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* EXPORT INFO */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-700">
              Export includes
            </p>

            <ul className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <li>• Date</li>
              <li>• Description</li>
              <li>• Previous Balance</li>
              <li>• Debit</li>
              <li>• Credit</li>
              <li>• Current Balance</li>
              <li>• Validation Status</li>
              <li>• Line Number</li>
            </ul>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || transactions.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} />

            {exporting
              ? "Exporting..."
              : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoogleSheetsModal;