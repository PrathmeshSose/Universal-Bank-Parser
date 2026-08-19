import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter.js';

export const ValidationCard = ({ stats, flagCount, totalRows }) => {
  const isHealthy = flagCount === 0;

  return (
    <div className={`validation-banner glass-card ${isHealthy ? 'banner-pass' : 'banner-warning'}`}>
      <div className="validation-banner-left">
        <div className={`validation-icon-circle ${isHealthy ? 'icon-pass' : 'icon-warn'}`}>
          {isHealthy ? <ShieldCheck size={26} /> : <AlertTriangle size={26} />}
        </div>
        <div className="validation-text-group">
          <h4>
            {isHealthy 
              ? 'Mathematical Consistency Verified (100% Passed)' 
              : `${flagCount} Balance Mismatch Flag(s) Detected`}
          </h4>
          <p className="validation-formula-text">
            <span>Audit Rule:</span> <code>Previous Balance + Credit - Debit = Current Balance</code>
          </p>
        </div>
      </div>

      <div className="validation-banner-metrics">
        <div className="mini-stat">
          <span className="mini-stat-label">Inflow (Credits)</span>
          <span className="mini-stat-val text-success">
            {formatCurrency(stats.totalCredit)}
          </span>
        </div>

        <div className="mini-stat">
          <span className="mini-stat-label">Outflow (Debits)</span>
          <span className="mini-stat-val text-danger">
            {formatCurrency(stats.totalDebit)}
          </span>
        </div>

        <div className="mini-stat">
          <span className="mini-stat-label">Reported Closing</span>
          <span className="mini-stat-val text-cyan">
            {formatCurrency(stats.finalBalance)}
          </span>
        </div>
      </div>
    </div>
  );
};
