// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/services/advancePaymentService.js
// All API calls for the Advance Payment module.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

// ── Auth token ────────────────────────────────────────────────────────────────
function getAuthToken() {
  try {
    return (
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken') ||
      ''
    );
  } catch {
    return '';
  }
}

// ── Central fetch wrapper (authenticated) ─────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token      = getAuthToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${BASE_URL}${endpoint}`;

    const response = await fetch(url, { ...options, headers });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Server error (${response.status}): unexpected response format`);
    }

    const data = await response.json();

    if (!response.ok) {
      const err     = new Error(data.message || `Request failed (${response.status})`);
      err.status    = response.status;
      err.expired   = data.expired || false;
      err.data      = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw err;
  }
}

// ── Public fetch wrapper (NO auth token — used for link-based form submission) ─
async function publicFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    // deliberately no Authorization header
  };

  try {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${BASE_URL}${endpoint}`;

    const response = await fetch(url, { ...options, headers });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Server error (${response.status}): unexpected response format`);
    }

    const data = await response.json();

    if (!response.ok) {
      const err     = new Error(data.message || `Request failed (${response.status})`);
      err.status    = response.status;
      err.expired   = data.expired || false;
      err.data      = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT TYPES  (public)
// ─────────────────────────────────────────────────────────────────────────────
export async function getPaymentTypes() {
  return apiFetch('/advance-payment/types');
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────
export async function getStats() {
  return apiFetch('/advance-payment/stats');
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — list
// ─────────────────────────────────────────────────────────────────────────────
export async function listRequests(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return apiFetch(`/advance-payment/requests${qs ? `?${qs}` : ''}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — all (for Excel export & history)
// ─────────────────────────────────────────────────────────────────────────────
export async function getAllRequests() {
  return apiFetch('/advance-payment/requests?limit=1000&sort=created_at&order=DESC');
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — single
// ─────────────────────────────────────────────────────────────────────────────
export async function getRequest(id) {
  return apiFetch(`/advance-payment/requests/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — create (authenticated, from admin panel)
// ─────────────────────────────────────────────────────────────────────────────
export async function createRequest(
  formData,
  screenshotFile,
  proofFile,
  receiptFile,
  linkToken,
) {
  const body = new FormData();

  const fields = [
    'payment_type_key',
    'emp_id', 'emp_name', 'emp_dept', 'emp_email',
    'amount', 'reason',
    'to_emp_id', 'to_emp_name', 'to_emp_dept',
    'vendor_name', 'vendor_ref',
  ];

  fields.forEach(key => {
    if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
      body.append(key, formData[key]);
    }
  });

  if (linkToken) body.append('submitted_via_link', linkToken);

  body.append('screenshot', screenshotFile);
  if (proofFile)   body.append('proof',   proofFile);
  if (receiptFile) body.append('receipt', receiptFile);

  return apiFetch('/advance-payment/requests', { method: 'POST', body });
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — create via public link (NO auth token)
//
// Used by AdvanceRequestForm.jsx when the employee opens the emailed link.
// The backend must allow this endpoint without a JWT when submitted_via_link
// is present and valid.
// ─────────────────────────────────────────────────────────────────────────────
export async function createPublicRequest(
  formData,       // plain object
  screenshotFile, // File
  proofFile,      // File | null
  receiptFile,    // File | null
  linkToken,      // string — required for public submission
) {
  const body = new FormData();

  const fields = [
    'payment_type_key',
    'emp_id', 'emp_name', 'emp_dept', 'emp_email',
    'amount', 'reason',
    'to_emp_id', 'to_emp_name', 'to_emp_dept',
    'vendor_name', 'vendor_ref',
  ];

  fields.forEach(key => {
    if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
      body.append(key, formData[key]);
    }
  });

  // Always attach the link token — backend uses it to authorise the public POST
  if (linkToken) body.append('submitted_via_link', linkToken);

  body.append('screenshot', screenshotFile);
  if (proofFile)   body.append('proof',   proofFile);
  if (receiptFile) body.append('receipt', receiptFile);

  // Uses publicFetch — no Authorization header sent
  return publicFetch('/advance-payment/requests/public', { method: 'POST', body });
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — approve / reject
// ─────────────────────────────────────────────────────────────────────────────
export async function approveRequest(id, options = {}) {
  return apiFetch(`/advance-payment/requests/${id}/approve`, {
    method: 'POST',
    body:   JSON.stringify(options),
  });
}

export async function rejectRequest(id, rejection_reason = '') {
  return apiFetch(`/advance-payment/requests/${id}/reject`, {
    method: 'POST',
    body:   JSON.stringify({ rejection_reason }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DEDUCTIONS
// ─────────────────────────────────────────────────────────────────────────────
export async function getDeductions(requestId) {
  return apiFetch(`/advance-payment/requests/${requestId}/deductions`);
}

export async function updateDeduction(deductionId, status, note = '') {
  return apiFetch(`/advance-payment/deductions/${deductionId}`, {
    method: 'PATCH',
    body:   JSON.stringify({ status, note }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LINKS
// ─────────────────────────────────────────────────────────────────────────────

export async function createLink(params) {
  return apiFetch('/advance-payment/links', {
    method: 'POST',
    body:   JSON.stringify(params),
  });
}

export async function listLinks(activeOnly = false) {
  const qs = activeOnly ? '?active_only=true' : '';
  return apiFetch(`/advance-payment/links${qs}`);
}

export async function sendLinkEmail({ token, email, payment_type_key }) {
  return apiFetch('/advance-payment/links/send-email', {
    method: 'POST',
    body:   JSON.stringify({ token, email, payment_type_key }),
  });
}

// Public — no auth token
export async function validateLink(token) {
  const url      = `${BASE_URL}/advance-payment/links/${token}/validate`;
  const response = await fetch(url);
  const data     = await response.json().catch(() => ({
    success: false,
    message: 'Invalid JSON response',
  }));
  if (!response.ok) {
    const err   = new Error(data.message || `HTTP ${response.status}`);
    err.status  = response.status;
    err.expired = data.expired || false;
    err.data    = data;
    throw err;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY HISTORY
// ─────────────────────────────────────────────────────────────────────────────
export async function getSalaryHistory(filters = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return apiFetch(`/advance-payment/salary-history${qs ? `?${qs}` : ''}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const advancePaymentService = {
  getPaymentTypes,
  getStats,
  listRequests,
  getAllRequests,
  getRequest,
  createRequest,
  createPublicRequest,  // ← NEW: for unauthenticated link-based submissions
  approveRequest,
  rejectRequest,
  getDeductions,
  updateDeduction,
  createLink,
  listLinks,
  sendLinkEmail,
  validateLink,
  getSalaryHistory,
};

export default advancePaymentService;