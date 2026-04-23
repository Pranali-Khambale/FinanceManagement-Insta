// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/services/advancePaymentService.js
//
// CHANGES vs previous version:
//   ORG_TO_VENDOR: createRequest and createPublicRequest now send
//     to_vendor_name, to_vendor_gst, to_vendor_ref, to_vendor_amount,
//     to_vendor_reason, approver_name, approver_id, approver_designation
//     so the backend _insertRequest receives all fields it needs.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

// ── Auth token ────────────────────────────────────────────────────────────────
function getAuthToken() {
  try {
    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
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

// ── Public fetch wrapper (NO auth token) ──────────────────────────────────────
async function publicFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
// REQUESTS — list (with filters)
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
// getAdvanceHistory — all requests for history modal display
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdvanceHistory(filters = {}) {
  const params = { limit: 1000, sort: 'created_at', order: 'DESC', ...filters };
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return apiFetch(`/advance-payment/requests${qs ? `?${qs}` : ''}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ALL FORM FIELDS sent to the backend ───────────────────────────────────────
// This is the complete field list covering all 4 payment types:
//   org_to_emp   : emp_id, emp_name, emp_dept, amount, reason
//   emp_to_emp   : above + to_emp_id, to_emp_name, to_emp_dept
//   other        : emp fields + vendor_name, vendor_ref
//   org_to_vendor: to_vendor_name, to_vendor_gst, to_vendor_ref,
//                  to_vendor_amount, to_vendor_reason
//   all types    : approver_name, approver_id, approver_designation
// ─────────────────────────────────────────────────────────────────────────────
const ALL_REQUEST_FIELDS = [
  // employee fields
  'payment_type_key',
  'emp_id', 'emp_name', 'emp_dept', 'emp_email',
  'amount', 'reason',
  // emp_to_emp recipient
  'to_emp_id', 'to_emp_name', 'to_emp_dept',
  // other: external vendor
  'vendor_name', 'vendor_ref',
  // org_to_vendor: vendor is primary entity
  'to_vendor_name', 'to_vendor_gst', 'to_vendor_ref',
  'to_vendor_amount', 'to_vendor_reason',
  // approver — all 4 types
  'approver_name', 'approver_id', 'approver_designation',
];

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

  ALL_REQUEST_FIELDS.forEach(key => {
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
// ─────────────────────────────────────────────────────────────────────────────
export async function createPublicRequest(
  formData,
  screenshotFile,
  proofFile,
  receiptFile,
  linkToken,
) {
  const body = new FormData();

  ALL_REQUEST_FIELDS.forEach(key => {
    if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
      body.append(key, formData[key]);
    }
  });

  if (linkToken) body.append('submitted_via_link', linkToken);

  body.append('screenshot', screenshotFile);
  if (proofFile)   body.append('proof',   proofFile);
  if (receiptFile) body.append('receipt', receiptFile);

  return publicFetch('/advance-payment/requests/public', { method: 'POST', body });
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — approve
// ─────────────────────────────────────────────────────────────────────────────
export async function approveRequest(id, options = {}) {
  return apiFetch(`/advance-payment/requests/${id}/approve`, {
    method: 'POST',
    body:   JSON.stringify(options),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — reject
// ─────────────────────────────────────────────────────────────────────────────
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
// validateResubmitToken
// ─────────────────────────────────────────────────────────────────────────────
export async function validateResubmitToken(token) {
  const url      = `${BASE_URL}/advance-payment/resubmit/${token}/validate`;
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

  try {
    const result = await apiFetch(`/advance-payment/salary-history${qs ? `?${qs}` : ''}`);
    if (result?.data?.length > 0) return result;
  } catch (_) {}

  try {
    const approvedParams = { status: 'approved', limit: 1000, ...filters };
    delete approvedParams.month;
    const approvedQs = new URLSearchParams(
      Object.fromEntries(Object.entries(approvedParams).filter(([, v]) => v !== '' && v != null))
    ).toString();
    const fallback = await apiFetch(`/advance-payment/requests${approvedQs ? `?${approvedQs}` : ''}`);

    const shaped = (fallback?.data || []).map(r => ({
      deduction_id:        null,
      month_label:         r.adjusted_in || filters.month || 'Pending EMI',
      deduction_amount:    r.amount,
      deduction_status:    'upcoming',
      processed_at:        null,
      request_id:          r.id,
      request_code:        r.request_code,
      emp_id:              r.emp_id,
      emp_name:            r.emp_name,
      emp_dept:            r.emp_dept,
      advance_amount:      r.amount,
      payment_type_key:    r.payment_type_key,
      payment_type_label:  r.payment_type_label || r.payment_type_key,
      reason:              r.reason,
      adjusted_in:         r.adjusted_in,
      status:              r.status,
      created_at:          r.created_at,
      reviewed_by_name:    r.reviewed_by_name,
      reviewed_at:         r.reviewed_at,
      to_vendor_name:      r.to_vendor_name || null,
      approver_name:       r.approver_name  || null,
    }));

    return { success: true, data: shaped, _fallback: true };
  } catch (err) {
    throw err;
  }
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
  getAdvanceHistory,
  createRequest,
  createPublicRequest,
  approveRequest,
  rejectRequest,
  getDeductions,
  updateDeduction,
  createLink,
  listLinks,
  sendLinkEmail,
  validateLink,
  validateResubmitToken,
  getSalaryHistory,
};

export default advancePaymentService;