// src/Ui/Reports/useReportData.js
// Centralised data hook — replace the mock generators with real API calls.

import { useState, useEffect, useCallback } from "react";

// ─── helpers ─────────────────────────────────────────────────────────────────
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── mock data generators (swap for axios/fetch calls) ────────────────────────

function genMonthly(year) {
  return MONTHS.map((month, i) => ({
    month,
    index: i,
    // Payroll
    totalPayroll: rand(400000, 600000),
    basicPay: rand(200000, 280000),
    hra: rand(80000, 120000),
    orgAllowance: rand(60000, 100000),
    performancePay: rand(20000, 60000),
    totalDeductions: rand(40000, 80000),
    pfDeduction: rand(20000, 50000),
    ptDeduction: rand(5000, 15000),
    netPayroll: rand(320000, 520000),
    employeesPaid: rand(18, 35),
    // Advance Payments
    advanceIssued: rand(20000, 80000),
    advanceRecovered: rand(15000, 60000),
    advancePending: rand(10000, 40000),
    advanceCount: rand(2, 12),
  }));
}

function genQuarterly(year) {
  const quarters = [
    "Q1 (Jan-Mar)",
    "Q2 (Apr-Jun)",
    "Q3 (Jul-Sep)",
    "Q4 (Oct-Dec)",
  ];
  return quarters.map((label, i) => ({
    quarter: label,
    shortLabel: `Q${i + 1}`,
    totalPayroll: rand(1200000, 1800000),
    netPayroll: rand(980000, 1500000),
    totalDeductions: rand(120000, 300000),
    performancePay: rand(60000, 200000),
    advanceIssued: rand(80000, 250000),
    advanceRecovered: rand(60000, 200000),
    advancePending: rand(20000, 80000),
    employeesPaid: rand(20, 35),
  }));
}

function genYearly(startYear = 2021) {
  const years = [];
  for (let y = startYear; y <= new Date().getFullYear(); y++) {
    years.push({
      year: String(y),
      totalPayroll: rand(5000000, 8000000),
      netPayroll: rand(4000000, 6500000),
      totalDeductions: rand(500000, 1200000),
      performancePay: rand(200000, 800000),
      advanceIssued: rand(300000, 900000),
      advanceRecovered: rand(250000, 750000),
      advancePending: rand(50000, 200000),
      avgEmployees: rand(20, 35),
    });
  }
  return years;
}

function genDeptBreakdown() {
  const depts = [
    "Engineering",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "Marketing",
  ];
  return depts.map((dept) => ({
    dept,
    payroll: rand(80000, 200000),
    headcount: rand(3, 12),
    advances: rand(5000, 30000),
  }));
}

function genPayrollComponents(monthly) {
  // Aggregate for pie chart
  const totals = monthly.reduce(
    (acc, m) => ({
      basicPay: acc.basicPay + m.basicPay,
      hra: acc.hra + m.hra,
      orgAllowance: acc.orgAllowance + m.orgAllowance,
      performancePay: acc.performancePay + m.performancePay,
      pfDeduction: acc.pfDeduction + m.pfDeduction,
      ptDeduction: acc.ptDeduction + m.ptDeduction,
    }),
    {
      basicPay: 0,
      hra: 0,
      orgAllowance: 0,
      performancePay: 0,
      pfDeduction: 0,
      ptDeduction: 0,
    },
  );

  return [
    { label: "Basic Pay", value: totals.basicPay, color: "#3b82f6" },
    { label: "HRA", value: totals.hra, color: "#8b5cf6" },
    { label: "Org Allowance", value: totals.orgAllowance, color: "#06b6d4" },
    {
      label: "Performance Pay",
      value: totals.performancePay,
      color: "#10b981",
    },
    { label: "PF Deduction", value: totals.pfDeduction, color: "#f59e0b" },
    { label: "PT Deduction", value: totals.ptDeduction, color: "#ef4444" },
  ];
}

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useReportData() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [view, setView] = useState("monthly"); // monthly | quarterly | yearly
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    // Simulate API latency
    setTimeout(() => {
      const monthly = genMonthly(year);
      const quarterly = genQuarterly(year);
      const yearly = genYearly(2021);
      const deptBreak = genDeptBreakdown();
      const pieData = genPayrollComponents(monthly);

      const totals = monthly.reduce(
        (a, m) => ({
          payroll: a.payroll + m.totalPayroll,
          net: a.net + m.netPayroll,
          deduct: a.deduct + m.totalDeductions,
          advance: a.advance + m.advanceIssued,
          recovered: a.recovered + m.advanceRecovered,
          pending: a.pending + m.advancePending,
        }),
        { payroll: 0, net: 0, deduct: 0, advance: 0, recovered: 0, pending: 0 },
      );

      setData({ monthly, quarterly, yearly, deptBreak, pieData, totals, year });
      setLoading(false);
    }, 400);
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    year,
    setYear,
    view,
    setView,
    refresh: load,
    currentYear,
  };
}

export { MONTHS };
