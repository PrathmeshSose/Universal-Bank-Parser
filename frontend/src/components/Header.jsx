import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Cpu, 
  User, 
  LogOut, 
  LogIn, 
  Sun, 
  Moon,
  Crown
} from 'lucide-react';
import { BANK_CATEGORIES } from '../utils/bankList.js';

export const Header = ({ 
  user, 
  onOpenAuth, 
  onLogout, 
  theme, 
  onToggleTheme, 
  activeBank, 
  onSelectBank, 
  customBankName,
  setCustomBankName,
  apiOnline = true 
}) => {
  const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin';
  const isAdmin = isSuperAdmin || user?.role?.toLowerCase() === 'admin';

  return (
    <header className="yono-header">
      <div className="header-left">
        <div className="brand-badge">
          <div className="brand-icon">
            <Building2 size={22} className="text-cyan" />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              <span className="brand-sbi">UNIVERSAL</span>
              <span className="brand-yono"> BANK</span>
              <span className="brand-corp">PARSER</span>
            </div>
            <div className="brand-subtitle">Enterprise Statement AI • Zero Storage Policy</div>
          </div>
        </div>

        <div className="status-pill-group">
          <div className={`status-pill ${apiOnline ? 'status-online' : 'status-offline'}`}>
            <span className="status-dot"></span>
            <span>{apiOnline ? 'AWS S3 Lake Connected' : 'Connecting...'}</span>
          </div>

          <div className="status-pill status-ai">
            <Cpu size={13} className="text-accent" />
            <span>AI: Bedrock + Groq OCR</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Section 4: Bank Selector Dropdown with Optgroups */}
        <div className="header-bank-select">
          <label htmlFor="header-bank">Target Bank:</label>
          <select 
            id="header-bank"
            value={activeBank} 
            onChange={(e) => onSelectBank(e.target.value)}
            className="bank-dropdown"
          >
            {BANK_CATEGORIES.map((cat) => (
              <optgroup key={cat.label} label={cat.label}>
                {cat.banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {activeBank === 'Other' && (
            <input 
              type="text" 
              placeholder="Enter bank name" 
              value={customBankName || ''}
              onChange={(e) => setCustomBankName(e.target.value)}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '120px'
              }}
            />
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          className="icon-btn theme-toggle-btn" 
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Profile Widget */}
        {user ? (
          <div className="user-profile-widget">
            <div className={`user-avatar ${isSuperAdmin ? 'avatar-super' : isAdmin ? 'avatar-admin' : ''}`}>
              {isSuperAdmin ? <Crown size={15} className="text-gold" /> : <User size={15} />}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className={`user-role-badge ${isSuperAdmin ? 'text-gold font-bold' : ''}`}>
                {isSuperAdmin ? '👑 Super Admin' : isAdmin ? '🛡️ Admin' : '👤 User'}
              </span>
            </div>
            <button className="icon-btn logout-btn" onClick={onLogout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm login-header-btn" onClick={onOpenAuth}>
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
