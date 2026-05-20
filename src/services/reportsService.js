// =============================================================================
// FILE: src/services/reportsService.js
//
// Matches the 5 endpoints consumed by useReportData.js:
//   GET /api/reports/monthly?year=
//   GET /api/reports/quarterly?year=
//   GET /api/reports/yearly?startYear=
//   GET /api/reports/department?year=
//   GET /api/reports/summary?year=
//
// All responses follow: { success: boolean, data: any, year?: number }
// =============================================================================

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

// ── Auth token ────────────────────────────────────────────────────────────────
function getAuthToken() {
  try {
    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('token')     ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token')   ||
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
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkErr) {
    throw new Error(`Network error — is the server running at ${BASE_URL}?`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid JSON from server (status ${response.status})`);
  }

  if (!response.ok) {
    const err     = new Error(data?.message || `Request failed (${response.status})`);
    err.status    = response.status;
    err.payload   = data;
    throw err;
  }

  // The reports controller wraps everything in { success, data, year? }
  // useReportData calls apiFetch directly and reads .data, so we unwrap here
  // to keep the hook's existing `json.data` pattern working.
  if (!data.success) {
    throw new Error(data.message || `API error at ${endpoint}`);
  }

  return data.data;
}

// ── Safe query-string builder ─────────────────────────────────────────────────
function buildQS(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === '' || value == null) continue;
    if (typeof value === 'object') continue;       // skip arrays / objects
    qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// =============================================================================
// PUBLIC API
// =============================================================================
const reportsService = {

  // ── Monthly payroll + advance breakdown ──────────────────────────────────────
  // Returns array[12] — one entry per calendar month for the given year.
  // Each entry contains: totalPayroll, netPayroll, pfDeduction, employerPf,
  //   totalPf, ptDeduction, gratuity, tdsDeduction, otherDeduction,
  //   advanceIssued, advanceRecovered, advancePending, employeesPaid, etc.
  // Called by: useReportData → data.monthly
  getMonthly: (year) =>
    apiFetch(`/reports/monthly${buildQS({ year })}`),

  // ── Quarterly rollup ─────────────────────────────────────────────────────────
  // Returns array[4] — Q1..Q4 aggregates for the given year.
  // Each entry: quarter, shortLabel, totalPayroll, netPayroll, totalDeductions,
  //   pfDeduction, employerPf, totalPf, ptDeduction, gratuity, tdsDeduction,
  //   advanceIssued, advanceRecovered, advancePending, employeesPaid, etc.
  // Called by: useReportData → data.quarterly
  getQuarterly: (year) =>
    apiFetch(`/reports/quarterly${buildQS({ year })}`),

  // ── Year-over-year summary ───────────────────────────────────────────────────
  // Returns array[startYear..currentYear] — one entry per calendar year.
  // Each entry: year, totalPayroll, netPayroll, totalDeductions,
  //   pfDeduction, employerPf, totalPf, ptDeduction, gratuity, tdsDeduction,
  //   advanceIssued, advanceRecovered, advancePending, avgEmployees, etc.
  // Called by: useReportData → data.yearly
  getYearly: (startYear = 2021) =>
    apiFetch(`/reports/yearly${buildQS({ startYear })}`),

  // ── Department breakdown ─────────────────────────────────────────────────────
  // Returns array of { dept, headcount, payroll, advances, pfTotal }.
  // Only includes active employees with at least one Paid payroll record.
  // Called by: useReportData → data.deptBreak  →  DeptTable + Overview tab
  getDepartment: (year) =>
    apiFetch(`/reports/department${buildQS({ year })}`),

  // ── Year KPI summary ─────────────────────────────────────────────────────────
  // Returns a single object with:
  //   payroll, net, deduct            — main KPI cards
  //   advance, recovered, pending     — advance KPI cards
  //   pfEmployee, pfEmployer, pfTotal — PF breakdown
  //   ptTotal, gratuity, tdsTotal, otherDed, advDed, advAdd
  // Called by: useReportData → data.totals  →  KpiCards
  getSummary: (year) =>
    apiFetch(`/reports/summary${buildQS({ year })}`),

  // ── Convenience: fetch all 5 in parallel ─────────────────────────────────────
  // Mirrors what useReportData does internally. Useful if you want to call
  // the service directly from a component without using the hook.
  // Returns: { monthly, quarterly, yearly, deptBreak, summary }
  fetchAll: async (year, startYear = 2021) => {
    const [monthly, quarterly, yearly, deptBreak, summary] = await Promise.all([
      reportsService.getMonthly(year),
      reportsService.getQuarterly(year),
      reportsService.getYearly(startYear),
      reportsService.getDepartment(year),
      reportsService.getSummary(year),
    ]);
    return { monthly, quarterly, yearly, deptBreak, summary };
  },
};

export default reportsService;
