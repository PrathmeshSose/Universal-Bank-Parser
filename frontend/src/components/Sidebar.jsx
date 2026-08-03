import React from 'react';
import { LayoutDashboard, FileSpreadsheet, CreditCard, Send, ShieldCheck, FileText, HelpCircle, AlertTriangle, Settings, ChevronRight } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex select-none min-h-[calc(100vh-80px)]">
      <div className="p-3 space-y-6">
        {/* Main Section */}
        <div>
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Main Features
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('parser')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'parser'
                  ? 'bg-purple-800 text-white shadow-md'
                  : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>AI Statement Parser</span>
              </div>
              {activeTab === 'parser' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={() => setActiveTab('corporate')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'corporate'
                  ? 'bg-purple-800 text-white shadow-md'
                  : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Corporate Overview</span>
              </div>
              {activeTab === 'corporate' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
          </div>
        </div>

        {/* Banking Tools Section from YONO SBI Screenshot 1 */}
        <div>
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Banking Tools
          </div>
          <div className="space-y-1 text-slate-600">
            <div className="flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-slate-100 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-purple-700" />
                <span>Corporate Cards</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-slate-100 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-purple-700" />
                <span>Quick Payments</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-slate-100 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Approvals & Rules</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Services & Audit */}
        <div>
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Services & Reports
          </div>
          <div className="space-y-1 text-slate-600">
            <div className="flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-slate-100 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Zero Storage Audit Log</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-slate-100 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Bank Templates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Box Footer */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100 text-xs text-purple-900">
          <div className="font-semibold flex items-center gap-1.5 text-purple-950 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-purple-700" /> Need Help?
          </div>
          <p className="text-[11px] text-slate-600 leading-tight">
            Contact Universal Bank Parser Support at <strong>support@ubparser.ai</strong>
          </p>
        </div>
      </div>
    </aside>
  );
};
