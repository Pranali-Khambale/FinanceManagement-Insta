// =============================================================================
// FILE: src/Ui/Reports/useReportData.js
// =============================================================================
import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── helpers ─────────────────────────────────────────────────────────────────
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || `API error at ${path}`);
  return json.data;
}

// ─── derive payroll component pie data from monthly rows ─────────────────────
// Aggregates ALL 12 months into year totals, then builds slices.
// Includes gratuity + both PF shares — matching computePayslip in PayrollTable.
function buildPieData(monthly) {
  const totals = monthly.reduce(
    (acc, m) => ({
      basicPay:        acc.basicPay        + (m.basicPay        || 0),
      hra:             acc.hra             + (m.hra              || 0),
      orgAllowance:    acc.orgAllowance    + (m.orgAllowance     || 0),
      performancePay:  acc.performancePay  + (m.performancePay   || 0),
      // PF: employee share (12%) + employer share (13%) reported together
      pfDeduction:     acc.pfDeduction     + (m.pfDeduction      || 0),
      employerPf:      acc.employerPf      + (m.employerPf       || 0),
      ptDeduction:     acc.ptDeduction     + (m.ptDeduction      || 0),
      gratuity:        acc.gratuity        + (m.gratuity         || 0),
      tdsDeduction:    acc.tdsDeduction    + (m.tdsDeduction     || 0),
      otherDeduction:  acc.otherDeduction  + (m.otherDeduction   || 0),
    }),
    {
      basicPay: 0, hra: 0, orgAllowance: 0, performancePay: 0,
      pfDeduction: 0, employerPf: 0, ptDeduction: 0,
      gratuity: 0, tdsDeduction: 0, otherDeduction: 0,
    }
  );

  return [
    { label: 'Basic Pay',       value: totals.basicPay,                           color: '#3b82f6' },
    { label: 'HRA',             value: totals.hra,                                color: '#8b5cf6' },
    { label: 'Org Allowance',   value: totals.orgAllowance,                       color: '#06b6d4' },
    { label: 'Performance Pay', value: totals.performancePay,                     color: '#10b981' },
    { label: 'PF (Emp 12%)',    value: totals.pfDeduction,                        color: '#ef4444' },
    { label: 'PF (Co. 13%)',    value: totals.employerPf,                         color: '#f97316' },
    { label: 'PT',              value: totals.ptDeduction,                        color: '#f59e0b' },
    { label: 'Gratuity (4.81%)',value: totals.gratuity,                           color: '#a78bfa' },
    { label: 'TDS',             value: totals.tdsDeduction,                       color: '#ec4899' },
    { label: 'Other Deductions',value: totals.otherDeduction,                     color: '#94a3b8' },
  ].filter(d => d.value > 0);
}

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useReportData() {
  const currentYear = new Date().getFullYear();
  const [year, setYear]       = useState(currentYear);
  const [view, setView]       = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [monthly, quarterly, yearly, deptBreak, summary] = await Promise.all([
        apiFetch(`/reports/monthly?year=${year}`),
        apiFetch(`/reports/quarterly?year=${year}`),
        apiFetch(`/reports/yearly?startYear=2021`),
        apiFetch(`/reports/department?year=${year}`),
        apiFetch(`/reports/summary?year=${year}`),
      ]);

      const pieData = buildPieData(monthly);

      setData({
        monthly,
        quarterly,
        yearly,
        deptBreak,
        pieData,
        totals: {
          payroll:   summary.payroll,
          net:       summary.net,
          deduct:    summary.deduct,       // includes gratuity + both PF shares
          advance:   summary.advance,
          recovered: summary.recovered,
          pending:   summary.pending,
          // extra breakdown available on data.totals if needed by future cards
          pfEmployee:  summary.pfEmployee,
          pfEmployer:  summary.pfEmployer,
          pfTotal:     summary.pfTotal,
          ptTotal:     summary.ptTotal,
          gratuity:    summary.gratuity,
          tdsTotal:    summary.tdsTotal,
          otherDed:    summary.otherDed,
          advDed:      summary.advDed,
          advAdd:      summary.advAdd,
        },
        year,
      });
    } catch (err) {
      console.error('useReportData fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  return {
    data,
    loading,
    error,
    year,
    setYear,
    view,
    setView,
    refresh: load,
    currentYear,
  };
}