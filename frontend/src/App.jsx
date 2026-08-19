import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { CorporateOverview } from './components/CorporateOverview.jsx';
import { FileUpload } from './components/FileUpload.jsx';
import { DocumentViewer } from './components/DocumentViewer.jsx';
import { TransactionGrid } from './components/TransactionGrid.jsx';
import { ValidationCard } from './components/ValidationCard.jsx';
import { ReportsPage } from './components/ReportsPage.jsx';
import { AdminPanel } from './components/AdminPanel.jsx';
import { Login } from './components/Login.jsx';
import { StatementHistory } from './components/StatementHistory.jsx';
import { auditTransactions } from './services/mathValidator.js';
import { getCurrentUser, clearAuth, checkHealthApi } from './services/api.js';
import './App.css';

// Default initial sample statement to immediately demo functionality
const INITIAL_DEMO_TRANSACTIONS = [];

export function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('yono-theme') || 'light');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'extractor', 'verification', 'admin'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeBank, setActiveBank] = useState('HDFC');
  const [customBankName, setCustomBankName] = useState('');
  
  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Data Extraction State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [s3DownloadUrl, setS3DownloadUrl] = useState('');
  const [transactions, setTransactions] = useState(INITIAL_DEMO_TRANSACTIONS);
  const [apiOnline, setApiOnline] = useState(true);
  const [activeRecordId, setActiveRecordId] = useState(null);
  // BUG-C2 FIX: Track uploads to trigger Dashboard refresh
  const [uploadCount, setUploadCount] = useState(0);
  // BUG-F3 FIX: Track whether the active record is already locked
  const [isRecordLocked, setIsRecordLocked] = useState(false);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yono-theme', theme);
  }, [theme]);

  // Load Saved Auth Session & Check Health
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      // Default to Master Super Admin for immediate testing convenience if desired
      // or show login modal
    }

    const checkHealth = async () => {
      const res = await checkHealthApi();
      setApiOnline(res.status === 'success');
    };
    checkHealth();
  }, []);

  // Run Real-time Mathematical Validation Engine
  const { auditedTransactions, stats, flagCount } = auditTransactions(transactions);

  // Upload handler
  const handleUploadSuccess = (response, file) => {
    setUploadedFile(file);
    if (response.downloadUrl) {
      setS3DownloadUrl(response.downloadUrl);
    }
    if (response.recordId) {
      setActiveRecordId(response.recordId);
    }
    // BUG-F3 FIX: New upload is always unlocked
    setIsRecordLocked(false);
    
    const extractedData = response.data?.transactions || response.data || response.transactions || [];
    if (Array.isArray(extractedData) && extractedData.length > 0) {
      setTransactions(extractedData);
    }
    // BUG-C2 FIX: Increment uploadCount so Dashboard re-fetches stats
    setUploadCount(prev => prev + 1);
    setActiveTab('verification');
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthOpen(false);
  };

  // If unauthenticated, show the dedicated Role Portal Login screen
  if (!currentUser) {
    return (
      <div className="app-wrapper" data-theme={theme}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const role = currentUser?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'super_admin';

  return (
    <div className="app-wrapper">
      {/* Top Corporate Header */}
      <Header 
        user={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        activeBank={activeBank}
        onSelectBank={setActiveBank}
        customBankName={customBankName}
        setCustomBankName={setCustomBankName}
        apiOnline={apiOnline}
      />

      {/* Main Body with Sidebar + Tab Content */}
      <div className="app-body">
        <Sidebar 
          activeTab={activeTab}
          onSelectTab={(tab) => {
            // RBAC gating: if user tries to open admin without privileges, keep them on dashboard
            if (tab === 'admin' && !isAdmin) {
              alert('Access Denied: Administration hub requires Admin or Super Admin privileges.');
              return;
            }
            setActiveTab(tab);
          }}
          flagCount={flagCount}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentUser={currentUser}
        />

        <main className="main-content">
          {/* TAB 1: Corporate Overview / Executive Dashboard */}
          {activeTab === 'dashboard' && (
            <CorporateOverview 
              stats={stats}
              flagCount={flagCount}
              onNavigateToUpload={() => setActiveTab('extractor')}
              onNavigateToLedger={() => setActiveTab('verification')}
              activeBank={activeBank}
              transactions={transactions}
              currentUser={currentUser}
              refreshKey={uploadCount}
            />
          )}

          {/* TAB 2: Statement Ingestion */}
          {activeTab === 'extractor' && (
            <FileUpload 
              onUploadSuccess={handleUploadSuccess}
              activeBank={activeBank}
              onSelectBank={setActiveBank}
              customBankName={customBankName}
              setCustomBankName={setCustomBankName}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
          )}

          {/* TAB 3: Split-Screen Verification Ledger (SRS FR-4.1) */}
          {activeTab === 'verification' && (
            <div className="verification-wrapper animate-fade">
              {/* Mathematical Consistency Banner */}
              <ValidationCard 
                stats={stats}
                flagCount={flagCount}
                totalRows={transactions.length}
              />

              {/* Split-Screen: PDF Document on Left, Interactive Table on Right */}
              <div className="split-workspace">
                <div className="workspace-left">
                  <DocumentViewer 
                    file={uploadedFile}
                    originalPdfUrl={s3DownloadUrl}
                  />
                </div>

                <div className="workspace-right">
                  <TransactionGrid 
                    transactions={auditedTransactions}
                    onUpdateTransactions={setTransactions}
                    onOpenExport={() => setActiveTab('reports')}
                    flagCount={flagCount}
                    recordId={activeRecordId}
                    isInitiallyLocked={isRecordLocked}
                    onLocked={() => setIsRecordLocked(true)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Statement History */}
          {activeTab === 'history' && (
            <StatementHistory currentUser={currentUser} />
          )}

          {/* TAB 5: Reports Page */}
          {activeTab === 'reports' && (
            <ReportsPage 
              transactions={transactions}
              s3FileUrl={s3DownloadUrl}
              flagCount={flagCount}
              statsTotalCredits={stats?.totalCredit}
              statsTotalDebits={stats?.totalDebit}
            />
          )}

          {/* TAB 6: Administration Hub (Admin & Super Admin Only) */}
          {activeTab === 'admin' && isAdmin && (
            <AdminPanel currentUser={currentUser} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
