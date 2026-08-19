/**
 * Universal Bank Parser - Centralized API Service (Enterprise Edition)
 * Backend URL: /api (proxied to http://localhost:5000 in Vite dev)
 */

const API_BASE_URL = '/api';
const TOKEN_KEY = 'ubp_token';
const USER_KEY = 'ubp_user';

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const handleAuthError = (res) => {
  // BUG-S1 FIX: Only clear auth on 401 (token expired/invalid).
  // 403 (Forbidden) means the token is valid but the user lacks permission — do NOT log them out.
  if (res.status === 401) {
    clearAuth();
    window.location.reload();
  }
  return res;
};

export const loginApi = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password: password
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Login failed.');
  }

  // Store real JWT token and user info
  setAuthToken(data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return {
    success: true,
    token: data.token,
    user: data.user,
  };
};

export const registerApi = async (name, email, password) => {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Registration failed.');
  }

  // Automatically log in after registration
  return loginApi(email, password);
};

export const uploadBankStatementApi = async (file, bankName = 'HDFC', password = '', clientName = '', statementPeriod = '') => {
  if (!file) throw new Error('No file selected.');

  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to upload bank statements.');
  }

  const formData = new FormData();
  formData.append('document', file);
  formData.append('bankName', bankName);
  formData.append('clientName', clientName);
  formData.append('statementPeriod', statementPeriod);
  if (password) {
    formData.append('password', password);
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  }).then(handleAuthError);

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || result?.error || `Upload failed (${response.status}).`);
  }

  const transactions = result?.data?.transactions || result?.data || result?.transactions || [];
  return {
    success: true,
    ...result,
    transactions: Array.isArray(transactions) ? transactions : [],
    recordId: result?.recordId
  };
};

export const updateRecordStatusApi = async (recordId, status) => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/records/${recordId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status })
  }).then(handleAuthError);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update record status');
  }

  return await res.json();
};

export const exportVerifiedDataApi = async (verifiedData) => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/export`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ verifiedData })
  }).then(handleAuthError);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Export failed');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `verified_statement_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return true;
};

// Admin User Management APIs
export const getUsersApi = async () => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/auth/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(handleAuthError);
  if (!res.ok) throw new Error('Failed to fetch users directory');
  const data = await res.json();
  return data.data || [];
};

export const updateUserRoleApi = async (userId, role, status) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role, status })
  }).then(handleAuthError);
  if (!res.ok) throw new Error('Failed to update user role/status');
  return await res.json();
};

export const deleteUserApi = async (userId) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(handleAuthError);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete user');
  }
  return await res.json();
};

export const createUserApi = async (name, email, password, role = 'user') => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/auth/users/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, email, password, role })
  }).then(handleAuthError);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create user');
  return data;
};

export const getDashboardStatsApi = async () => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/stats/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(handleAuthError);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  const data = await res.json();
  return data.data;
};

export const downloadPdfApi = async (recordId, filename) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/records/${recordId}/pdf`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(handleAuthError);
  if (!res.ok) throw new Error('Failed to download PDF');
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `Statement_${recordId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadRecordCsvApi = async (record) => {
  const token = getAuthToken();
  // Try fetching full transaction data from backend
  try {
    const res = await fetch(`${API_BASE_URL}/records/${record.id}/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleAuthError);

    if (res.ok) {
      const data = await res.json();
      const txns = data.data || data.transactions || [];
      if (txns.length > 0) {
        const headers = Object.keys(txns[0]).join(',');
        const rows = txns.map(t => Object.values(t).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${record.clientName || 'Statement'}_${record.bankName}_${record.id}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    }
  } catch (_) { /* fallback */ }

  // Fallback: export record summary as CSV
  const headers = 'Client Name,Bank,Period,Credits,Debits,Rows,Processed By,Date,Status';
  const row = `"${record.clientName || ''}","${record.bankName || ''}","${record.statementPeriod || ''}","${record.totalCredit || 0}","${record.totalDebit || 0}","${record.transactionCount || 0}","${record.processedBy || ''}","${record.processedAt || ''}","${record.status || ''}"`;
  const csv = `${headers}\n${row}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${record.clientName || 'Statement'}_${record.bankName}_summary.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  window.URL.revokeObjectURL(url);
};

// Health Check API
export const checkHealthApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'error', message: err.message };
  }
};
