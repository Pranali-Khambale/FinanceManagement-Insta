// src/services/reportsService.js
// ─── Business logic: reports, unwraps { success, data } envelope ───────────────
import reportsRepository from '../repositories/reportsRepository';

// Unwrap the { success, data } envelope returned by all reports endpoints
async function unwrap(promise) {
  const data = await promise;
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) throw new Error(data.message || 'API error');
    return data.data;
  }
  return data; // already unwrapped
}

const reportsService = {
  getMonthly:    (year)               => unwrap(reportsRepository.getMonthly(year)),
  getQuarterly:  (year)               => unwrap(reportsRepository.getQuarterly(year)),
  getYearly:     (startYear = 2021)   => unwrap(reportsRepository.getYearly(startYear)),
  getDepartment: (year)               => unwrap(reportsRepository.getDepartment(year)),
  getSummary:    (year)               => unwrap(reportsRepository.getSummary(year)),

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