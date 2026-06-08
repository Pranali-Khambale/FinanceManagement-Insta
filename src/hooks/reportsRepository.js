// src/repositories/reportsRepository.js
// ─── Raw API calls for reports endpoints ──────────────────────────────────────
import { apiFetch, buildQS } from '../api/client';

const reportsRepository = {
  getMonthly:    (year)             => apiFetch(`/reports/monthly${buildQS({ year })}`),
  getQuarterly:  (year)             => apiFetch(`/reports/quarterly${buildQS({ year })}`),
  getYearly:     (startYear = 2021) => apiFetch(`/reports/yearly${buildQS({ startYear })}`),
  getDepartment: (year)             => apiFetch(`/reports/department${buildQS({ year })}`),
  getSummary:    (year)             => apiFetch(`/reports/summary${buildQS({ year })}`),
};

export default reportsRepository;