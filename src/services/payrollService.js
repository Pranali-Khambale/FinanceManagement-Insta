// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/services/payrollService.js
//
// FIXED: URLSearchParams was iterating string characters when a filter
//        value was a plain string (e.g. month="April 2026" → ?0=A&1=p…).
//        Now we sanitize every value to a primitive before building the QS.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

// ── Auth token helper ─────────────────────────────────────────────────────────
function getAuthToken() {
  try {
    return (
      localStorage.getItem('token')       ||
      localStorage.getItem('authToken')   ||
      sessionStorage.getItem('token')     ||
      sessionStorage.getItem('authToken') ||
      ''
    );
  } catch {
    return '';
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkErr) {
    const err = new Error(`Network error — is the server running at ${BASE_URL}?`);
    err.status = 0;
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const err = new Error(`Invalid JSON from server (status ${response.status})`);
    err.status = response.status;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(data?.message || `Request failed (${response.status})`);
    err.status  = response.status;
    err.payload = data;
    throw err;
  }

  return data;
}

// ── Safe query-string builder ─────────────────────────────────────────────────
// URLSearchParams iterates arrays and iterables character-by-character when a
// plain string is passed through Object.fromEntries, which produces
// ?0=A&1=p&2=r… instead of ?month=April+2026.
// We always convert to string/number primitives first.
function buildQS(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === '' || value == null) continue;
    // Guard: only append primitives — arrays / objects would still iterate wrong
    if (typeof value === 'object') continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════
const payrollService = {

  // ── Payroll list ────────────────────────────────────────────────────────────
  /**
   * @param {{ month?, status?, search?, dept?, page?, limit? }} filters
   * @returns {Promise<{ data: { employees, summary }, forMonth, pagination }>}
   */
  getPayrollData: (filters = {}) =>
    apiFetch(`/payroll${buildQS(filters)}`),

  // ── Single employee payroll detail ─────────────────────────────────────────
  /**
   * @param {string|number} employeeId  DB id or business ID (e.g. EMP012)
   * @param {string}        month       e.g. "April 2026"
   */
  getEmployeePayroll: (employeeId, month) => {
    const qs = month ? buildQS({ month }) : '';
    return apiFetch(`/payroll/${employeeId}${qs}`);
  },

  // ── Advance summary ─────────────────────────────────────────────────────────
  getAdvanceSummary: (month) => {
    const qs = month ? buildQS({ month }) : '';
    return apiFetch(`/payroll/advance-summary${qs}`);
  },

  // ── Stats ───────────────────────────────────────────────────────────────────
  getStats: () => apiFetch('/payroll/stats'),

  // ── Upsert a payroll record ─────────────────────────────────────────────────
  upsertRecord: (data) =>
    apiFetch('/payroll/record', {
      method : 'POST',
      body   : JSON.stringify(data),
    }),

  // ── Init all records for a month ───────────────────────────────────────────
  initMonth: (forMonth) =>
    apiFetch('/payroll/init-month', {
      method : 'POST',
      body   : JSON.stringify({ for_month: forMonth }),
    }),

  // ── Mark one record paid ────────────────────────────────────────────────────
  markAsPaid: (payrollRecordId) =>
    apiFetch(`/payroll/${payrollRecordId}/pay`, { method: 'POST' }),

  // ── Bulk mark paid ──────────────────────────────────────────────────────────
  markBulkPaid: (recordIds, forMonth) =>
    apiFetch('/payroll/pay-bulk', {
      method : 'POST',
      body   : JSON.stringify({ record_ids: recordIds, for_month: forMonth }),
    }),

  // ── Save attendance ─────────────────────────────────────────────────────────
  /**
   * @param {{ id, pDays, aDays, monthDays, forMonth }[]} rows
   */
  saveAttendance: async (rows) => {
    const results = await Promise.allSettled(
      rows.map(r =>
        apiFetch('/payroll/record', {
          method : 'POST',
          body   : JSON.stringify({
            employee_id : r.id,
            for_month   : r.forMonth,
            p_days      : r.pDays,
            month_days  : r.monthDays,
          }),
        })
      )
    );
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length) {
      console.warn(`saveAttendance: ${failed.length} record(s) failed`, failed);
    }
    return {
      success : true,
      saved   : rows.length - failed.length,
      failed  : failed.length,
      errors  : failed.map(f => f.reason?.message),
    };
  },
};

export default payrollService;