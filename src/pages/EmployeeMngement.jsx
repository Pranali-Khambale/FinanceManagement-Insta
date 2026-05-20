import React, { useState, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import EmployeeDashboard from "../Ui/EmployeeMng/DashboardEmp";
import PendingApprovals from "../Ui/EmployeeMng/PendingApprovals";
import { SubmittedDocsPanel } from "../Ui/EmployeeMng/SubmittedDocsPanel";

// ─── Inline Toast (no extra dependency needed) ────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const colors = {
    success: { bg: "#f0fdf4", border: "#86efac", text: "#15803d" },
    error:   { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" },
    info:    { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
  };
  const c = colors[type] || colors.info;
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: 12,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        maxWidth: 380,
        animation: "slideIn .25s ease",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: c.text,
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
          marginLeft: 4,
        }}
      >
        ×
      </button>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

// ─── Main Routes Component ────────────────────────────────────────────────────
const EmployeeRoutes = () => {
  // ── Toast state shared across all child pages ──────────────────────────────
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    // auto-dismiss after 4 seconds
    setTimeout(() => setToast(null), 4000);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  // ── Callback when an employee is approved (refresh dashboard counts etc.) ──
  const handleEmployeeApproved = useCallback(() => {
    // You can add any global refresh logic here if needed
    // e.g. invalidate a cached employee count badge
  }, []);

  return (
    <>
      {/* ── Toast notification — renders on top of everything ── */}
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={hideToast}
      />

      <Routes>
        {/* ── Employee Management Dashboard ────────────────────── */}
        <Route
          path="management"
          element={<EmployeeDashboard showToast={showToast} />}
        />

        {/* ── Pending Approvals (new registrations) ────────────── */}
        <Route
          path="pending"
          element={
            <PendingApprovals
              showToast={showToast}
              onEmployeeApproved={handleEmployeeApproved}
            />
          }
        />

        {/* ── NEW: /employee/pending-approvals ─────────────────────
            emailService.js links HR to /pending-approvals
            This route handles that URL so the link works correctly
        ──────────────────────────────────────────────────────── */}
        <Route
          path="pending-approvals"
          element={
            <PendingApprovals
              showToast={showToast}
              onEmployeeApproved={handleEmployeeApproved}
            />
          }
        />

        {/* ── Legacy route for backward compatibility ───────────── */}
        <Route
          path="dashboard"
          element={<EmployeeDashboard showToast={showToast} />}
        />

        {/* ── Default redirect ──────────────────────────────────── */}
        <Route path="/" element={<Navigate to="management" replace />} />

        {/* ── Coming Soon Pages ─────────────────────────────────── */}
        <Route
          path="payments"
          element={
            <div className="p-8 text-center">
              <div className="bg-white rounded-2xl border border-gray-200 p-16 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Payments</h2>
                <p className="text-gray-500">Coming Soon</p>
              </div>
            </div>
          }
        />

        <Route
          path="payroll"
          element={
            <div className="p-8 text-center">
              <div className="bg-white rounded-2xl border border-gray-200 p-16 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payroll</h2>
                <p className="text-gray-500">Coming Soon</p>
              </div>
            </div>
          }
        />

        <Route
          path="reports"
          element={
            <div className="p-8 text-center">
              <div className="bg-white rounded-2xl border border-gray-200 p-16 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports</h2>
                <p className="text-gray-500">Coming Soon</p>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
};

export default EmployeeRoutes;