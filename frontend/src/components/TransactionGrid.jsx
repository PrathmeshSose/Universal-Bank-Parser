import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Edit3, Plus, Trash2, Search, Filter, RefreshCw, Sparkles, ArrowUpDown } from 'lucide-react';
import { formatRupee, parseRupeeNumber } from '../utils/currencyFormatter';

export const TransactionGrid = ({ transactions, onUpdateCell, onAddRow, onDeleteRow, onResetData }) => {
  const [editingCell, setEditingCell] = useState(null); // { rowId, field }
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'errors', 'debits', 'credits'

  const handleStartEdit = (row, field) => {
    setEditingCell({ rowId: row.id, field });
    setEditValue(row[field] !== undefined ? String(row[field]) : '');
  };

  const handleSaveEdit = (rowId, field) => {
    if (editingCell) {
      onUpdateCell(rowId, field, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e, rowId, field) => {
    if (e.key === 'Enter') {
      handleSaveEdit(rowId, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Filter transactions based on search and selected filter mode
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.date.includes(searchTerm) ||
      String(tx.currBalance).includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterMode === 'errors') return tx.validation && !tx.validation.isValid;
    if (filterMode === 'debits') return parseRupeeNumber(tx.debit) > 0;
    if (filterMode === 'credits') return parseRupeeNumber(tx.credit) > 0;
    return true;
  });

  const errorCount = transactions.filter(t => t.validation && !t.validation.isValid).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full overflow-hidden shadow-sm">
      {/* Grid Toolbar: Search, Filter, Add Row, Reset */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, date or amount (₹)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterMode === 'all' ? 'bg-purple-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterMode('errors')}
            className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
              filterMode === 'errors'
                ? 'bg-red-600 text-white shadow-sm'
                : errorCount > 0
                ? 'bg-red-50 text-red-700 border border-red-200 font-bold animate-pulse'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Flagged ({errorCount})
          </button>
          <button
            onClick={() => setFilterMode('debits')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterMode === 'debits' ? 'bg-purple-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            Debits
          </button>
          <button
            onClick={() => setFilterMode('credits')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterMode === 'credits' ? 'bg-purple-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            Credits
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddRow}
            className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded-md font-medium transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
          <button
            onClick={onResetData}
            title="Reset to Original extracted data"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Editable Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 text-[11px]">
            <tr>
              <th className="p-2.5 text-center w-12 border-r border-slate-200">#</th>
              <th className="p-2.5 w-24 border-r border-slate-200">Date</th>
              <th className="p-2.5 min-w-[200px] border-r border-slate-200">Description / Ref</th>
              <th className="p-2.5 text-right w-32 border-r border-slate-200">Prev Bal (₹)</th>
              <th className="p-2.5 text-right w-28 border-r border-slate-200 text-red-700">Debit (₹)</th>
              <th className="p-2.5 text-right w-28 border-r border-slate-200 text-emerald-700">Credit (₹)</th>
              <th className="p-2.5 text-right w-36 border-r border-slate-200">Curr Bal (₹)</th>
              <th className="p-2.5 w-36 border-r border-slate-200 text-center">Validation Status</th>
              <th className="p-2.5 w-12 text-center">Del</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx, idx) => {
                const isError = tx.validation && !tx.validation.isValid;
                
                return (
                  <tr
                    key={tx.id || idx}
                    className={`group transition hover:bg-purple-50/50 ${
                      isError ? 'bg-red-50/90 border-l-4 border-l-red-600' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    {/* Index */}
                    <td className="p-2 text-center text-slate-400 font-mono border-r border-slate-200 text-[11px]">
                      {tx.lineNo || idx + 1}
                    </td>

                    {/* Date */}
                    <td className="p-2 border-r border-slate-200 font-mono text-[11px]">
                      {editingCell?.rowId === tx.id && editingCell?.field === 'date' ? (
                        <input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(tx.id, 'date')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'date')}
                          autoFocus
                          className="w-full bg-amber-50 border border-amber-400 rounded px-1.5 py-0.5 text-xs outline-none"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(tx, 'date')}
                          className="cursor-pointer hover:bg-amber-100/60 p-1 rounded transition"
                          title="Click to edit date"
                        >
                          {tx.date}
                        </div>
                      )}
                    </td>

                    {/* Description */}
                    <td className="p-2 border-r border-slate-200 font-medium text-slate-800">
                      {editingCell?.rowId === tx.id && editingCell?.field === 'description' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(tx.id, 'description')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'description')}
                          autoFocus
                          className="w-full bg-amber-50 border border-amber-400 rounded px-2 py-0.5 text-xs outline-none font-sans"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(tx, 'description')}
                          className="cursor-pointer hover:bg-amber-100/60 p-1 rounded truncate transition"
                          title="Click to edit description"
                        >
                          {tx.description}
                        </div>
                      )}
                    </td>

                    {/* Previous Balance */}
                    <td className="p-2 text-right border-r border-slate-200 font-mono">
                      {editingCell?.rowId === tx.id && editingCell?.field === 'prevBalance' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(tx.id, 'prevBalance')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'prevBalance')}
                          autoFocus
                          className="w-full text-right bg-amber-50 border border-amber-400 rounded px-1.5 py-0.5 text-xs outline-none font-mono"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(tx, 'prevBalance')}
                          className="cursor-pointer hover:bg-amber-100/60 p-1 rounded transition text-slate-700"
                        >
                          {formatRupee(tx.prevBalance)}
                        </div>
                      )}
                    </td>

                    {/* Debit */}
                    <td className="p-2 text-right border-r border-slate-200 font-mono text-red-700 font-medium">
                      {editingCell?.rowId === tx.id && editingCell?.field === 'debit' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(tx.id, 'debit')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'debit')}
                          autoFocus
                          className="w-full text-right bg-amber-50 border border-amber-400 rounded px-1.5 py-0.5 text-xs outline-none font-mono"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(tx, 'debit')}
                          className="cursor-pointer hover:bg-amber-100/60 p-1 rounded transition"
                        >
                          {parseRupeeNumber(tx.debit) > 0 ? formatRupee(tx.debit) : '-'}
                        </div>
                      )}
                    </td>

                    {/* Credit */}
                    <td className="p-2 text-right border-r border-slate-200 font-mono text-emerald-700 font-medium">
                      {editingCell?.rowId === tx.id && editingCell?.field === 'credit' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(tx.id, 'credit')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'credit')}
                          autoFocus
                          className="w-full text-right bg-amber-50 border border-amber-400 rounded px-1.5 py-0.5 text-xs outline-none font-mono"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(tx, 'credit')}
                          className="cursor-pointer hover:bg-amber-100/60 p-1 rounded transition"
                        >
                          {parseRupeeNumber(tx.credit) > 0 ? formatRupee(tx.credit) : '-'}
                        </div>
                      )}
                    </td>

                    {/* Current Balance (HIGHLIGHTS RED IF DISCREPANCY DETECTED) */}
                    <td className={`p-2 text-right border-r border-slate-200 font-mono font-bold ${
                      isError ? 'bg-red-200/90 text-red-950 ring-2 ring-red-500 rounded' : 'text-slate-900'
                    }`}>
                      {editingCell?.rowId === tx.id && editingCell?.field === 'currBalance' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(tx.id, 'currBalance')}
                          onKeyDown={(e) => handleKeyDown(e, tx.id, 'currBalance')}
                          autoFocus
                          className="w-full text-right bg-white border-2 border-red-600 rounded px-1.5 py-0.5 text-xs outline-none font-mono shadow-md"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(tx, 'currBalance')}
                          className="cursor-pointer hover:bg-red-300/60 p-1 rounded transition flex items-center justify-end gap-1"
                          title={isError ? tx.validation.errorMessage : 'Click to edit balance'}
                        >
                          {formatRupee(tx.currBalance)}
                          {isError && <Edit3 className="w-3 h-3 text-red-700 animate-bounce" />}
                        </div>
                      )}
                    </td>

                    {/* Validation Status Badge */}
                    <td className="p-2 border-r border-slate-200 text-center">
                      {isError ? (
                        <span 
                          className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm cursor-pointer"
                          title={tx.validation.errorMessage}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Math Error! (Click cell to fix)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Math
                        </span>
                      )}
                    </td>

                    {/* Delete Row */}
                    <td className="p-2 text-center">
                      <button
                        onClick={() => onDeleteRow(tx.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400">
                  No transactions match your search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
