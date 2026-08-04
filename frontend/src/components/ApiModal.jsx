import React, { useState } from 'react';
import { Server, CheckCircle2, XCircle, RefreshCw, X, Globe, Link, Zap } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, isDemoModeActive, setDemoMode, checkBackendHealthApi } from '../services/api';

export const ApiModal = ({ isOpen, onClose }) => {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());
  const [useDemoMode, setUseDemoMode] = useState(isDemoModeActive());
  const [healthStatus, setHealthStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setApiBaseUrl(urlInput);
    const result = await checkBackendHealthApi();
    setIsTesting(false);
    setHealthStatus(result);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setApiBaseUrl(urlInput);
    setDemoMode(useDemoMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Teammate Backend API Settings</h3>
              <p className="text-[11px] text-slate-400">Node.js Express + Gemini 1.5 Integration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs text-slate-700">
          {/* Mode Switcher */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-700" />
                <span className="font-bold text-purple-950">Use Offline / Demo Mode</span>
              </div>
              <input
                type="checkbox"
                checked={useDemoMode}
                onChange={(e) => setUseDemoMode(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
            <p className="text-[11px] text-slate-600 leading-tight">
              When checked, the frontend uses built-in realistic mock Gemini responses. Uncheck to connect to your teammate's running Express backend server.
            </p>
          </div>

          {/* API URL Input */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Backend Server Base URL:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="http://localhost:5000"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg flex items-center gap-1 transition"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Test Handshake'}
              </button>
            </div>
          </div>

          {/* Health Status Result */}
          {healthStatus && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              healthStatus.connected ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
            }`}>
              {healthStatus.connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="font-bold">Backend Online!</strong> Successfully connected to Express server at {urlInput}.
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <strong className="font-bold">Server Unreachable:</strong> Make sure your teammate has started the Express server on port 5000.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl transition"
            >
              Close
            </button>
            <button
              type="submit"
              className="bg-purple-800 hover:bg-purple-900 text-white font-bold px-4 py-2 rounded-xl transition shadow"
            >
              Save API Config
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
