import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Crown, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { loginApi, registerApi } from '../services/api.js';

export const Login = ({ onLoginSuccess }) => {
  const [selectedPortal, setSelectedPortal] = useState('super_admin'); // 'user', 'admin', 'super_admin'
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@universalparser.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSelectPortal = (portal) => {
    setSelectedPortal(portal);
    setErrorMsg('');
    if (portal === 'super_admin') {
      setEmail('admin@universalparser.com');
      setPassword('');
    } else if (portal === 'admin') {
      setEmail('analyst.lead@sbi.co.in');
      setPassword('');
    } else {
      setEmail('officer@sbi.co.in');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const result = await registerApi(name, email, password);
        setSuccessMsg('Account registered and authenticated successfully!');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 500);
      } else {
        const result = await loginApi(email, password);
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen-container">
      <div className="login-box glass-card animate-fade">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-icon">
            <Building2 size={28} className="text-cyan" />
          </div>
          <h2>Universal Bank Parser</h2>
          <p className="login-brand-tagline">Enterprise Financial Intelligence Workspace</p>
        </div>

        {/* Role Portal Selection UI - Hidden during registration */}
        {!isRegister && (
          <div className="role-portal-picker">
            <button 
              type="button" 
              className={`portal-tab ${selectedPortal === 'user' ? 'active' : ''}`}
              onClick={() => handleSelectPortal('user')}
            >
              <User size={15} />
              <span>👤 User Portal</span>
            </button>
            <button 
              type="button" 
              className={`portal-tab ${selectedPortal === 'admin' ? 'active' : ''}`}
              onClick={() => handleSelectPortal('admin')}
            >
              <ShieldCheck size={15} />
              <span>🛡️ Admin</span>
            </button>
            <button 
              type="button" 
              className={`portal-tab portal-super ${selectedPortal === 'super_admin' ? 'active' : ''}`}
              onClick={() => handleSelectPortal('super_admin')}
            >
              <Crown size={15} />
              <span>👑 Super Admin</span>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && (
            <div className="alert-box alert-danger">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {isRegister && (
            <div className="form-group">
              <label>Full Name / Title</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Prathmesh Sose"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Work Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input 
                type="email" 
                required 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block btn-lg submit-login-btn"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            <span>{isRegister ? 'CREATE ACCOUNT & ENTER' : 'SIGN IN TO WORKSPACE'}</span>
          </button>

          {/* Persona Helper Note */}
          <div className="portal-hint-badge">
            <Sparkles size={13} className="text-gold" />
            <span>
              Target Persona: <strong>{selectedPortal.replace('_', ' ').toUpperCase()}</strong>
            </span>
          </div>

          <div className="login-footer-links">
            <button 
              type="button" 
              className="text-link"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              {isRegister 
                ? '← Back to Sign In' 
                : 'Need a new corporate account? Register here'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
