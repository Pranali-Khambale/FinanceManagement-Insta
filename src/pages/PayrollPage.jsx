// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/Payroll.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from "react";
import payrollService from "../services/payrollService";
import PayrollTable from "../Ui/Payroll/PayrollTable";
import AdvanceEffectsPanel from "../Ui/Payroll/AdvanceEffectsPanel";
import PayrollHistoryModal from "../Ui/Payroll/PayrollHistoryModal";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtINR(val) {
  const v = Number(val);
  if (!isFinite(v)) return "₹0";
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function currentMonth() {
  return new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
}

// ── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color = "#1E293B", sub, subColor }) {
  return (
    <div
      style={{
        padding: "14px 18px",
        borderRadius: 12,
        background: "#FFFFFF",
        border: "1px solid #F1F5F9",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "#94A3B8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700, color }}>
        {value}
      </p>
      {sub && (
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11,
            color: subColor || "#94A3B8",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PayrollPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState({ employees: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initBusy, setInitBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Advance effects panel state
  const [advancePanel, setAdvancePanel] = useState(null); // { employeeId, forMonth }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch payroll data ──────────────────────────────────────────────────────
  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollService.getPayrollData({ month, limit: 500 });
      setData(res.data || { employees: [], summary: {} });
    } catch (err) {
      setError(err.message || "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // ── Init month ──────────────────────────────────────────────────────────────
  const handleInitMonth = async () => {
    setInitBusy(true);
    try {
      const res = await payrollService.initMonth(month);
      showToast(`✅ ${res.message || "Month initialised"}`);
      await fetchPayroll();
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setInitBusy(false);
    }
  };

  const handleBulkPay = async () => {
    const pending = (data.employees || []).filter(
      (e) => e.status === "Pending",
    );
    if (!pending.length) {
      showToast("No pending records to pay.", "error");
      return;
    }
    if (
      !window.confirm(`Mark ${pending.length} employees as Paid for ${month}?`)
    )
      return;
    setBulkBusy(true);
    try {
      // First, upsert records for any employee that doesn't have one yet
      const withoutRecord = pending.filter(e => !e.payrollRecordId);
      if (withoutRecord.length) {
        await Promise.all(
          withoutRecord.map(emp =>
            payrollService.upsertRecord({
              employee_id:              emp.id,
              for_month:                month,
              basic:                    Number(emp.basic || 0),
              hra:                      Number(emp.hra || 0),
              other_allowances:         Number(emp.organisationAllowance || 0),
              medical_allowance:        Number(emp.medicalAllowance || 0),
              performance_pay:          Number(emp.performancePay || 0),
              pf_deduction:             emp.pfDeduction != null ? Number(emp.pfDeduction) : undefined,
              employer_pf_contribution: emp.employerPfContribution != null ? Number(emp.employerPfContribution) : undefined,
              pt:                       emp.pt != null ? Number(emp.pt) : undefined,
              tds:                      Number(emp.tds || 0),
              other_deduction:          Number(emp.otherDeduction || 0),
              p_days:                   emp.pDays != null ? Number(emp.pDays) : undefined,
              month_days:               Number(emp.monthDays) || 30,
            })
          )
        );
      }

      // Re-fetch to get all fresh payrollRecordIds, then bulk pay
      await fetchPayroll();

      // After refresh, data.employees is stale in this closure — re-read from service
      const fresh = await payrollService.getPayrollData({ month, limit: 500 });
      const freshPending = (fresh.data?.employees || []).filter(e => e.status === "Pending");
      const ids = freshPending.map(e => e.payrollRecordId).filter(Boolean);

      if (!ids.length) {
        showToast("No valid payroll records found to pay.", "error");
        return;
      }

      await payrollService.markBulkPaid(ids, month);
      showToast(`💸 ${ids.length} salaries marked as paid!`);
      await fetchPayroll();
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setBulkBusy(false);
    }
  };

  const summary = data.summary || {};

  // ── Month options ─────────────────────────────────────────────────────────────
  // FIX: Generate 12 months BACK + current month + 12 months FORWARD
  // This ensures future months (e.g. May 2026, June 2026...) are always visible
  // so HR can check advance deductions that were auto-rolled to next month after
  // payroll was marked Paid.
  //
  // Range: 12 months ago → today → 12 months ahead  (total 25 options)
  // Most recent month first in the dropdown (index 0 = furthest future).
  const monthOptions = Array.from({ length: 25 }, (_, i) => {
    const d = new Date();
    // i=0 → 12 months ahead, i=12 → current month, i=24 → 12 months ago
    d.setMonth(d.getMonth() + (12 - i));
    return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
  });

  return (
    <div style={{ padding: "24px", maxWidth: 1600, margin: "0 auto" }}>
      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            background: toast.type === "error" ? "#FEF2F2" : "#FFFFFF",
            color: toast.type === "error" ? "#DC2626" : "#1E293B",
            border: `1px solid ${toast.type === "error" ? "#FECACA" : "#D1FAE5"}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#0F172A",
            }}
          >
            Payroll
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
            Manage salaries, advance effects, and disbursements
          </p>
        </div>

        {/* ── Controls ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* History button */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#475569",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F8FAFC";
              e.currentTarget.style.borderColor = "#CBD5E1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
              e.currentTarget.style.borderColor = "#E2E8F0";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            History
          </button>

          {/* Month selector */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              fontSize: 13,
              fontWeight: 600,
              color: "#1E293B",
              background: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Bulk pay */}
          <button
            onClick={handleBulkPay}
            disabled={bulkBusy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid #BBF7D0",
              background: "#F0FDF4",
              color: "#16A34A",
              fontSize: 13,
              fontWeight: 600,
              cursor: bulkBusy ? "not-allowed" : "pointer",
              opacity: bulkBusy ? 0.7 : 1,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            {bulkBusy ? "Paying…" : "Pay All Pending"}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <SummaryCard
          label="Total employees"
          value={summary.totalEmployees ?? 0}
          color="#1E293B"
        />
        <SummaryCard
          label="Pending"
          value={summary.pending ?? 0}
          color="#D97706"
          sub="Awaiting payment"
          subColor="#D97706"
        />
        <SummaryCard label="Paid" value={summary.paid ?? 0} color="#16A34A" />
        <SummaryCard
          label="Total payroll"
          value={fmtINR(summary.totalPayroll)}
          color="#1D4ED8"
        />
        <SummaryCard
          label="Advance deductions"
          value={"− " + fmtINR(summary.totalAdvanceDeductions)}
          color="#DC2626"
          sub="org→emp + emp payer"
          subColor="#DC2626"
        />
        <SummaryCard
          label="Advance additions"
          value={"+ " + fmtINR(summary.totalAdvanceAdditions)}
          color="#16A34A"
          sub="emp recipient + vendor"
          subColor="#16A34A"
        />
      </div>

      {/* ── Advance rules legend ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
          padding: "12px 16px",
          borderRadius: 10,
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
        }}
      >
        {[
          { type: "Org → Employee",      dir: "Deduction",                             color: "#DC2626", note: "Org gave advance → salary cut to recover" },
          { type: "Employee → Employee", dir: "Payer: Deduction / Recipient: Addition", color: "#7C3AED", note: "Payer lent money → cut; recipient reimbursed → boost" },
          { type: "External / Vendor",   dir: "Addition",                              color: "#16A34A", note: "Org paid vendor for employee → salary boost" },
        ].map((rule) => (
          <div key={rule.type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 99,
                background: rule.color + "15",
                color: rule.color,
              }}
            >
              {rule.type}
            </span>
            <span style={{ fontSize: 11, color: "#64748B" }}>→</span>
            <span style={{ fontSize: 11, color: "#374151" }}>{rule.dir}</span>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>({rule.note})</span>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#DC2626",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#94A3B8",
            fontSize: 14,
          }}
        >
          Loading payroll for {month}…
        </div>
      )}

      {/* ── Payroll Table ── */}
      {!loading && (
        <PayrollTable
          employees={data.employees || []}
          forMonth={month}
          onUpdateStatus={(id, status) => {
            setData((prev) => ({
              ...prev,
              employees: (prev.employees || []).map((e) =>
                e.id === id ? { ...e, status } : e,
              ),
            }));
          }}
          onUpdateEmployee={(id, updates) => {
            setData((prev) => ({
              ...prev,
              employees: (prev.employees || []).map((e) =>
                e.id === id ? { ...e, ...updates } : e,
              ),
            }));
          }}
          onRefresh={fetchPayroll}
          onViewAdvanceEffects={(employeeId) =>
            setAdvancePanel({ employeeId, forMonth: month })
          }
        />
      )}

      {/* ── Advance Effects Panel ── */}
      {advancePanel && (
        <AdvanceEffectsPanel
          employeeId={advancePanel.employeeId}
          forMonth={advancePanel.forMonth}
          onClose={() => setAdvancePanel(null)}
        />
      )}

      {/* ── Payroll History Modal ── */}
      {showHistory && (
        <PayrollHistoryModal
          employees={data.employees || []}
          onClose={() => setShowHistory(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
