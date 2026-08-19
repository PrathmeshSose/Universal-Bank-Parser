import React from 'react';
import { 
  LayoutDashboard, 
  FileUp, 
  TableProperties, 
  Database, 
  ChevronLeft, 
  ChevronRight, 
  BookOpenCheck,
  ShieldCheck,
  Crown,
  History,
  BarChart
} from 'lucide-react';

export const Sidebar = ({ 
  activeTab, 
  onSelectTab, 
  flagCount = 0, 
  collapsed, 
  onToggleCollapse, 
  currentUser 
}) => {
  const role = currentUser?.role?.toLowerCase() || '';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  return (
    <aside className={`yono-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-nav">
        {/* Core Operations Tabs (Visible to all users) */}
        {!collapsed && (
          <p className="sidebar-section-title">
            FINANCIAL PARSER
          </p>
        )}

        <button
          className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('dashboard')}
          title={collapsed ? 'Corporate Overview' : undefined}
        >
          <div className="link-icon-wrap">
            <LayoutDashboard size={19} />
          </div>
          {!collapsed && <span className="link-text">Corporate Overview</span>}
        </button>

        <button
          className={`sidebar-link ${activeTab === 'extractor' ? 'active' : ''}`}
          onClick={() => onSelectTab('extractor')}
          title={collapsed ? 'Statement Ingestion' : undefined}
        >
          <div className="link-icon-wrap">
            <FileUp size={19} />
          </div>
          {!collapsed && <span className="link-text">Statement Ingestion</span>}
        </button>

        <button
          className={`sidebar-link ${activeTab === 'verification' ? 'active' : ''}`}
          onClick={() => onSelectTab('verification')}
          title={collapsed ? 'Verification Ledger' : undefined}
        >
          <div className="link-icon-wrap">
            <TableProperties size={19} />
          </div>
          {!collapsed && <span className="link-text">Verification Ledger</span>}
          {!collapsed && flagCount > 0 && (
            <span className="link-badge badge-danger">{flagCount}</span>
          )}
        </button>

        <button
          className={`sidebar-link ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onSelectTab('history')}
          title={collapsed ? 'Statement History' : undefined}
        >
          <div className="link-icon-wrap">
            <History size={19} />
          </div>
          {!collapsed && <span className="link-text">Statement History</span>}
        </button>

        <button
          className={`sidebar-link ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => onSelectTab('reports')}
          title={collapsed ? 'Reports & Exports' : undefined}
        >
          <div className="link-icon-wrap">
            <BarChart size={19} />
          </div>
          {!collapsed && <span className="link-text">Reports & Exports</span>}
        </button>

        {/* 6.1 Administration Section Gating (Admin & Super Admin Only) */}
        {isAdmin && (
          <div className="admin-sidebar-section">
            {!collapsed && (
              <p className="sidebar-section-title admin-title">
                ADMINISTRATION
              </p>
            )}

            <button
              className={`sidebar-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectTab('admin')}
              title={collapsed ? 'System & Users Hub' : undefined}
            >
              <div className="link-icon-wrap">
                {isSuperAdmin ? <Crown size={19} className="text-gold" /> : <Database size={19} />}
              </div>
              {!collapsed && (
                <span className="link-text">
                  {isSuperAdmin ? 'Master Control Hub' : 'System Admin Panel'}
                </span>
              )}
              {!collapsed && (
                <span className={`link-badge ${isSuperAdmin ? 'badge-super' : 'badge-admin'}`}>
                  {isSuperAdmin ? 'SUPER' : 'ADMIN'}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Security Status Card */}
      {!collapsed && (
        <div className="sidebar-compliance-card glass-card">
          <div className="compliance-icon">
            <ShieldCheck size={18} className="text-cyan" />
          </div>
          <div className="compliance-title">Zero Storage RAM Active</div>
          <p className="compliance-desc">
            Multi-tier RBAC enforced. Statements processed in RAM with S3 Data Lake audit logs.
          </p>
        </div>
      )}

      {/* Collapse Toggle */}
      <button 
        className="sidebar-collapse-btn" 
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand Menu' : 'Collapse Menu'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};
