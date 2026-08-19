import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  FileCheck, 
  AlertTriangle, 
  UploadCloud, 
  FileSpreadsheet, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Building,
  CheckCircle2,
  Users,
  Server,
  Activity,
  Database,
  RefreshCw,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter.js';
import { getDashboardStatsApi } from '../services/api.js';

export const CorporateOverview = ({ 
  onNavigateToUpload, 
  onNavigateToLedger,
  currentUser,
  // BUG-C2 FIX: refreshKey changes when a new upload completes, triggering re-fetch
  refreshKey = 0
}) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStatsApi();
      setMetrics({ ...data, role: data.role || currentUser?.role || 'user' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  // BUG-C2 FIX: Re-fetch whenever a new upload is completed
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="overview-container animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '15px' }}>
        <RefreshCw size={32} className="animate-spin text-cyan" />
        <p className="text-muted">Loading your personalized dashboard...</p>
      </div>
    );
  }

  if (error || !metrics) {
    const isOffline = error && (error.includes('Failed to fetch') || error.includes('Load failed') || error.includes('fetch'));
    return (
      <div className="overview-container animate-fade" style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px', maxWidth: '400px', borderTop: '4px solid var(--color-danger)' }}>
          <Server size={40} style={{ marginBottom: '16px', color: 'var(--color-danger)' }} />
          <h3 style={{ marginBottom: '8px' }}>{isOffline ? 'System Offline' : 'Dashboard Error'}</h3>
          <p className="text-muted" style={{ marginBottom: '24px', fontSize: '14px' }}>
            {isOffline 
              ? 'The secure banking backend server appears to be unreachable or is currently restarting.' 
              : `Error: ${error}`}
          </p>
          <button className="btn btn-primary" onClick={fetchMetrics}>
            <RefreshCw size={15} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const role = metrics.role || 'user';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // Render role-specific content
  return (
    <div className="overview-container animate-fade">
      {/* Dynamic Welcome Banner */}
      <div className="yono-hero-banner glass-card">
        <div className="hero-content">
          <div className="hero-tag">
            <ShieldCheck size={14} className="text-cyan" />
            <span>SECURE ENTERPRISE RECONCILIATION</span>
          </div>
          <h2>
            {isSuperAdmin ? 'Master Control Hub' : isAdmin ? 'Branch Operations Overview' : 'Analyst Performance Dashboard'}
          </h2>
          <p>
            {isSuperAdmin 
              ? 'Monitor global system health, active users, and AWS S3 storage infrastructure.'
              : isAdmin
                ? 'Oversee branch-level processing, analyst performance, and aggregated financial verification.'
                : 'Welcome back. Monitor your monthly statement processing, verify ledgers, and export data.'}
          </p>

          <div className="hero-actions">
            {!isSuperAdmin && (
              <button className="btn btn-primary" onClick={onNavigateToUpload}>
                <UploadCloud size={16} />
                <span>Ingest New Statement</span>
              </button>
            )}
            <button className="btn btn-secondary" onClick={onNavigateToLedger}>
              <span>View Active Ledger</span>
              <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={fetchMetrics}>
              <RefreshCw size={15} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        <div className="hero-stats-badge">
          <div className="kpi-score-circle">
            <div className="kpi-score-number">{metrics.totalStatements || 0}</div>
            <div className="kpi-score-label">{isAdmin ? 'Total Audited' : 'My Statements'}</div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics (Common across roles but scoped to data) */}
      <div className="kpi-grid">
        {/* Total Credits */}
        <div className="kpi-card glass-card kpi-inflow">
          <div className="kpi-header">
            <span className="kpi-title">{isAdmin ? 'Global Total Credits' : 'My Total Credits'}</span>
            <div className="kpi-icon inflow-icon">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value text-success">
            {formatCurrency(metrics.totalCredits)}
          </div>
          <div className="kpi-footer">
            <span className="kpi-trend positive">
              <CheckCircle2 size={13} /> Verified by AI
            </span>
          </div>
        </div>

        {/* Total Debits */}
        <div className="kpi-card glass-card kpi-outflow">
          <div className="kpi-header">
            <span className="kpi-title">{isAdmin ? 'Global Total Debits' : 'My Total Debits'}</span>
            <div className="kpi-icon outflow-icon">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="kpi-value text-danger">
            {formatCurrency(metrics.totalDebits)}
          </div>
          <div className="kpi-footer">
            <span className="kpi-trend negative">Total Disbursed</span>
          </div>
        </div>

        {/* Statement Volume */}
        <div className="kpi-card glass-card kpi-balance">
          <div className="kpi-header">
            <span className="kpi-title">Processing Volume</span>
            <div className="kpi-icon balance-icon">
              <FileSpreadsheet size={20} />
            </div>
          </div>
          <div className="kpi-value text-cyan">
            {metrics.totalRows}
          </div>
          <div className="kpi-footer">
            <span>Total Transaction Rows Extracted</span>
          </div>
        </div>

        {/* Verification Status */}
        <div className="kpi-card glass-card kpi-status">
          <div className="kpi-header">
            <span className="kpi-title">Audit Status</span>
            <div className={`kpi-icon ${metrics.pendingCount > 0 ? 'flag-alert-icon' : 'flag-pass-icon'}`}>
              {metrics.pendingCount > 0 ? <AlertTriangle size={20} /> : <FileCheck size={20} />}
            </div>
          </div>
          <div className="kpi-value">
            {metrics.pendingCount > 0 ? (
              <span className="text-warning">{metrics.pendingCount} Pending</span>
            ) : (
              <span className="text-success">All Verified</span>
            )}
          </div>
          <div className="kpi-footer">
            <span>{metrics.verifiedCount} fully approved and locked</span>
          </div>
        </div>
      </div>

      {/* Role-Specific Sections */}
      
      {/* SUPER ADMIN ONLY: System Health */}
      {isSuperAdmin && metrics.systemHealth && (
        <div className="quick-actions-section" style={{ marginTop: '20px' }}>
          <h3 className="section-heading">System Infrastructure Health</h3>
          <div className="quick-actions-grid">
            <div className="action-tile glass-card">
              <div className="action-tile-icon icon-cyan"><Users size={24} /></div>
              <h4>User Directory</h4>
              <p><strong>{metrics.totalUsers}</strong> Registered Accounts</p>
              <p className="text-muted" style={{ fontSize: '12px' }}>{metrics.totalAdmins} Admins, {metrics.totalAnalysts} Analysts</p>
            </div>
            <div className="action-tile glass-card">
              <div className="action-tile-icon icon-gold"><Database size={24} /></div>
              <h4>AWS S3 Data Lake</h4>
              <p><strong>Connected</strong></p>
              <p className="text-muted" style={{ fontSize: '12px' }}>Estimated Storage: {(metrics.s3StorageBytes / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div className="action-tile glass-card">
              <div className="action-tile-icon icon-blue"><Activity size={24} /></div>
              <h4>AI Engine Status</h4>
              <p><strong>{metrics.systemHealth.bedrockStatus}</strong></p>
              <p className="text-muted" style={{ fontSize: '12px' }}>Zero-disk RAM usage: {metrics.systemHealth.ramUsage}</p>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN & SUPER ADMIN: Recent Activity Feed */}
      {isAdmin && metrics.recentActivity && metrics.recentActivity.length > 0 && (
        <div className="quick-actions-section" style={{ marginTop: '20px' }}>
          <h3 className="section-heading">Recent Branch Activity</h3>
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="yono-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Bank</th>
                  <th>Processed By</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentActivity.map((act, i) => (
                  <tr key={i}>
                    <td className="font-bold">{act.clientName}</td>
                    <td><span className="history-bank-tag">{act.bankName}</span></td>
                    <td className="font-mono text-xs">{act.processedBy}</td>
                    <td>
                      {act.status === 'verified' 
                        ? <span className="status-tag tag-active"><CheckCircle2 size={11} /> Verified</span> 
                        : <span className="status-tag tag-pending"><Clock size={11} /> Pending</span>}
                    </td>
                    <td className="text-muted text-xs">{new Date(act.date).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER (Analyst) ONLY: Quick Actions */}
      {!isAdmin && (
        <div className="quick-actions-section" style={{ marginTop: '20px' }}>
          <h3 className="section-heading">Quick Banking Actions</h3>
          <div className="quick-actions-grid">
            <div className="action-tile glass-card" onClick={onNavigateToUpload}>
              <div className="action-tile-icon icon-blue"><UploadCloud size={24} /></div>
              <h4>Upload Statement</h4>
              <p>Direct upload with automated OCR text recognition.</p>
            </div>
            <div className="action-tile glass-card" onClick={onNavigateToLedger}>
              <div className="action-tile-icon icon-cyan"><FileSpreadsheet size={24} /></div>
              <h4>Verify Ledger</h4>
              <p>Split-screen verification and manual math audits.</p>
            </div>
            <div className="action-tile glass-card">
              <div className="action-tile-icon icon-gold"><Zap size={24} /></div>
              <h4>Automated Math Audit</h4>
              <p>Instant verification of running balances.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
