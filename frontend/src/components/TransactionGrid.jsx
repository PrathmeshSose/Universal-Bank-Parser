import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  Check, 
  Edit3, 
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter.js';
import { updateRecordStatusApi } from '../services/api.js';

export const TransactionGrid = ({ 
  transactions = [], 
  onUpdateTransactions, 
  onOpenExport, 
  flagCount = 0,
  recordId,
  // BUG-F3 FIX: Accept lock state from parent so it survives tab navigation
  isInitiallyLocked = false,
  onLocked
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, debit, credit, flagged
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, field }
  // BUG-F3 FIX: Initialize from prop so navigating away and back restores locked state
  const [isLocked, setIsLocked] = useState(isInitiallyLocked);
  const [analystNote, setAnalystNote] = useState('');

  // Search and Filter logic
  const filteredTransactions = transactions.filter((tx, idx) => {
    const desc = (tx.Description || tx.description || '').toLowerCase();
    const date = (tx.Date || tx.date || '').toLowerCase();
    const matchesSearch = desc.includes(searchTerm.toLowerCase()) || date.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'debit') return Boolean(tx.Debit || tx.debit);
    if (filterType === 'credit') return Boolean(tx.Credit || tx.credit);
    if (filterType === 'flagged') return Boolean(tx._isFlagged);
    return true;
  });

  const handleCellChange = (rowIndex, field, value) => {
    const updated = [...transactions];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [field]: value
    };
    onUpdateTransactions(updated);
  };

  const handleAddRow = () => {
    const newRow = {
      _id: `manual_${Date.now()}`,
      Date: new Date().toLocaleDateString('en-GB'),
      Description: 'Manual Adjustment',
      Debit: '',
      Credit: '',
      Balance: transactions[transactions.length - 1]?.Balance || '0.00'
    };
    onUpdateTransactions([...transactions, newRow]);
  };

  const handleDeleteRow = (indexToDelete) => {
    const updated = transactions.filter((_, idx) => idx !== indexToDelete);
    onUpdateTransactions(updated);
  };

  const handleApproveAndLock = async () => {
    try {
      if (recordId) {
        await updateRecordStatusApi(recordId, 'verified');
      }
      setIsLocked(true);
      // BUG-F3 FIX: Notify parent so lock state persists across tab navigation
      if (onLocked) onLocked();
    } catch (err) {
      alert('Failed to update record status: ' + err.message);
    }
  };

  return (
    <div className="tx-grid-container glass-card">
      {/* Table Toolbar */}
      <div className="tx-toolbar">
        <div className="tx-toolbar-left">
          <div className="tx-search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search narration, reference, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tx-search-input"
            />
          </div>

          <div className="tx-filter-pills">
            <button 
              className={`pill-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({transactions.length})
            </button>
            <button 
              className={`pill-btn ${filterType === 'credit' ? 'active' : ''}`}
              onClick={() => setFilterType('credit')}
            >
              Credits
            </button>
            <button 
              className={`pill-btn ${filterType === 'debit' ? 'active' : ''}`}
              onClick={() => setFilterType('debit')}
            >
              Debits
            </button>
            {flagCount > 0 && (
              <button 
                className={`pill-btn pill-flagged ${filterType === 'flagged' ? 'active' : ''}`}
                onClick={() => setFilterType('flagged')}
              >
                ⚠️ Flagged ({flagCount})
              </button>
            )}
          </div>
        </div>

        <div className="tx-toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={handleAddRow} disabled={isLocked}>
            <Plus size={15} />
            <span>Add Row</span>
          </button>
          {!isLocked ? (
            <button className="btn btn-success btn-sm" onClick={handleApproveAndLock} style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
              <Check size={15} />
              <span>Approve & Lock</span>
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenExport}>
              <Download size={15} />
              <span>Export Verified Data</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Analyst Note */}
      <div style={{ padding: '0 20px 15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <FileText size={16} className="text-muted" />
        <input 
          type="text" 
          placeholder="Add analyst note or observations here..." 
          value={analystNote}
          onChange={(e) => setAnalystNote(e.target.value)}
          className="form-input"
          style={{ flex: 1, padding: '8px 12px' }}
          disabled={isLocked}
        />
        {isLocked && <span className="status-tag tag-active"><Check size={12} /> Approved & Locked</span>}
      </div>

      {/* Table Scroll Area */}
      <div className="table-responsive">
        <table className="yono-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th style={{ width: '110px' }}>Date</th>
              <th>Transaction Description</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Debit (₹)</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Credit (₹)</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Balance (₹)</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Audit</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-cell">
                  <FileText size={32} className="text-muted" />
                  <p>No transaction records found matching the active filter.</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx, idx) => {
                const originalIndex = tx._index !== undefined ? tx._index : idx;
                const isFlagged = tx._isFlagged;

                return (
                  <tr 
                    key={tx._id || `row-${originalIndex}-${tx.Date || tx.date || ''}-${tx.Description || tx.description || ''}`}
                    className={`tx-row ${isFlagged ? 'row-flagged' : ''}`}
                  >
                    <td className="cell-index">{originalIndex + 1}</td>

                    {/* Date */}
                    <td className="cell-date">
                      <input 
                        type="text"
                        value={tx.Date || tx.date || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'Date', e.target.value)}
                        className="cell-input"
                        disabled={isLocked}
                      />
                    </td>

                    {/* Description */}
                    <td className="cell-desc">
                      <input 
                        type="text"
                        value={tx.Description || tx.description || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'Description', e.target.value)}
                        className="cell-input"
                        disabled={isLocked}
                      />
                    </td>

                    {/* Debit */}
                    <td className="cell-debit">
                      <input 
                        type="text"
                        value={tx.Debit || tx.debit || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'Debit', e.target.value)}
                        placeholder="—"
                        className="cell-input text-right text-danger font-mono"
                        disabled={isLocked}
                      />
                    </td>

                    {/* Credit */}
                    <td className="cell-credit">
                      <input 
                        type="text"
                        value={tx.Credit || tx.credit || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'Credit', e.target.value)}
                        placeholder="—"
                        className="cell-input text-right text-success font-mono"
                        disabled={isLocked}
                      />
                    </td>

                    {/* Balance */}
                    <td className="cell-balance">
                      <input 
                        type="text"
                        value={tx.Balance || tx.balance || tx.currBalance || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'Balance', e.target.value)}
                        className="cell-input text-right text-cyan font-mono font-bold"
                        disabled={isLocked}
                      />
                    </td>

                    {/* Status Badge */}
                    <td className="cell-status">
                      {isFlagged ? (
                        <span 
                          className="flag-pill" 
                          title={`Calculation mismatch! Expected: ₹${tx._expectedBalance?.toFixed(2)}`}
                        >
                          <AlertCircle size={12} />
                          <span>Mismatch</span>
                        </span>
                      ) : (
                        <span className="pass-pill">
                          <Check size={12} />
                          <span>OK</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="cell-actions">
                      <button 
                        className="icon-btn delete-btn"
                        onClick={() => handleDeleteRow(originalIndex)}
                        title="Delete Row"
                        disabled={isLocked}
                        style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="tx-grid-footer">
        <span className="footer-count">
          Showing {filteredTransactions.length} of {transactions.length} records
        </span>
        <span className="footer-tip">
          💡 Click on any cell to edit amounts inline. Math balances recalculate automatically.
        </span>
      </div>
    </div>
  );
};
