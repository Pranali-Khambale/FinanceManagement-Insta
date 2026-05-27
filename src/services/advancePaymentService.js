// src/services/advancePaymentService.js
import { apiFetch, publicFetch, BASE_URL } from './api';
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

export const getPaymentTypes  = () => apiFetch('/advance-payment/types');
export const getStats         = () => apiFetch('/advance-payment/stats');

export function listRequests(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return apiFetch(`/advance-payment/requests${qs ? `?${qs}` : ''}`);
}

export const getAllRequests = () =>
  apiFetch('/advance-payment/requests?limit=1000&sort=created_at&order=DESC');

export const getRequest = (id) => apiFetch(`/advance-payment/requests/${id}`);

export function getAdvanceHistory(filters = {}) {
  const params = { limit: 1000, sort: 'created_at', order: 'DESC', ...filters };
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return apiFetch(`/advance-payment/requests${qs ? `?${qs}` : ''}`);
}

function buildRequestBody(formData, screenshotFile, proofFile, receiptFile, linkToken) {
  const body = new FormData();
  ALL_REQUEST_FIELDS.forEach(key => {
    if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
      body.append(key, formData[key]);
    }
  });
  if (linkToken)   body.append('submitted_via_link', linkToken);
  body.append('screenshot', screenshotFile);
  if (proofFile)   body.append('proof',   proofFile);
  if (receiptFile) body.append('receipt', receiptFile);
  return body;
}

export const createRequest = (formData, screenshotFile, proofFile, receiptFile, linkToken) =>
  apiFetch('/advance-payment/requests', {
    method: 'POST',
    body: buildRequestBody(formData, screenshotFile, proofFile, receiptFile, linkToken),
  });

export const createPublicRequest = (formData, screenshotFile, proofFile, receiptFile, linkToken) =>
  publicFetch('/advance-payment/requests/public', {
    method: 'POST',
    body: buildRequestBody(formData, screenshotFile, proofFile, receiptFile, linkToken),
  });

export const approveRequest = (id, options = {}) =>
  apiFetch(`/advance-payment/requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(options),
  });

export const rejectRequest = (id, rejection_reason = '') =>
  apiFetch(`/advance-payment/requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason }),
  });

export const getDeductions  = (requestId)          => apiFetch(`/advance-payment/requests/${requestId}/deductions`);
export const updateDeduction = (deductionId, status, note = '') =>
  apiFetch(`/advance-payment/deductions/${deductionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });

export const createLink = (params) =>
  apiFetch('/advance-payment/links', { method: 'POST', body: JSON.stringify(params) });

export const listLinks = (activeOnly = false) =>
  apiFetch(`/advance-payment/links${activeOnly ? '?active_only=true' : ''}`);

export const sendLinkEmail = ({ token, email, payment_type_key }) =>
  apiFetch('/advance-payment/links/send-email', {
    method: 'POST',
    body: JSON.stringify({ token, email, payment_type_key }),
  });

// Public — no auth token, no wrapper needed
export async function validateLink(token) {
  const response = await fetch(`${BASE_URL}/advance-payment/links/${token}/validate`);
  const data = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));
  if (!response.ok) {
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status; err.expired = data.expired || false; err.data = data;
    throw err;
  }
  return data;
}

export async function validateResubmitToken(token) {
  const response = await fetch(`${BASE_URL}/advance-payment/resubmit/${token}/validate`);
  const data = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));
  if (!response.ok) {
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status; err.expired = data.expired || false; err.data = data;
    throw err;
  }
  return data;
}

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
      deduction_id: null,
      month_label: r.adjusted_in || filters.month || 'Pending EMI',
      deduction_amount: r.amount, deduction_status: 'upcoming', processed_at: null,
      request_id: r.id, request_code: r.request_code,
      emp_id: r.emp_id, emp_name: r.emp_name, emp_dept: r.emp_dept,
      advance_amount: r.amount, payment_type_key: r.payment_type_key,
      payment_type_label: r.payment_type_label || r.payment_type_key,
      reason: r.reason, adjusted_in: r.adjusted_in, status: r.status,
      created_at: r.created_at, reviewed_by_name: r.reviewed_by_name,
      reviewed_at: r.reviewed_at, to_vendor_name: r.to_vendor_name || null,
      approver_name: r.approver_name || null,
    }));
    return { success: true, data: shaped, _fallback: true };
  } catch (err) {
    throw err;
  }
}

const advancePaymentService = {
  getPaymentTypes, getStats, listRequests, getAllRequests, getRequest,
  getAdvanceHistory, createRequest, createPublicRequest,
  approveRequest, rejectRequest, getDeductions, updateDeduction,
  createLink, listLinks, sendLinkEmail, validateLink,
  validateResubmitToken, getSalaryHistory,
};

export default advancePaymentService;