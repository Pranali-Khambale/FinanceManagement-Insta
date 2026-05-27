// src/repositories/advancePaymentRepository.js
// ─── Raw API calls for advance-payment endpoints ──────────────────────────────
import { apiFetch, publicFetch, buildQS, BASE_URL } from '../api/client';

const ALL_REQUEST_FIELDS = [
  'payment_type_key',
  'emp_id', 'emp_name', 'emp_dept', 'emp_email',
  'amount', 'reason',
  'to_emp_id', 'to_emp_name', 'to_emp_dept',
  'vendor_name', 'vendor_ref',
  'to_vendor_name', 'to_vendor_gst', 'to_vendor_ref',
  'to_vendor_amount', 'to_vendor_reason',
  'approver_name', 'approver_id', 'approver_designation',
];

function buildRequestFormData(formData, screenshotFile, proofFile, receiptFile, linkToken) {
  const body = new FormData();
  ALL_REQUEST_FIELDS.forEach((key) => {
    if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
      body.append(key, formData[key]);
    }
  });
  if (linkToken)    body.append('submitted_via_link', linkToken);
  body.append('screenshot', screenshotFile);
  if (proofFile)   body.append('proof',   proofFile);
  if (receiptFile) body.append('receipt', receiptFile);
  return body;
}

const advancePaymentRepository = {
  // ── Payment types & stats ──────────────────────────────────────────────────
  getPaymentTypes: ()         => apiFetch('/advance-payment/types'),
  getStats:        ()         => apiFetch('/advance-payment/stats'),

  // ── Requests ───────────────────────────────────────────────────────────────
  listRequests: (params = {}) => apiFetch(`/advance-payment/requests${buildQS(params)}`),
  getAllRequests: ()           => apiFetch('/advance-payment/requests?limit=1000&sort=created_at&order=DESC'),
  getRequestById: (id)        => apiFetch(`/advance-payment/requests/${id}`),

  createRequest: (formData, screenshotFile, proofFile, receiptFile, linkToken) =>
    apiFetch('/advance-payment/requests', {
      method: 'POST',
      body: buildRequestFormData(formData, screenshotFile, proofFile, receiptFile, linkToken),
    }),

  createPublicRequest: (formData, screenshotFile, proofFile, receiptFile, linkToken) =>
    publicFetch('/advance-payment/requests/public', {
      method: 'POST',
      body: buildRequestFormData(formData, screenshotFile, proofFile, receiptFile, linkToken),
    }),

  approveRequest: (id, options = {}) =>
    apiFetch(`/advance-payment/requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  rejectRequest: (id, rejection_reason = '') =>
    apiFetch(`/advance-payment/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason }),
    }),

  // ── Deductions ─────────────────────────────────────────────────────────────
  getDeductions: (requestId) =>
    apiFetch(`/advance-payment/requests/${requestId}/deductions`),

  updateDeduction: (deductionId, status, note = '') =>
    apiFetch(`/advance-payment/deductions/${deductionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  // ── Links ──────────────────────────────────────────────────────────────────
  createLink:    (params)      => apiFetch('/advance-payment/links', { method: 'POST', body: JSON.stringify(params) }),
  listLinks:     (activeOnly = false) => apiFetch(`/advance-payment/links${activeOnly ? '?active_only=true' : ''}`),
  sendLinkEmail: (payload)     => apiFetch('/advance-payment/links/send-email', { method: 'POST', body: JSON.stringify(payload) }),

  // ── Public (no auth) ───────────────────────────────────────────────────────
  validateLink: async (token) => {
    const response = await fetch(`${BASE_URL}/advance-payment/links/${token}/validate`);
    const data = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));
    if (!response.ok) {
      const err = new Error(data.message || `HTTP ${response.status}`);
      err.status = response.status; err.expired = data.expired || false; err.data = data;
      throw err;
    }
    return data;
  },

  validateResubmitToken: async (token) => {
    const response = await fetch(`${BASE_URL}/advance-payment/resubmit/${token}/validate`);
    const data = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));
    if (!response.ok) {
      const err = new Error(data.message || `HTTP ${response.status}`);
      err.status = response.status; err.expired = data.expired || false; err.data = data;
      throw err;
    }
    return data;
  },

  // ── Salary history ─────────────────────────────────────────────────────────
  getSalaryHistory: (filters = {}) =>
    apiFetch(`/advance-payment/salary-history${buildQS(filters)}`),

  getApprovedRequests: (filters = {}) => {
    const params = { status: 'approved', limit: 1000, ...filters };
    delete params.month;
    return apiFetch(`/advance-payment/requests${buildQS(params)}`);
  },
};

export default advancePaymentRepository;