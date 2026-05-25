// src/services/reportsService.js
import { apiFetch, buildQS } from './api';

// Reports API unwraps the { success, data } envelope for the caller
async function reportFetch(endpoint) {
  const data = await apiFetch(endpoint);
  // apiFetch already throws on !response.ok — here we just check success flag
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) throw new Error(data.message || `API error at ${endpoint}`);
    return data.data;
  }
  return data; // already unwrapped by backend
}

const reportsService = {
  getMonthly:    (year)               => reportFetch(`/reports/monthly${buildQS({ year })}`),
  getQuarterly:  (year)               => reportFetch(`/reports/quarterly${buildQS({ year })}`),
  getYearly:     (startYear = 2021)   => reportFetch(`/reports/yearly${buildQS({ startYear })}`),
  getDepartment: (year)               => reportFetch(`/reports/department${buildQS({ year })}`),
  getSummary:    (year)               => reportFetch(`/reports/summary${buildQS({ year })}`),

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