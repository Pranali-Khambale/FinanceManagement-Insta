// src/services/advancePaymentService.js
// ─── Business logic: advance payments, salary history fallback ─────────────────
import advancePaymentRepository from '../hooks/advancePaymentRepository';

const advancePaymentService = {
  // ── Lookups ────────────────────────────────────────────────────────────────
  getPaymentTypes: () => advancePaymentRepository.getPaymentTypes(),
  getStats:        () => advancePaymentRepository.getStats(),

  // ── Requests ───────────────────────────────────────────────────────────────
  listRequests:        (params)    => advancePaymentRepository.listRequests(params),
  getAllRequests:       ()          => advancePaymentRepository.getAllRequests(),
  getRequest:          (id)        => advancePaymentRepository.getRequestById(id),
  getAdvanceHistory:   (filters)   => advancePaymentRepository.listRequests({ limit: 1000, sort: 'created_at', order: 'DESC', ...filters }),
  createRequest:       (...args)   => advancePaymentRepository.createRequest(...args),
  createPublicRequest: (...args)   => advancePaymentRepository.createPublicRequest(...args),
  approveRequest:      (id, opts)  => advancePaymentRepository.approveRequest(id, opts),
  rejectRequest:       (id, reason)=> advancePaymentRepository.rejectRequest(id, reason),

  // ── Deductions ─────────────────────────────────────────────────────────────
  getDeductions:   (requestId)              => advancePaymentRepository.getDeductions(requestId),
  updateDeduction: (id, status, note)       => advancePaymentRepository.updateDeduction(id, status, note),

  // ── Links ──────────────────────────────────────────────────────────────────
  createLink:            (params)  => advancePaymentRepository.createLink(params),
  listLinks:             (active)  => advancePaymentRepository.listLinks(active),
  sendLinkEmail:         (payload) => advancePaymentRepository.sendLinkEmail(payload),
  validateLink:          (token)   => advancePaymentRepository.validateLink(token),
  validateResubmitToken: (token)   => advancePaymentRepository.validateResubmitToken(token),

  // ── Salary history (with approved-requests fallback) ──────────────────────
  getSalaryHistory: async (filters = {}) => {
    // 1. Try the dedicated endpoint first
    try {
      const result = await advancePaymentRepository.getSalaryHistory(filters);
      if (result?.data?.length > 0) return result;
    } catch (_) {}

    // 2. Fall back to approved requests shaped as salary history rows
    const fallback = await advancePaymentRepository.getApprovedRequests(filters);
    const shaped = (fallback?.data || []).map((r) => ({
      deduction_id:       null,
      month_label:        r.adjusted_in || filters.month || 'Pending EMI',
      deduction_amount:   r.amount,
      deduction_status:   'upcoming',
      processed_at:       null,
      request_id:         r.id,
      request_code:       r.request_code,
      emp_id:             r.emp_id,
      emp_name:           r.emp_name,
      emp_dept:           r.emp_dept,
      advance_amount:     r.amount,
      payment_type_key:   r.payment_type_key,
      payment_type_label: r.payment_type_label || r.payment_type_key,
      reason:             r.reason,
      adjusted_in:        r.adjusted_in,
      status:             r.status,
      created_at:         r.created_at,
      reviewed_by_name:   r.reviewed_by_name,
      reviewed_at:        r.reviewed_at,
      to_vendor_name:     r.to_vendor_name || null,
      approver_name:      r.approver_name || null,
    }));
    return { success: true, data: shaped, _fallback: true };
  },
};

export default advancePaymentService;