import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Database,
  BarChart,
  PieChart
} from 'lucide-react';
import { exportVerifiedDataApi } from '../services/api.js';

export const ReportsPage = ({ 
  transactions = [], 
  s3FileUrl, 
  flagCount = 0,
  // BUG-C4 FIX: Accept pre-computed stats from App.jsx (via mathValidator) to
  // avoid computing totals with different logic and showing different values here vs Dashboard
  statsTotalCredits,
  statsTotalDebits
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await exportVerifiedDataApi(transactions);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(transactions, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `verified_transactions_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyS3 = () => {
    if (s3FileUrl) {
      navigator.clipboard.writeText(s3FileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Use pre-computed stats if available, fallback to local computation only as last resort
  const totalCredits = statsTotalCredits ?? transactions.reduce((sum, tx) => sum + (parseFloat((tx.Credit || tx.credit || '').replace(/,/g, '')) || 0), 0);
  const totalDebits = statsTotalDebits ?? transactions.reduce((sum, tx) => sum + (parseFloat((tx.Debit || tx.debit || '').replace(/,/g, '')) || 0), 0);


  return (
    <div className="reports-container animate-fade">
      {/* Header */}
      <div className="history-header glass-card">
        <div className="history-title-wrap">
          <FileSpreadsheet size={26} className="text-cyan" />
          <div>
            <h3>Reports & Data Export</h3>
            <p>Download audited financial statements or sync directly to data lakes.</p>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <FileText size={32} className="text-muted" style={{ margin: '0 auto 10px' }} />
          <h4>No Active Data</h4>
          <p className="text-muted">Upload a statement in the Ingestion Hub first to generate reports.</p>
        </div>
      ) : (
        <div className="reports-content-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {flagCount > 0 && (
            <div className="alert-box alert-warning">
              <span>⚠️ Notice: {flagCount} balance discrepancies are currently flagged in this dataset. Please resolve them before final export.</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* CSV Export Option */}
            <div className="export-card glass-card" onClick={handleExportCsv} style={{ cursor: 'pointer', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="export-card-icon icon-csv" style={{ marginBottom: '15px', color: 'var(--color-success)' }}>
                <FileSpreadsheet size={40} />
              </div>
              <div className="export-card-text" style={{ flex: 1, marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px' }}>CSV Spreadsheet</h4>
                <p className="text-muted" style={{ fontSize: '13px' }}>Standard comma-separated format compatible with Excel, Tally, and Zoho Books.</p>
              </div>
              <button className="btn btn-primary btn-sm" disabled={isExporting} style={{ width: '100%' }}>
                <Download size={15} />
                <span>{isExporting ? 'Generating...' : 'Download CSV'}</span>
              </button>
            </div>

            {/* JSON Export Option */}
            <div className="export-card glass-card" onClick={handleExportJson} style={{ cursor: 'pointer', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="export-card-icon icon-json" style={{ marginBottom: '15px', color: 'var(--sbi-gold-400)' }}>
                <FileText size={40} />
              </div>
              <div className="export-card-text" style={{ flex: 1, marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px' }}>Structured JSON</h4>
                <p className="text-muted" style={{ fontSize: '13px' }}>Machine-readable JSON array for direct API integrations & developer pipelines.</p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                <Download size={15} />
                <span>Download JSON</span>
              </button>
            </div>
          </div>

          {/* Data Summary Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart size={18} className="text-cyan" /> 
              Active Dataset Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{transactions.length}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Rows</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>₹{totalCredits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Credits</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>₹{totalDebits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Debits</div>
              </div>
            </div>
          </div>

          {/* S3 Data Lake Archive Section */}
          {s3FileUrl && (
            <div className="s3-archive-box glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--sbi-blue-400)' }}>
              <div className="s3-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold' }}>
                <Database size={16} className="text-cyan" />
                <span>Amazon S3 Data Lake Archive Link</span>
              </div>
              <div className="s3-url-row" style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={s3FileUrl} 
                  className="form-input font-mono"
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleCopyS3}>
                  <Copy size={14} />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {exportSuccess && (
            <div className="alert-box alert-success animate-fade">
              <CheckCircle2 size={16} />
              <span>CSV exported and downloaded successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
