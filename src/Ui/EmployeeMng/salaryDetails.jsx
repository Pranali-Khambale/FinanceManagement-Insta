import React from "react";

const SalaryDetails = ({ employee: e }) => {
  if (!e) return null;

  const basic  = parseFloat(e.basic_salary)     || 0;
  const hra    = parseFloat(e.hra)              || 0;
  const other  = parseFloat(e.other_allowances) || 0;
  const total  = basic + hra + other;

  const inr  = (v) => "₹" + Math.round(v).toLocaleString("en-IN");
  const pct  = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <div
      className="no-print"
      style={{
        width: "210mm",
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid var(--color-border-tertiary, #e2e8f0)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        marginBottom: 16,
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary, #64748b)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Salary details
        </span>
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 8,
          background: "var(--color-background-success, #f0fdf4)",
          color: "var(--color-text-success, #15803d)",
        }}>
          Confidential
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Basic salary",      val: basic,  accent: false },
          { label: "HRA",               val: hra,    accent: false },
          { label: "Other allowances",  val: other,  accent: false },
          { label: "Total CTC / month", val: total,  accent: true  },
        ].map(({ label, val, accent }) => (
          <div key={label} style={{
            background: accent
              ? "var(--color-background-info, #eff6ff)"
              : "var(--color-background-secondary, #f8fafc)",
            borderRadius: 8,
            padding: "10px 12px",
          }}>
            <div style={{ fontSize: 11, color: accent ? "#185FA5" : "var(--color-text-tertiary, #94a3b8)", marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: accent ? "#0C447C" : "var(--color-text-primary, #0f172a)" }}>
              {inr(val)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "0.5px solid var(--color-border-tertiary, #e2e8f0)", paddingTop: 12 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #94a3b8)", marginBottom: 6 }}>Composition</div>
        <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 2 }}>
          <div style={{ flex: pct(basic), background: "#378ADD" }} />
          <div style={{ flex: pct(hra),   background: "#1D9E75" }} />
          <div style={{ flex: pct(other), background: "#BA7517" }} />
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
          {[
            { label: `Basic ${pct(basic)}%`,  color: "#378ADD" },
            { label: `HRA ${pct(hra)}%`,      color: "#1D9E75" },
            { label: `Other ${pct(other)}%`,  color: "#BA7517" },
          ].map(({ label, color }) => (
            <span key={label} style={{ fontSize: 11, color: "var(--color-text-secondary, #64748b)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
          <span style={{ fontSize: 11, color: "var(--color-text-secondary, #64748b)", marginLeft: "auto" }}>
            Annual:&nbsp;
            <strong style={{ color: "var(--color-text-primary, #0f172a)", fontWeight: 500 }}>{inr(total * 12)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalaryDetails;