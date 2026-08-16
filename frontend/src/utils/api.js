// API utility — all calls proxied through Vite to backend on :5001
const BASE = '/api';

// ── Token helpers ─────────────────────────────────────────────
export function getToken()         { return localStorage.getItem('bf_token'); }
export function setToken(token)    { localStorage.setItem('bf_token', token); }
export function clearToken()       { localStorage.removeItem('bf_token'); }
export function isLoggedIn()       { return !!getToken(); }

// ── Core request helper ───────────────────────────────────────
async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  // Auto-logout on 401 (expired or invalid token)
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('auth:logout'));
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const login  = (username, password) =>
  request('POST', '/auth/login', { username, password });

export const verifyToken = () =>
  request('POST', '/auth/verify', null);

// ── Company ───────────────────────────────────────────────────
export const getCompany    = ()     => request('GET',  '/company');
export const updateCompany = (data) => request('PUT',  '/company', data);

// ── Clients ───────────────────────────────────────────────────
export const getClients       = (search) =>
  request('GET', `/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const getClient        = (id)       => request('GET',    `/clients/${id}`);
export const createClient     = (data)     => request('POST',   '/clients', data);
export const updateClient     = (id, data) => request('PUT',    `/clients/${id}`, data);
export const deleteClient     = (id)       => request('DELETE', `/clients/${id}`);
export const getClientHistory = (id)       => request('GET',    `/clients/${id}/history`);

// ── Invoices ──────────────────────────────────────────────────
export const getInvoices = (params) => {
  const qs = new URLSearchParams(params || {}).toString();
  return request('GET', `/invoices${qs ? `?${qs}` : ''}`);
};
export const getInvoice       = (id)       => request('GET',    `/invoices/${id}`);
export const createInvoice    = (data)     => request('POST',   '/invoices', data);
export const updateInvoice    = (id, data) => request('PUT',    `/invoices/${id}`, data);
export const deleteInvoice    = (id)       => request('DELETE', `/invoices/${id}`);
export const sendInvoiceEmail = (id)       => request('POST',   `/invoices/${id}/send`, {});

// PDF URL — token passed as query param so <a href> links work directly
export const getInvoicePdfUrl = (id) =>
  `${BASE}/invoices/${id}/pdf?token=${getToken()}`;

// ── Payments ──────────────────────────────────────────────────
export const getPayments   = ()     => request('GET',  '/payments');
export const createPayment = (data) => request('POST', '/payments', data);

// ── Subscriptions ─────────────────────────────────────────────
export const getSubscriptions    = ()         => request('GET',  '/subscriptions');
export const createSubscription  = (data)     => request('POST', '/subscriptions', data);
export const updateSubscription  = (id, data) => request('PUT',  `/subscriptions/${id}`, data);
export const triggerSubscription = (id)       => request('POST', `/subscriptions/${id}/trigger`, {});

// ── Analytics ─────────────────────────────────────────────────
export const getAnalytics = () => request('GET', '/analytics');
