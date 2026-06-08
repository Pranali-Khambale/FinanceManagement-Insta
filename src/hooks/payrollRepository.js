// src/repositories/payrollRepository.js
// ─── Raw API calls for payroll endpoints ──────────────────────────────────────
import { apiFetch, buildQS } from '../api/client';

const payrollRepository = {
  getAll:             (filters = {})            => apiFetch(`/payroll${buildQS(filters)}`),
  getByEmployee:      (employeeId, month)        => apiFetch(`/payroll/${employeeId}${month ? buildQS({ month }) : ''}`),
  getAdvanceSummary:  (month)                    => apiFetch(`/payroll/advance-summary${month ? buildQS({ month }) : ''}`),
  getStats:           ()                         => apiFetch('/payroll/stats'),
  upsertRecord:       (data)                     => apiFetch('/payroll/record', { method: 'POST', body: JSON.stringify(data) }),
  initMonth:          (forMonth)                 => apiFetch('/payroll/init-month', { method: 'POST', body: JSON.stringify({ for_month: forMonth }) }),
  markAsPaid:         (id)                       => apiFetch(`/payroll/${id}/pay`, { method: 'POST' }),
  markBulkPaid:       (recordIds, forMonth)      =>
    apiFetch('/payroll/pay-bulk', {
      method: 'POST',
      body: JSON.stringify({ record_ids: recordIds, for_month: forMonth }),
    }),
};

export default payrollRepository;