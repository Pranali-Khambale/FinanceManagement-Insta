// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/Payroll/AdvanceEffectsPanel.jsx
//
// Shows the advance payment breakdown for a single employee in the payroll table.
//
// RULES (mirrors payrollController.js logic exactly):
//   org_to_emp  → DEDUCTION  for primary employee (org gave money → recover via salary)
//   emp_to_emp  → ADDITION   for payer   (they gave their own money → compensate via salary)
//               → DEDUCTION  for recipient (they received money → recover via salary)
//   other       → ADDITION   for primary employee (org paid vendor on their behalf → reimbursement)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import payrollService from "../../services/payrollService";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtINR(val) {
  const v = Number(val);
  if (!isFinite(v)) return "₹0.00";
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const EFFECT_LABEL = {
  deduction: { text: "Deduction", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  addition:  { text: "Addition",  bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
};

const TYPE_META = {
  org_to_emp: {
    label: "Org → Employee",
    desc:  "Organisation gave advance — recovering via salary deduction",
    bg:    "#EFF6FF",
    color: "#1D4ED8",
  },
  emp_to_emp: {
    label: "Employee → Employee",
    desc:  "Payer's salary increases; recipient's salary decreases",
    bg:    "#F5F3FF",
    color: "#6D28D9",
  },
  other: {
    label: "External / Vendor",
    desc:  "Org paid vendor on behalf of employee — reimbursement added to salary",
    bg:    "#FFFBEB",
    color: "#B45309",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AdvanceEffectRow — one advance request's effect on this employee
// ─────────────────────────────────────────────────────────────────────────────
function AdvanceEffectRow({ effect }) {
  const effectCfg = EFFECT_LABEL[effect.effect_type] || EFFECT_LABEL.deduction;
  const typeMeta  = TYPE_META[effect.payment_type_key] || TYPE_META.org_to_emp;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid ${effectCfg.border}`,
        background: effectCfg.bg,
        marginBottom: 6,
      }}
    >
      {/* Left — type + reason */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          {/* Type pill */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 99,
              background: typeMeta.bg,
              color: typeMeta.color,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {typeMeta.label}
          </span>
          {/* Request code */}
          <span style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>
            {effect.request_code}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#374151",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={effect.reason}
        >
          {effect.reason || "—"}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>
          {typeMeta.desc}
        </p>
      </div>

      {/* Right — effect badge + amount */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 99,
            background: effectCfg.bg,
            color: effectCfg.color,
            border: `1px solid ${effectCfg.border}`,
            marginBottom: 3,
          }}
        >
          {effectCfg.text}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: effectCfg.color,
          }}
        >
          {effect.effect_type === "deduction" ? "− " : "+ "}
          {fmtINR(effect.amount)}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdvanceEffectsPanel — full breakdown panel for one employee
// ─────────────────────────────────────────────────────────────────────────────
export default function AdvanceEffectsPanel({ employeeId, forMonth, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!employeeId || !forMonth) return;
    setLoading(true);
    setError(null);
    payrollService
      .getEmployeePayroll(employeeId, forMonth)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load advance details");
        setLoading(false);
      });
  }, [employeeId, forMonth]);

  const effects   = data?.advanceEffects  || [];
  const summary   = data?.advanceSummary  || {};
  const netEffect = Number(summary.netEffect || 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(2px)",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1E293B" }}>
              Advance effects
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>
              {forMonth}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              border: "1px solid #E2E8F0",
              borderRadius: 7,
              background: "#FAFAFA",
              cursor: "pointer",
              fontSize: 14,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 14 }}>
              Loading…
            </div>
          )}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "#FEF2F2",
                color: "#DC2626",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          {!loading && !error && effects.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 14 }}>
              No advance effects for this month.
            </div>
          )}
          {!loading && !error && effects.length > 0 && (
            <>
              {/* Summary strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {[
                  {
                    label: "Total deductions",
                    value: fmtINR(summary.totalDeduction),
                    color: "#DC2626",
                    bg: "#FEF2F2",
                  },
                  {
                    label: "Total additions",
                    value: fmtINR(summary.totalAddition),
                    color: "#16A34A",
                    bg: "#F0FDF4",
                  },
                  {
                    label: "Net effect",
                    value: (netEffect >= 0 ? "+ " : "− ") + fmtINR(Math.abs(netEffect)),
                    color: netEffect >= 0 ? "#16A34A" : "#DC2626",
                    bg: netEffect >= 0 ? "#F0FDF4" : "#FEF2F2",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: s.bg,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {s.label}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: s.color }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Effect rows */}
              {effects.map((e, i) => (
                <AdvanceEffectRow key={e.deduction_id || i} effect={e} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}