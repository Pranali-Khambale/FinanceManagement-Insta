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
  org_to_emp: { label: "Org → Employee", bg: "#EFF6FF", color: "#1D4ED8" },
  emp_to_emp: { label: "Employee → Employee", bg: "#F5F3FF", color: "#6D28D9" },
  other: { label: "External / Vendor", bg: "#FFFBEB", color: "#B45309" },
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
        gap: 12,
        padding: "10px 14px",
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
            gap: 6,
            marginBottom: 3,
            flexWrap: "wrap",
          }}
        >
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
          <span
            style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}
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
      </div>
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
    <div
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
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          // 88dvh uses dynamic viewport height; falls back to vh
          maxHeight: "min(88dvh, 88vh)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "#1E293B",
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
            style={{
              width: 44,
              height: 44,
              margin: "-8px -8px -8px 0",
              borderRadius: 9,
              border: "1px solid #E2E8F0",
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

        {/* ── Body ── */}
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
                Summary grid:
                - "repeat(auto-fit, minmax(120px, 1fr))" wraps gracefully on
                  narrow phones — 3 columns when wide enough, 1–2 when not.
              */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
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
                        fontSize: 14,
                        fontWeight: 700,
                        color: s.color,
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

        {/* ── Footer safe-area padding ── */}
        <div
          style={{ height: "env(safe-area-inset-bottom, 0px)", flexShrink: 0 }}
        />
      </div>
    </div>
  );
}
