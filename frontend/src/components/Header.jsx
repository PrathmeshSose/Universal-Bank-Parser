import React from 'react';
import { ShieldCheck, Server, AlertCircle } from 'lucide-react';
import { isDemoModeActive } from '../services/api';

export const Header = ({ activeTab, setActiveTab, onOpenApiModal }) => {
  return (
    <header className="header-container bg-white border-b border-purple-100 shadow-sm sticky top-0 z-40">

      {/* Top Branding & Navigation Bar */}
      <div className="top-brand-bar px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">

        {/* Left Section */}
        <div className="flex items-center gap-3">

          {/* Project Logo & Name */}
          <div className="logo-badge flex items-center gap-2 font-bold text-lg text-purple-300">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs shadow">
              UBP
            </div>

            <span className="tracking-wider text-white font-outfit text-xl">
              Universal Bank{' '}
              <span className="text-xs font-normal bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded border border-purple-700/50 uppercase tracking-widest">
                Parser
              </span>
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700 mx-2 hidden md:block" />

          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center gap-1 text-xs">

            <button
              onClick={() => setActiveTab('parser')}
              className={`px-3 py-1.5 rounded-t-md font-medium transition ${
                activeTab === 'parser'
                  ? 'bg-purple-700 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              📊 Statement Parser
            </button>

            <button
              onClick={() => setActiveTab('corporate')}
              className={`px-3 py-1.5 rounded-t-md font-medium transition ${
                activeTab === 'corporate'
                  ? 'bg-purple-700 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              🏛️ Dashboard
            </button>

          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 text-xs">

          {/* Zero Storage Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800/60 font-medium shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Permanent Storage</span>
          </div>

          {/* Backend Status */}
          <button
            onClick={onOpenApiModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded border border-slate-700 transition"
          >
            <Server className="w-3.5 h-3.5 text-purple-400" />

            <span>
              Backend:{' '}
              {isDemoModeActive() ? 'Demo Mode' : 'API Connected'}
            </span>

            <span
              className={`w-2 h-2 rounded-full ${
                isDemoModeActive()
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
          </button>

        </div>
      </div>

      {/* Security Notice Banner */}
      <div className="notice-banner bg-amber-50 border-b border-amber-200/70 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">

        <div className="flex items-center gap-2 overflow-hidden">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />

          <span className="truncate">
            <strong>Security Notice:</strong>{' '}
            AI Multimodal Extraction operates strictly in temporary server RAM.
            No bank statement PDFs or transactional records are retained in any
            database storage.
          </span>
        </div>

        <span className="text-purple-900 font-semibold cursor-pointer underline hover:text-purple-700 shrink-0 ml-2">
          Learn More &gt;
        </span>

      </div>

    </header>
  );
};