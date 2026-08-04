import React from 'react';
import { ArrowUpRight, Bell, CreditCard, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { formatRupee } from '../utils/currencyFormatter';

export const CorporateOverview = ({ onOpenParser }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Alert */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
            !
          </div>
          <div>
            <strong className="font-bold text-amber-950 block text-sm">
              Security Notice — Zero Storage Policy Active
            </strong>
            <span>
              All uploaded bank statement files are processed in-memory only. No file data is written to disk or retained in any database after processing is complete.
            </span>
          </div>
        </div>
        <button className="text-purple-900 font-bold hover:underline shrink-0">
          View Policy &gt;
        </button>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Upcoming Payables Card */}
        <div className="bg-purple-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-purple-200 text-xs font-medium mb-3">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-300" /> Upcoming Payables
              </span>
              <span className="text-[10px] bg-purple-800 px-2 py-0.5 rounded text-purple-200">Jul 2026</span>
            </div>
            <div className="text-3xl font-extrabold text-white font-outfit tracking-tight">
              {formatRupee(184750.00)}
            </div>
            <p className="text-xs text-purple-200 mt-1">
              3 Vendors Pending Approval
            </p>
          </div>
          <div className="pt-4 border-t border-purple-800/80 flex items-center justify-between text-xs">
            <span className="text-purple-300">Next Due: 10-AUG-2026</span>
            <button
              onClick={onOpenParser}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg font-medium transition"
            >
              Parse Statements &gt;
            </button>
          </div>
        </div>

        {/* Credit Limit Overview */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Fund Limit Overview</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 font-outfit">
              {formatRupee(5000000.00)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Letter of Credit / Bank Guarantee Available
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
            <span>Utilized: {formatRupee(1250000.00)}</span>
            <span className="font-semibold text-purple-900 cursor-pointer hover:underline">View Details &gt;</span>
          </div>
        </div>

        {/* Alerts Widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-700 text-xs font-bold mb-3">
              <span className="flex items-center gap-1.5 text-slate-800">
                <Bell className="w-4 h-4 text-purple-700" /> Recent Alerts
              </span>
              <span className="text-[10px] text-slate-400">Live Feed</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 font-medium block">Statement Parsed Successfully</strong>
                  <span className="text-[10px] text-slate-500">6 Rows — Math Verified ✓</span>
                </div>
              </div>

              <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-950 font-medium block">Zero Storage Protocol Enforced</strong>
                  <span className="text-[10px] text-purple-700">RAM Buffers Cleared After Processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch CTA Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full border border-purple-500/30">
            ⚡ AI Multimodal Extraction Engine
          </div>
          <h3 className="text-xl font-bold text-white font-outfit">
            Launch Universal Bank Parser
          </h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Upload PDF or scanned bank statements, inspect side-by-side with an editable data grid, resolve math discrepancies, and export directly to Google Sheets.
          </p>
        </div>
        <button
          onClick={onOpenParser}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg flex items-center gap-2"
        >
          Open Parser Workspace <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
