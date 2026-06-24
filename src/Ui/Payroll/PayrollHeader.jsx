import React, { useState, useEffect } from "react";
import payrollService from "../../services/payrollService";

function fmtINR(val) {
  const v = Number(val);
  if (!isFinite(v)) return "₹0.00";
  return (
    "₹" +
    v.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

const EFFECT_LABEL = {
  deduction: {
    text: "Deduction",
    bg: "#FEF2F2",
    color: "#DC2626",
    border: "#FECACA",
  },
  addition: {
    text: "Addition",
    bg: "#F0FDF4",
    color: "#16A34A",
    border: "#BBF7D0",
  },
};

const TYPE_META = {
  org_to_emp: {
    label: "Org → Employee",
    desc: "Organisation gave advance — recovering via salary deduction",
    bg: "#EFF6FF",
    color: "#1D4ED8",
  },
  emp_to_emp: {
    label: "Employee → Employee",
    desc: "Payer's salary increases; recipient's salary decreases",
    bg: "#F5F3FF",
    color: "#6D28D9",
  },
  other: {
    label: "External / Vendor",
    desc: "Org paid vendor on behalf of employee — reimbursement added to salary",
    bg: "#FFFBEB",
    color: "#B45309",
  },
};

function AdvanceEffectRow({ effect }) {
  const effectCfg = EFFECT_LABEL[effect.effect_type] || EFFECT_LABEL.deduction;
  const typeMeta = TYPE_META[effect.payment_type_key] || TYPE_META.org_to_emp;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid ${effectCfg.border}`,
        background: effectCfg.bg,
        marginBottom: 6,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 3,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 99,
              background: typeMeta.bg,
              color: typeMeta.color,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              flexShrink: 0,
              lineHeight: 1.4,
            }}
          >
            {typeMeta.label}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#64748B",
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}
          >
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
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 11,
            color: "#9CA3AF",
            lineHeight: 1.4,
          }}
        >
          {typeMeta.desc}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 80 }}>
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
            lineHeight: 1.4,
          }}
        >
          {effectCfg.text}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: effectCfg.color,
            wordBreak: "break-word",
          }}
        >
          {effect.effect_type === "deduction" ? "− " : "+ "}
          {fmtINR(effect.amount)}
        </p>
      </div>
    </div>
  );
}

export default function AdvanceEffectsPanel({ employeeId, forMonth, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const effects = data?.advanceEffects || [];
  const summary = data?.advanceSummary || {};
  const netEffect = Number(summary.netEffect || 0);

  return (
    <>
      <style>{`
        @media (max-width: 480px) {
          .aep2-card {
            border-radius: 16px 16px 0 0 !important;
            max-width: 100% !important;
            align-self: flex-end;
          }
          .aep2-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div
        className="aep2-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          padding: 16,
        }}
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div
          className="aep2-card"
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            width: "100%",
            maxWidth: 480,
            maxHeight: "min(85dvh, 85vh)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              gap: 8,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1E293B",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Advance effects
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>
                {forMonth}
              </p>
            </div>
            {/* 44×44 tap target */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 9,
                border: "1px solid #E2E8F0",
                background: "#FAFAFA",
                cursor: "pointer",
                fontSize: 14,
                color: "#94A3B8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "manipulation",
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              overflowY: "auto",
              flex: 1,
              padding: "14px 16px",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#94A3B8",
                  fontSize: 14,
                }}
              >
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
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#94A3B8",
                  fontSize: 14,
                }}
              >
                No advance effects for this month.
              </div>
            )}
            {!loading && !error && effects.length > 0 && (
              <>
                {/*
                  auto-fit grid: 3 cols when ≥360px wide, fewer on tiny phones.
                  "repeat(3,1fr)" hardcoded causes overflow on narrow screens.
                */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: 8,
                    marginBottom: 14,
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
                      value:
                        (netEffect >= 0 ? "+ " : "− ") +
                        fmtINR(Math.abs(netEffect)),
                      color: netEffect >= 0 ? "#16A34A" : "#DC2626",
                      bg: netEffect >= 0 ? "#F0FDF4" : "#FEF2F2",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: s.bg,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 10,
                          color: "#6B7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {s.label}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 13,
                          fontWeight: 700,
                          color: s.color,
                          wordBreak: "break-word",
                        }}
                      >
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
                {effects.map((e, i) => (
                  <AdvanceEffectRow key={e.deduction_id || i} effect={e} />
                ))}
              </>
            )}
          </div>

          <div
            style={{
              height: "env(safe-area-inset-bottom, 0px)",
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </>
  );
}
