import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, FileText, ShieldCheck } from 'lucide-react';
import { formatRupee } from '../utils/currencyFormatter';

export const DocumentViewer = ({ currentFile, selectedBank, transactions }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 160));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 75));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 text-white flex flex-col h-full overflow-hidden shadow-lg select-none">
      {/* Top Document Toolbar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <FileText className="w-4 h-4 text-purple-400" />
          <span className="truncate max-w-[200px]">
            {currentFile ? currentFile.name : 'Sample_Bank_Statement_Jul2026.pdf'}
          </span>
          <span className="bg-slate-800 text-purple-300 px-2 py-0.5 rounded text-[10px] font-mono">
            {currentFile ? `${(currentFile.size / 1024).toFixed(0)} KB` : '142 KB'}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} title="Zoom Out" className="p-1 hover:bg-slate-800 text-slate-300 rounded transition">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 w-9 text-center">{zoom}%</span>
          <button onClick={handleZoomIn} title="Zoom In" className="p-1 hover:bg-slate-800 text-slate-300 rounded transition">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 my-auto" />
          <button onClick={handleRotate} title="Rotate Page" className="p-1 hover:bg-slate-800 text-slate-300 rounded transition">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Document Render Container */}
      <div className="flex-1 bg-slate-950/80 p-4 overflow-auto flex justify-center items-start">
        <div
          style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 w-full max-w-xl bg-white text-slate-900 rounded-lg shadow-2xl p-6 border border-slate-300 font-serif text-[11px] leading-snug space-y-4"
        >
          {/* Document Header */}
          <div className="border-b-2 border-purple-900 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-900 text-white font-extrabold flex items-center justify-center font-sans text-sm shadow">
                UBP
              </div>
              <div>
                <h3 className="font-bold font-sans text-base text-purple-950 tracking-wide uppercase">
                  Universal Bank Parser
                </h3>
                <p className="text-[10px] text-slate-500 font-sans">
                  AI Bank Statement Parser — Extracted Document Preview
                </p>
              </div>
            </div>
            <div className="text-right font-sans text-[10px] text-slate-600">
              <div className="font-bold text-slate-800 text-xs">STATEMENT OF ACCOUNT</div>
              <div>Extracted via AI Multimodal</div>
              <div>Zero Storage Protocol</div>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 grid grid-cols-2 gap-2 font-sans text-[11px]">
            <div>
              <span className="text-slate-500 block">Account Holder:</span>
              <strong className="text-slate-800 font-semibold">ENTERPRISE SOLUTIONS PVT LTD</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Account Number:</span>
              <strong className="text-slate-800 font-mono">XXXX XXXX 4291</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Statement Period:</span>
              <strong className="text-slate-800">01-JUL-2026 to 15-JUL-2026</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Currency:</span>
              <strong className="text-purple-900 font-semibold">INR (Indian Rupee ₹)</strong>
            </div>
          </div>

          {/* Extracted Transactions Table */}
          <div className="space-y-1 font-sans">
            <div className="font-bold text-xs text-slate-800 border-b border-slate-300 pb-1 flex justify-between">
              <span>Extracted Transaction Record</span>
              <span className="text-[10px] font-normal text-purple-900">AI Extracted</span>
            </div>

            <table className="w-full text-[10.5px] text-left border-collapse">
              <thead>
                <tr className="bg-purple-950 text-white font-semibold">
                  <th className="p-1.5 border border-purple-900">Date</th>
                  <th className="p-1.5 border border-purple-900">Narration / Details</th>
                  <th className="p-1.5 border border-purple-900 text-right">Debit (₹)</th>
                  <th className="p-1.5 border border-purple-900 text-right">Credit (₹)</th>
                  <th className="p-1.5 border border-purple-900 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx, idx) => {
                    const isError = tx.validation && !tx.validation.isValid;
                    return (
                      <tr
                        key={tx.id || idx}
                        className={`transition ${isError ? 'bg-red-100/90 text-red-950 font-bold border-l-4 border-l-red-600' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                      >
                        <td className="p-1.5 border border-slate-200 whitespace-nowrap">{tx.date}</td>
                        <td className="p-1.5 border border-slate-200 truncate max-w-[140px] font-sans" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className="p-1.5 border border-slate-200 text-right text-red-700 font-medium">
                          {tx.debit > 0 ? formatRupee(tx.debit, false) : '-'}
                        </td>
                        <td className="p-1.5 border border-slate-200 text-right text-emerald-700 font-medium">
                          {tx.credit > 0 ? formatRupee(tx.credit, false) : '-'}
                        </td>
                        <td className={`p-1.5 border border-slate-200 text-right font-semibold ${isError ? 'text-red-900 bg-red-200/60' : 'text-slate-900'}`}>
                          {formatRupee(tx.currBalance, false)}
                          {isError && <span className="block text-[9px] text-red-600 font-sans font-normal">⚠️ Mismatch</span>}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-400">
                      No document loaded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stamp */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[9.5px] text-slate-400 font-sans">
            <div>AI-Extracted Preview — Verify before exporting</div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Processed by Universal Bank Parser AI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
