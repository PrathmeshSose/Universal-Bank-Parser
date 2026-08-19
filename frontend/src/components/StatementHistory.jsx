import React, { useState, useEffect } from "react";
import {
  History, FileText, RefreshCw,
  User, CheckCircle2, Clock, Search, Filter, Calendar, Download
} from "lucide-react";
import { getAuthToken, downloadPdfApi, downloadRecordCsvApi } from "../services/api.js";
import { formatCurrency } from "../utils/currencyFormatter.js";

const API_BASE_URL = "/api";


export const StatementHistory = ({ currentUser }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBank, setFilterBank] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const isAdmin = ["admin", "super_admin"].includes(currentUser?.role?.toLowerCase());
  const isSuperAdmin = currentUser?.role?.toLowerCase() === "super_admin";

  const loadRecords = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/records`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, []);

  const filtered = records.filter(r => {
    const matchSearch =
      (r.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.bankName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchBank = filterBank === "all" || r.bankName === filterBank;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchBank && matchStatus;
  });

  const uniqueBanks = [...new Set(records.map(r => r.bankName).filter(Boolean))];

  const formatPeriod = (period) => {
    if (!period) return "—";
    const [year, month] = period.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const totalVerified = records.filter(r => r.status === "verified").length;
  const totalPending = records.filter(r => r.status === "pending").length;

  return (
    <div className="history-container animate-fade">

      {/* ── Header Banner ── */}
      <div className="history-header glass-card">
        <div className="history-title-wrap">
          <History size={26} className="text-cyan" />
          <div>
            <h3>Statement Processing History</h3>
            <p>
              {isAdmin
                ? "All processed statements across the organization"
                : "Your processed statements"}
            </p>
          </div>
        </div>
        <div className="history-header-stats">
          <div className="history-stat">
            <span className="history-stat-num">{records.length}</span>
            <span className="history-stat-label">Total</span>
          </div>
          <div className="history-stat">
            <span className="history-stat-num text-success">{totalVerified}</span>
            <span className="history-stat-label">Verified</span>
          </div>
          <div className="history-stat">
            <span className="history-stat-num text-warning">{totalPending}</span>
            <span className="history-stat-label">Pending</span>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="history-filters glass-card">
        <div className="history-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by client name or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tx-search-input"
          />
        </div>
        <div className="history-filter-right">
          <Filter size={15} className="text-muted" />
          <select
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="history-bank-filter"
          >
            <option value="all">All Banks</option>
            {uniqueBanks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="history-bank-filter"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={loadRecords} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="glass-card history-table-card">
        <div className="table-responsive">
          <table className="yono-table">
            <thead>
              <tr>
                <th>Account Holder</th>
                <th>Bank</th>
                <th>Period</th>
                <th style={{ textAlign: "right" }}>Credits (Rs.)</th>
                <th style={{ textAlign: "right" }}>Debits (Rs.)</th>
                <th style={{ textAlign: "center" }}>Rows</th>
                <th>Processed By</th>
                <th>Date</th>
                <th>Status</th>
                <th>AI Engine</th>
                {isSuperAdmin && <th style={{ textAlign: "center" }}>Actions</th>}
                {isSuperAdmin && <th style={{ textAlign: "center" }}>Download CSV</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="empty-table-cell">
                    <RefreshCw size={28} className="animate-spin text-cyan" />
                    <p>Loading statement history...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-table-cell">
                    <FileText size={32} className="text-muted" />
                    <p>No statements found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="tx-row">
                    <td>
                      <div className="history-client-cell">
                        <User size={14} className="text-muted" />
                        <span className="font-bold">{r.clientName || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="history-bank-tag">{r.bankName}</span>
                    </td>
                    <td>
                      <div className="history-period-cell">
                        <Calendar size={13} className="text-muted" />
                        <span>{formatPeriod(r.statementPeriod)}</span>
                      </div>
                    </td>
                    <td className="text-right text-success font-mono font-bold">
                      {r.totalCredit ? formatCurrency(r.totalCredit) : "—"}
                    </td>
                    <td className="text-right text-danger font-mono font-bold">
                      {r.totalDebit ? formatCurrency(r.totalDebit) : "—"}
                    </td>
                    <td className="text-right">
                      <span className="history-tx-count">{r.transactionCount || 0} rows</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs">{r.processedBy || "—"}</span>
                    </td>
                    <td>
                      <span className="text-muted text-xs">
                        {r.processedAt
                          ? new Date(r.processedAt).toLocaleDateString("en-IN")
                          : "—"}
                      </span>
                    </td>
                    <td>
                      {r.status === "verified" || r.status === "approved" ? (
                        <span className="status-tag tag-active">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      ) : (
                        <span className="status-tag tag-pending">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`ai-engine-tag ${r.provider === "bedrock" ? "tag-bedrock" : "tag-groq"}`}>
                        {r.provider === "bedrock" ? "🟡 Bedrock" : "🟢 Groq"}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: "center" }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => downloadPdfApi(r.id, `${r.clientName || 'Statement'}.pdf`)}
                          title="Download Original PDF"
                        >
                          <Download size={14} />
                          <span>PDF</span>
                        </button>
                      </td>
                    )}
                    {isSuperAdmin && (
                      <td style={{ textAlign: "center" }}>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => downloadRecordCsvApi(r)}
                          title="Download CSV of this statement"
                        >
                          <Download size={14} />
                          <span>CSV</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="tx-grid-footer">
          <span className="footer-count">
            Showing {filtered.length} of {records.length} records
          </span>
          <span className="footer-tip">
            Statement history stored in AWS S3 Data Lake for audit compliance.
          </span>
        </div>
      </div>
    </div>
  );
};
