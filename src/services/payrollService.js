// src/services/payrollService.js
// ─── Business logic: payroll operations ───────────────────────────────────────
import payrollRepository from '../hooks/payrollRepository';

const payrollService = {
  getPayrollData:     (filters = {})          => payrollRepository.getAll(filters),
  getEmployeePayroll: (employeeId, month)      => payrollRepository.getByEmployee(employeeId, month),
  getAdvanceSummary:  (month)                  => payrollRepository.getAdvanceSummary(month),
  getStats:           ()                       => payrollRepository.getStats(),
  upsertRecord:       (data)                   => payrollRepository.upsertRecord(data),
  initMonth:          (forMonth)               => payrollRepository.initMonth(forMonth),
  markAsPaid:         (id)                     => payrollRepository.markAsPaid(id),
  markBulkPaid:       (recordIds, forMonth)    => payrollRepository.markBulkPaid(recordIds, forMonth),

  saveAttendance: async (rows) => {
    const results = await Promise.allSettled(
      rows.map((r) =>
        payrollRepository.upsertRecord({
          employee_id: r.id,
          for_month:   r.forMonth,
          p_days:      r.pDays,
          month_days:  r.monthDays,
        }),
      ),
    );
    const failed = results.filter((r) => r.status === 'rejected');
    return {
      success: true,
      saved:   rows.length - failed.length,
      failed:  failed.length,
      errors:  failed.map((f) => f.reason?.message),
    };
  },
};

export default payrollService;