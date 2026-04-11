// src/pages/PayrollPage.jsx

import React, { useState } from "react";

// ── UI Components from src/Ui/Payroll/ ──────────────────────────────────────
import PayrollHeader from "../Ui/Payroll/PayrollHeader";
import PayrollStats from "../Ui/Payroll/PayrollStats";
import PayrollTable from "../Ui/Payroll/PayrollTable";

// ── Data from src/data/ ──────────────────────────────────────────────────────
import { payrollEmployees, payrollSummaryData } from "../data/PayrollData";

// ─────────────────────────────────────────────────────────────────────────────

const PayrollPage = () => {
  const [employees, setEmployees] = useState(payrollEmployees);
  const [runToast, setRunToast] = useState(null);

  /* Live summary derived from current employee state */
  const liveSummary = {
    totalEmployees: payrollSummaryData.totalEmployees,
    totalPayroll: payrollSummaryData.totalPayroll,
    paid: employees.filter((e) => e.status === "Paid").length,
    pending: employees.filter((e) =>
      ["Pending", "Processing"].includes(e.status),
    ).length,
    processing: employees.filter((e) => e.status === "Processing").length,
    avgSalary: payrollSummaryData.avgSalary,
  };

  /* Called by PayrollTable when a payment is confirmed or rejected */
  const handleUpdateStatus = (id, newStatus) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
    );
  };

  /* Called by PayrollHeader when Run Payroll is confirmed */
  const handleRunPayroll = (month, year) => {
    setRunToast(`🚀 Payroll run initiated for ${month} ${year}`);
    setTimeout(() => setRunToast(null), 3500);
  };

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Global run-payroll toast */}
      {runToast && (
        <div
          className="fixed top-5 right-5 z-50 bg-white border border-indigo-200 shadow-xl rounded-2xl px-5 py-3 flex items-center gap-3"
          style={{ animation: "slideUp 0.2s ease" }}
        >
          <span className="text-sm font-semibold text-slate-800">
            {runToast}
          </span>
          <button
            onClick={() => setRunToast(null)}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Page content ── */}
      <div className="max-w-screen-xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      
        <PayrollHeader onRunPayroll={handleRunPayroll} />

        
        <PayrollStats summary={liveSummary} />

        
        <PayrollTable
          employees={employees}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
};

export default PayrollPage;
