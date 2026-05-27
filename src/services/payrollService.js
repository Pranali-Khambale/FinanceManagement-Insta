// src/services/payrollService.js
import { apiFetch, buildQS } from './api';

const payrollService = {
  getPayrollData:      (filters = {}) => apiFetch(`/payroll${buildQS(filters)}`),
  getEmployeePayroll:  (employeeId, month) => apiFetch(`/payroll/${employeeId}${month ? buildQS({ month }) : ''}`),
  getAdvanceSummary:   (month) => apiFetch(`/payroll/advance-summary${month ? buildQS({ month }) : ''}`),
  getStats:            ()      => apiFetch('/payroll/stats'),
  upsertRecord:        (data)  => apiFetch('/payroll/record', { method: 'POST', body: JSON.stringify(data) }),
  initMonth:           (forMonth) => apiFetch('/payroll/init-month', { method: 'POST', body: JSON.stringify({ for_month: forMonth }) }),
  markAsPaid:          (id)    => apiFetch(`/payroll/${id}/pay`, { method: 'POST' }),
  markBulkPaid:        (recordIds, forMonth) =>
    apiFetch('/payroll/pay-bulk', { method: 'POST', body: JSON.stringify({ record_ids: recordIds, for_month: forMonth }) }),

  saveAttendance: async (rows) => {
    const results = await Promise.allSettled(
      rows.map(r => apiFetch('/payroll/record', {
        method: 'POST',
        body: JSON.stringify({ employee_id: r.id, for_month: r.forMonth, p_days: r.pDays, month_days: r.monthDays }),
      }))
    );
    const failed = results.filter(r => r.status === 'rejected');
    return { success: true, saved: rows.length - failed.length, failed: failed.length, errors: failed.map(f => f.reason?.message) };
  },
};

export default payrollService;