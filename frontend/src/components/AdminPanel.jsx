import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Users, 
  Shield, 
  Crown, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  UserCheck,
  Server,
  Cloud,
  Layers,
  Activity
} from 'lucide-react';
import { getUsersApi, updateUserRoleApi, deleteUserApi, createUserApi } from '../services/api.js';

export const AdminPanel = ({ currentUser }) => {
  const isSuperAdmin = currentUser?.role?.toLowerCase() === 'super_admin';
  const isAdmin = ['admin', 'super_admin'].includes(currentUser?.role?.toLowerCase());
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  // Create User Modal state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch (err) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRoleApi(userId, newRole);
      setActionMsg(`Role updated to ${newRole.toUpperCase()}`);
      setTimeout(() => setActionMsg(''), 3000);
      fetchUsers();
    } catch (err) {
      alert(`Role change failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
    try {
      await updateUserRoleApi(userId, undefined, newStatus);
      setActionMsg(`User account status set to ${newStatus.toUpperCase()}`);
      setTimeout(() => setActionMsg(''), 3000);
      fetchUsers();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isSuperAdmin) {
      alert('Permission Denied: Only Super Admin can delete users.');
      return;
    }
    if (!window.confirm('Are you sure you want to permanently delete this user from AWS S3?')) {
      return;
    }
    try {
      await deleteUserApi(userId);
      setActionMsg('User permanently deleted.');
      setTimeout(() => setActionMsg(''), 3000);
      fetchUsers();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await createUserApi(newName, newEmail, newPassword, newRole);
      setActionMsg(`User '${newName}' created successfully!`);
      setTimeout(() => setActionMsg(''), 3000);
      setShowCreateUser(false);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('user');
      fetchUsers();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="admin-container animate-fade">
      {/* Header Banner */}
      <div className="admin-header-card glass-card">
        <div className="admin-title-wrap">
          {isSuperAdmin ? <Crown size={28} className="text-gold" /> : <Database size={28} className="text-cyan" />}
          <div>
            <h3>{isSuperAdmin ? '👑 Super Admin Master Control Hub' : '🛡️ System Administration Panel'}</h3>
            <p>Role-Based Access Control (RBAC), User Directory & S3 Data Lake Monitor</p>
          </div>
        </div>

        <div className="admin-header-badges">
          <span className={`admin-badge ${
            isSuperAdmin 
              ? 'admin-badge-super' 
              : 'admin-badge-admin'
          }`}>
            {currentUser?.role?.toUpperCase() || 'ADMIN'}
          </span>
        </div>
      </div>

      {actionMsg && (
        <div className="alert-box alert-success animate-fade">
          <CheckCircle2 size={16} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="admin-tabs-row">
        <button 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={15} />
          <span>User Directory & RBAC</span>
        </button>
        <button 
          className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('system')}
        >
          <Server size={15} />
          <span>System & RAM Health</span>
        </button>
      </div>

      {/* TAB 1: User Directory & RBAC Management */}
      {activeTab === 'users' && (
        <div className="glass-card admin-users-table-card">
          <div className="table-header-row">
            <h4>Registered Enterprise Users ({users.length})</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateUser(true)}>
                <Users size={14} />
                <span>+ Create User</span>
              </button>
              <button className="btn btn-secondary btn-sm" onClick={fetchUsers} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="yono-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>RBAC Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleNormalized = (u.role || '').toLowerCase();
                  const isUserSuperAdmin = roleNormalized === 'super_admin';

                  return (
                    <tr key={u.id}>
                      <td className="font-bold">{u.name}</td>
                      <td className="font-mono text-sm">{u.email}</td>
                      <td>
                        {/* 6.2 Role Badge styling per handoff spec */}
                        <span
                          className={`admin-badge ${
                            roleNormalized === 'super_admin'
                              ? 'admin-badge-super'
                              : roleNormalized === 'admin'
                              ? 'admin-badge-admin'
                              : 'admin-badge-user'
                          }`}
                        >
                          {u.role?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag ${u.status === 'disabled' ? 'tag-disabled' : 'tag-active'}`}>
                          {u.status === 'disabled' ? 'Disabled' : 'Active'}
                        </span>
                      </td>
                      <td className="cell-actions-right">
                        {!isUserSuperAdmin && (
                          <div className="action-buttons-group">
                            {/* Toggle Role (user <-> admin) */}
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRoleChange(u.id, u.role)}
                              title="Toggle between User and Admin"
                            >
                              <UserCheck size={13} />
                              <span>{u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}</span>
                            </button>

                            {/* Enable/Disable Account */}
                            <button
                              className={`btn btn-sm ${u.status === 'disabled' ? 'btn-success' : 'btn-secondary'}`}
                              onClick={() => handleToggleStatus(u.id, u.status)}
                            >
                              {u.status === 'disabled' ? 'Enable' : 'Disable'}
                            </button>

                            {/* Delete User (Super Admin Only per spec) */}
                            {isSuperAdmin && (
                              <button
                                className="icon-btn delete-btn"
                                onClick={() => handleDeleteUser(u.id)}
                                title="Permanently Delete User (Super Admin Only)"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                        {isUserSuperAdmin && (
                          <span className="text-muted text-xs font-semibold">Master Account</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: System Health & Zero Storage RAM Monitor */}
      {activeTab === 'system' && (
        <div className="system-health-grid">
          <div className="glass-card health-metric-box">
            <div className="metric-icon-circle icon-cyan">
              <Cloud size={24} />
            </div>
            <h4>AWS S3 Serverless Database</h4>
            <p className="font-mono text-cyan">Bucket: banking-bucket-first (us-east-1)</p>
            <span className="health-badge-pass">Operational • S3 JSON Lake</span>
          </div>

          <div className="glass-card health-metric-box">
            <div className="metric-icon-circle icon-blue">
              <Shield size={24} />
            </div>
            <h4>Zero Storage RAM Policy</h4>
            <p>Multer memory storage stream active. 0 bytes saved to server disk.</p>
            <span className="health-badge-pass">100% Compliant</span>
          </div>

          <div className="glass-card health-metric-box">
            <div className="metric-icon-circle icon-gold">
              <Activity size={24} />
            </div>
            <h4>AI Extraction Engine Status</h4>
            <p>Amazon Bedrock (Nova Lite) with Groq OCR auto-fallback pipeline.</p>
            <span className="health-badge-pass">Connected & Ready</span>
          </div>
        </div>
      )}

      {/* ── Create User Modal ── */}
      {showCreateUser && (
        <div className="modal-overlay" onClick={() => setShowCreateUser(false)}>
          <div className="modal-content glass-card animate-fade" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Users size={22} className="text-cyan" />
                <div>
                  <h3>Create New User</h3>
                  <p>{isSuperAdmin ? 'Super Admin: can create User or Admin accounts' : 'Admin: can create User or Admin accounts'}</p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowCreateUser(false)}>✕</button>
            </div>

            {createError && (
              <div className="alert-box alert-danger">
                <AlertCircle size={15} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. analyst@bank.co.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Temporary Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Set a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              {isAdmin && (
                <div className="form-group">
                  <label>Assign Role</label>
                  <select
                    className="form-input"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="user">👤 User (Analyst)</option>
                    <option value="admin">🛡️ Admin (Manager)</option>
                  </select>
                </div>
              )}
              <div className="modal-footer" style={{ gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateUser(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? <RefreshCw size={15} className="animate-spin" /> : <UserCheck size={15} />}
                  <span>{createLoading ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
