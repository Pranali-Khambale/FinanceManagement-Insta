// =============================================================================
// FILE: src/services/reportsService.js
// =============================================================================

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

function getAuthToken() {
  try {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(
        data.message || `Request failed (${response.status})`,
      );
      err.status = response.status;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      throw new Error("Cannot connect to server.");
    }
    throw err;
  }
}

function buildQS(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v != null && typeof v !== "object") qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const reportsService = {
  // Payroll summary for a given month
  getPayrollSummary: (month) =>
    apiFetch(`/reports/payroll-summary${buildQS({ month })}`),

  // Advance payment analytics (all time)
  getAdvanceSummary: () => apiFetch("/reports/advance-summary"),

  // Employee headcount analytics
  getEmployeeSummary: () => apiFetch("/reports/employee-summary"),

  // Salary / deduction history for a given month
  getSalaryHistorySummary: (month, emp_id) =>
    apiFetch(`/reports/salary-history-summary${buildQS({ month, emp_id })}`),

  // Combined dashboard overview
  getDashboard: () => apiFetch("/reports/dashboard"),
};

export default reportsService;
