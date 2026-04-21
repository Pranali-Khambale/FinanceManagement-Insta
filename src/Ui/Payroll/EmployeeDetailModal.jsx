// =============================================================================
// FILE: src/Ui/Payroll/EmployeeDetailModal.jsx
//
// Fully integrated: PfPtOverrideFields merged into EmployeeDetailModal.
// Override checkboxes for PF (employee + employer) and PT in Deductions tab.
// null = auto-calc, 0 = exempt, >0 = explicit override.
// =============================================================================

import React, { useState, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#6366f1", "#8b5cf6"],
  ["#0ea5e9", "#38bdf8"],
  ["#10b981", "#34d399"],
  ["#f59e0b", "#fbbf24"],
  ["#ef4444", "#f87171"],
  ["#ec4899", "#f472b6"],
  ["#14b8a6", "#2dd4bf"],
];

function avatarGradient(name = "") {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function initials(name = "") {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

/** Safe number — returns 0 for null / undefined / NaN */
function n(v) {
  const x = Number(v);
  return isFinite(x) ? x : 0;
}

function fmt(v) {
  return "₹ " + n(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const Label = ({ children }) => (
  <label style={{
    fontSize: 11, fontWeight: 600,
    color: "var(--color-text-secondary, #64748b)",
    textTransform: "uppercase", letterSpacing: "0.04em",
  }}>
    {children}
  </label>
);

const Input = ({ label, name, value, onChange, type = "text", readOnly = false, prefix, hint }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <Label>{label}</Label>
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && (
        <span style={{
          position: "absolute", left: 10, fontSize: 13,
          color: "var(--color-text-secondary, #64748b)", pointerEvents: "none",
        }}>
          {prefix}
        </span>
      )}
      <input
        type={type}
        name={name}
        value={value ?? ""}
        readOnly={readOnly}
        onChange={e => !readOnly && onChange(name, e.target.value)}
        style={{
          width: "100%",
          border: "0.5px solid var(--color-border-tertiary, #e2e8f0)",
          borderRadius: 8,
          padding: prefix ? "7px 10px 7px 22px" : "7px 10px",
          fontSize: 13,
          color: readOnly ? "#94a3b8" : "var(--color-text-primary, #1e293b)",
          background: readOnly
            ? "var(--color-background-secondary, #f8fafc)"
            : "#fff",
          outline: "none",
          cursor: readOnly ? "not-allowed" : "text",
          boxSizing: "border-box",
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = "#6366f1"; }}
        onBlur={e => { e.target.style.borderColor = "var(--color-border-tertiary, #e2e8f0)"; }}
      />
    </div>
    {hint && <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{hint}</p>}
  </div>
);

const SectionTitle = ({ children }) => (
  <p style={{
    fontSize: 11, fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 10, marginTop: 18,
  }}>
    {children}
  </p>
);

const Grid = ({ children, cols = 2 }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
    gap: 10,
  }}>
    {children}
  </div>
);

const Divider = () => (
  <div style={{ height: "0.5px", background: "#e2e8f0", margin: "14px 0" }} />
);

// ─────────────────────────────────────────────────────────────────────────────
// PfPtOverrideFields — integrated inline (not a separate export)
// ─────────────────────────────────────────────────────────────────────────────
const PfPtOverrideFields = ({
  pfOverride, setPfOverride,
  empPf, setEmpPf,
  coEmpPf, setCoEmpPf,
  ptOverride, setPtOverride,
  ptVal, setPtVal,
  basicSalary,
}) => {
  const autoEmpPf  = Math.round((Number(basicSalary) || 0) * 0.12);
  const autoCoEmpPf = autoEmpPf;

  const checkboxStyle = {
    width: 15, height: 15, accentColor: "#1a3c6e", cursor: "pointer",
  };

  const overrideInputStyle = {
    width: "100%",
    border: "0.5px solid #e2e8f0",
    borderRadius: 8,
    padding: "7px 10px 7px 22px",
    fontSize: 13,
    color: "#1e293b",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      border: "0.5px solid #e2e8f0",
      borderRadius: 12,
      padding: 16,
      background: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700,
        color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "0.06em",
        margin: 0,
      }}>
        PF &amp; PT Overrides
        <span style={{ marginLeft: 8, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
          (leave unchecked to use auto-calculation)
        </span>
      </p>

      {/* ── PF Override ── */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            style={checkboxStyle}
            checked={pfOverride}
            onChange={e => {
              setPfOverride(e.target.checked);
              if (!e.target.checked) {
                setEmpPf("");
                setCoEmpPf("");
              } else {
                setEmpPf(String(autoEmpPf));
                setCoEmpPf(String(autoCoEmpPf));
              }
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
            Override PF amounts
          </span>
          {!pfOverride && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              (auto: Emp ₹{autoEmpPf.toLocaleString("en-IN")} + Co. ₹{autoCoEmpPf.toLocaleString("en-IN")} = ₹{(autoEmpPf * 2).toLocaleString("en-IN")} total)
            </span>
          )}
        </label>

        {pfOverride && (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Employee PF */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Employee PF (12%)
                <span style={{ marginLeft: 6, color: "#059669", fontWeight: 700, textTransform: "none" }}>
                  Set 0 to exempt
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#64748b", pointerEvents: "none" }}>₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={empPf}
                  onChange={e => setEmpPf(e.target.value)}
                  placeholder={String(autoEmpPf)}
                  style={overrideInputStyle}
                  onFocus={e => { e.target.style.borderColor = "#6366f1"; }}
                  onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
                />
              </div>
            </div>

            {/* Employer PF */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Employer PF (12%)
                <span style={{ marginLeft: 6, color: "#059669", fontWeight: 700, textTransform: "none" }}>
                  Set 0 to exempt
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#64748b", pointerEvents: "none" }}>₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={coEmpPf}
                  onChange={e => setCoEmpPf(e.target.value)}
                  placeholder={String(autoCoEmpPf)}
                  style={overrideInputStyle}
                  onFocus={e => { e.target.style.borderColor = "#6366f1"; }}
                  onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
                />
              </div>
            </div>

            {/* Exempt notice */}
            {(empPf === "0" || coEmpPf === "0") && (
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{
                  fontSize: 11,
                  background: "#ecfdf5", border: "0.5px solid #a7f3d0",
                  color: "#059669", borderRadius: 8, padding: "8px 12px", margin: 0,
                }}>
                  ✓ Setting PF to ₹0 marks this employee as PF-exempt for this month.
                  The "Exempt" badge will show in the payroll table.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PT Override ── */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            style={checkboxStyle}
            checked={ptOverride}
            onChange={e => {
              setPtOverride(e.target.checked);
              if (!e.target.checked) setPtVal("");
              else setPtVal("200");
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
            Override Professional Tax (PT)
          </span>
          {!ptOverride && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              (auto: ₹200/month, ₹300 in Feb; ₹0 for female gross ≤ ₹25K)
            </span>
          )}
        </label>

        {ptOverride && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                PT Amount
                <span style={{ marginLeft: 6, color: "#059669", fontWeight: 700, textTransform: "none" }}>
                  Set 0 to exempt
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#64748b", pointerEvents: "none" }}>₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={ptVal}
                  onChange={e => setPtVal(e.target.value)}
                  placeholder="200"
                  style={{ ...overrideInputStyle, width: "calc(50% - 5px)" }}
                  onFocus={e => { e.target.style.borderColor = "#6366f1"; }}
                  onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
                />
              </div>
              {ptVal === "0" && (
                <p style={{
                  fontSize: 11,
                  background: "#ecfdf5", border: "0.5px solid #a7f3d0",
                  color: "#059669", borderRadius: 8, padding: "8px 12px", margin: 0,
                }}>
                  ✓ PT set to ₹0 — this employee is PT-exempt for this month.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────
const TABS = ["Personal", "Salary", "Deductions", "Attendance"];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeDetailModal = ({ employee, onClose, onSave }) => {
  const [form,      setForm]      = useState({ ...employee });
  const [activeTab, setActiveTab] = useState("Personal");
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ── PF & PT override state ─────────────────────────────────────────────────
  const [pfOverride, setPfOverride] = useState(false);
  const [empPf,      setEmpPf]      = useState("");
  const [coEmpPf,    setCoEmpPf]    = useState("");
  const [ptOverride, setPtOverride] = useState(false);
  const [ptVal,      setPtVal]      = useState("");

  // ── Initialise overrides from existing employee data ───────────────────────
  useEffect(() => {
    if (employee) {
      if (employee.pfDeduction != null) {
        setPfOverride(true);
        setEmpPf(String(employee.pfDeduction));
        setCoEmpPf(String(employee.employerPfContribution ?? employee.pfDeduction));
      }
      if (employee.pt != null) {
        setPtOverride(true);
        setPtVal(String(employee.pt));
      }
    }
  }, [employee]);

  // ── Resolved PF/PT values for preview (override takes precedence) ──────────
  // When override is active, use override values; otherwise fall back to form or auto.
  const resolvedEmpPf = pfOverride && empPf !== ""
    ? Number(empPf)
    : (form.pfDeduction != null ? n(form.pfDeduction) : null);

  const resolvedCoEmpPf = pfOverride && coEmpPf !== ""
    ? Number(coEmpPf)
    : (form.employerPfContribution != null ? n(form.employerPfContribution) : null);

  const resolvedPt = ptOverride && ptVal !== ""
    ? Number(ptVal)
    : (form.pt != null ? n(form.pt) : null);

  // ── Live-computed salary preview ───────────────────────────────────────────
  const computed = useMemo(() => {
    const monthDays = n(form.monthDays) || 30;
    const pDays     = form.pDays != null ? n(form.pDays) : monthDays;
    const ratio     = monthDays > 0 ? pDays / monthDays : 1;

    const basic    = n(form.basic);
    const hra      = n(form.hra);
    const orgAllow = n(form.organisationAllowance);
    const medAllow = n(form.medicalAllowance);
    const perfPay  = n(form.performancePay);

    // Use override if active, else auto (12% of basic)
    const empPfDed = resolvedEmpPf != null ? resolvedEmpPf : Math.round(basic * 0.12);
    const coPfDed  = resolvedCoEmpPf != null ? resolvedCoEmpPf : Math.round(basic * 0.12);
    const pt       = resolvedPt != null ? resolvedPt : 200;

    const tds      = n(form.tds);
    const otherDed = n(form.otherDeduction);
    const advDed   = n(form.advanceDeduction);
    const advAdd   = n(form.advanceAddition);

    const gross    = basic + hra + orgAllow + medAllow;
    const grossD   = gross * ratio;
    const perfD    = perfPay * ratio;

    const totalDed = empPfDed + coPfDed + pt + tds + otherDed + advDed;
    const net      = grossD - totalDed + advAdd;
    const totalEarn = net + perfD;

    return {
      gross, grossD, perfD,
      empPfDed, coPfDed,
      totalPf: empPfDed + coPfDed,
      pt, totalDed, net, totalEarn, ratio,
    };
  }, [form, resolvedEmpPf, resolvedCoEmpPf, resolvedPt]);

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ── Build save payload ─────────────────────────────────────────────────────
  // null  → no override → server auto-calcs
  // 0     → explicit exempt
  // >0    → explicit amount
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...form,
        pfDeduction:            pfOverride && empPf   !== "" ? Number(empPf)   : null,
        employerPfContribution: pfOverride && coEmpPf !== "" ? Number(coEmpPf) : null,
        pt:                     ptOverride && ptVal   !== "" ? Number(ptVal)   : null,
      };
      await onSave?.(payload);
    } catch (err) {
      setSaveError(err.message || "Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Status badge colours ───────────────────────────────────────────────────
  const sc = {
    Active:   { bg: "#ecfdf5", color: "#059669", dot: "#10b981", border: "#a7f3d0" },
    Inactive: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", border: "#fca5a5" },
    Pending:  { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b", border: "#fcd34d" },
  }[form.employmentStatus] || { bg: "#ecfdf5", color: "#059669", dot: "#10b981", border: "#a7f3d0" };

  // ── Deductions tab summary values (use resolved overrides) ─────────────────
  const summaryEmpPf  = resolvedEmpPf  != null ? resolvedEmpPf  : computed.empPfDed;
  const summaryCoEmpPf = resolvedCoEmpPf != null ? resolvedCoEmpPf : computed.coPfDed;
  const summaryPt     = resolvedPt     != null ? resolvedPt     : computed.pt;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 760,
        border: "0.5px solid #e2e8f0", overflow: "hidden",
        display: "flex", flexDirection: "column", maxHeight: "92vh",
      }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "#1a3c6e", padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 500, margin: 0 }}>
              Employee Details
            </h2>
            <p style={{ color: "#93c5fd", fontSize: 12, marginTop: 2 }}>
              Edit and save salary, deductions &amp; attendance
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(255,255,255,0.18)", border: "none",
            color: "#fff", cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            ✕
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", borderBottom: "0.5px solid #e2e8f0",
          padding: "0 20px", flexShrink: 0, overflowX: "auto",
        }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 16px", fontSize: 13, fontWeight: 500,
              color: activeTab === tab ? "#1a3c6e" : "#94a3b8",
              borderBottom: activeTab === tab
                ? "2px solid #1a3c6e"
                : "2px solid transparent",
              background: "none", border: "none", cursor: "pointer",
              whiteSpace: "nowrap", transition: "color 0.15s",
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>

          {/* Avatar row — always shown */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: avatarGradient(form.name),
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 600, fontSize: 17, flexShrink: 0,
            }}>
              {initials(form.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#1e293b", margin: 0 }}>
                {form.name || "—"}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {form.employeeId} · {form.designation || "—"} · {form.department || "—"}
              </p>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: sc.bg, color: sc.color,
                border: `0.5px solid ${sc.border}`, marginTop: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />
                {form.employmentStatus || "Active"}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>For Month</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", marginTop: 2 }}>
                {form.forMonth || "—"}
              </p>
              {n(form.advancePendingCount) > 0 && (
                <span style={{
                  display: "inline-block", marginTop: 4, padding: "2px 8px",
                  borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "#fffbeb", color: "#d97706",
                  border: "0.5px solid #fcd34d",
                }}>
                  {form.advancePendingCount} advance pending
                </span>
              )}
            </div>
          </div>

          <Divider />

          {/* ══ TAB: Personal ════════════════════════════════════════════════ */}
          {activeTab === "Personal" && (
            <>
              <SectionTitle>Personal Info</SectionTitle>
              <Grid>
                <Input label="Full Name"        name="name"            value={form.name}            onChange={handleChange} />
                <Input label="Employee ID"      name="employeeId"      value={form.employeeId}      onChange={handleChange} readOnly hint="Auto-assigned — cannot be changed" />
                <Input label="Designation"      name="designation"     value={form.designation}     onChange={handleChange} />
                <Input label="Department"       name="department"      value={form.department}      onChange={handleChange} />
                <Input label="Joining Date"     name="joiningDate"     value={form.joiningDate}     onChange={handleChange} type="date" />
                <Input label="Current Location" name="currentLocation" value={form.currentLocation} onChange={handleChange} />
                <Input label="Employment Type"  name="employmentType"  value={form.employmentType}  onChange={handleChange} />
                <Input label="Project"          name="project"         value={form.project}         onChange={handleChange} />
              </Grid>

              <SectionTitle>Bank Details</SectionTitle>
              <Grid>
                <Input label="Bank Name"   name="bankName"      value={form.bankName}                             onChange={handleChange} />
                <Input label="A/C Number"  name="accountNumber" value={form.accountNumber || form.bankAccountNo}  onChange={handleChange} />
                <Input label="IFSC Code"   name="ifscCode"      value={form.ifscCode}                             onChange={handleChange} />
                <Input label="Bank Branch" name="bankBranch"    value={form.bankBranch}                           onChange={handleChange} />
              </Grid>

              <SectionTitle>Statutory Info</SectionTitle>
              <Grid>
                <Input label="PAN No"    name="panNo"    value={form.panNo}    onChange={handleChange} />
                <Input label="Aadhar No" name="aadharNo" value={form.aadharNo} onChange={handleChange} />
                <Input label="EPF No"    name="epfNo"    value={form.epfNo}    onChange={handleChange} />
                <Input label="ESIC No"   name="esicNo"   value={form.esicNo}   onChange={handleChange} />
                <Input label="UAN No"    name="uanNo"    value={form.uanNo}    onChange={handleChange} />
              </Grid>
            </>
          )}

          {/* ══ TAB: Salary ══════════════════════════════════════════════════ */}
          {activeTab === "Salary" && (
            <>
              <SectionTitle>Earnings</SectionTitle>
              <Grid>
                <Input label="Basic Salary"           name="basic"                 value={form.basic}                 onChange={handleChange} type="number" prefix="₹" />
                <Input label="HRA"                    name="hra"                   value={form.hra}                   onChange={handleChange} type="number" prefix="₹" />
                <Input label="Organisation Allowance" name="organisationAllowance" value={form.organisationAllowance} onChange={handleChange} type="number" prefix="₹" />
                <Input label="Medical Allowance"      name="medicalAllowance"      value={form.medicalAllowance}      onChange={handleChange} type="number" prefix="₹" />
                <Input label="Performance Pay"        name="performancePay"        value={form.performancePay}        onChange={handleChange} type="number" prefix="₹" />
              </Grid>

              <SectionTitle>Live Preview (updates as you type)</SectionTitle>
              <div style={{
                background: "#f8fafc", borderRadius: 10, padding: 14,
                border: "0.5px solid #e2e8f0",
              }}>
                {[
                  ["Gross Salary (full month)",            computed.gross,      "#1a3c6e"],
                  ["Gross Salary (prorated)",              computed.grossD,     "#1a3c6e"],
                  ["PF — Employee (12%)",                  computed.empPfDed,   "#dc2626"],
                  ["PF — Employer (12%, also deducted)",   computed.coPfDed,    "#dc2626"],
                  ["Total PF (24%)",                       computed.totalPf,    "#b91c1c"],
                  ["Total Deductions",                     computed.totalDed,   "#dc2626"],
                  ["Net Salary",                           computed.net,        "#059669"],
                  ["Total with Perf Pay",                  computed.totalEarn,  "#1e293b"],
                ].map(([label, val, color], i, arr) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "7px 0",
                    borderBottom: i < arr.length - 1 ? "0.5px solid #e2e8f0" : "none",
                    background: label.includes("Total PF") ? "#fef2f2" : "transparent",
                    marginLeft: label.includes("Total PF") ? -6 : 0,
                    marginRight: label.includes("Total PF") ? -6 : 0,
                    paddingLeft: label.includes("Total PF") ? 6 : 0,
                    paddingRight: label.includes("Total PF") ? 6 : 0,
                    borderRadius: label.includes("Total PF") ? 6 : 0,
                  }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{fmt(val)}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 10, padding: "10px 12px", borderRadius: 8,
                background: "#fef2f2", border: "0.5px solid #fca5a5",
              }}>
                <p style={{ fontSize: 11, color: "#b91c1c", margin: 0 }}>
                  <strong>PF rule:</strong> Both employee share (12%) and employer share (12%) are
                  deducted from the employee's net salary — 24% of basic total.
                  You can override either value in the Deductions tab.
                </p>
              </div>
            </>
          )}

          {/* ══ TAB: Deductions ══════════════════════════════════════════════ */}
          {activeTab === "Deductions" && (
            <>
              <SectionTitle>PF &amp; PT Overrides</SectionTitle>

              {/* ── Integrated PfPtOverrideFields ── */}
              <PfPtOverrideFields
                pfOverride={pfOverride}   setPfOverride={setPfOverride}
                empPf={empPf}             setEmpPf={setEmpPf}
                coEmpPf={coEmpPf}         setCoEmpPf={setCoEmpPf}
                ptOverride={ptOverride}   setPtOverride={setPtOverride}
                ptVal={ptVal}             setPtVal={setPtVal}
                basicSalary={form.basic}
              />

              {/* Combined PF preview (only shown when override is active) */}
              {pfOverride && (
                <div style={{
                  marginTop: 10, padding: "10px 12px", borderRadius: 8,
                  background: "#fef2f2", border: "0.5px solid #fca5a5",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
                    Total PF deducted (combined)
                  </span>
                  <span style={{ fontSize: 14, color: "#b91c1c", fontWeight: 700 }}>
                    {fmt((empPf !== "" ? Number(empPf) : 0) + (coEmpPf !== "" ? Number(coEmpPf) : 0))}
                  </span>
                </div>
              )}

              <SectionTitle>Other Deductions</SectionTitle>
              <Grid>
                <Input
                  label="TDS"
                  name="tds"
                  value={form.tds}
                  onChange={handleChange}
                  type="number"
                  prefix="₹"
                />
                <Input
                  label="Other Deductions"
                  name="otherDeduction"
                  value={form.otherDeduction}
                  onChange={handleChange}
                  type="number"
                  prefix="₹"
                />
              </Grid>

              <SectionTitle>Advance Payment Effects (auto-calculated)</SectionTitle>
              <div style={{
                background: "#f8fafc", borderRadius: 10, padding: 14,
                border: "0.5px solid #e2e8f0", marginBottom: 12,
              }}>
                <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                  These values are calculated automatically from approved advance payment
                  requests. They cannot be edited here.
                </p>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "7px 0", borderBottom: "0.5px solid #e2e8f0",
                }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Advance Deduction (recovery)</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
                    {n(form.advanceDeduction) > 0 ? `- ${fmt(form.advanceDeduction)}` : "₹ 0.00"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Advance Addition</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
                    {n(form.advanceAddition) > 0 ? `+ ${fmt(form.advanceAddition)}` : "₹ 0.00"}
                  </span>
                </div>
              </div>

              <SectionTitle>Total Summary</SectionTitle>
              <div style={{
                background: "#fef2f2", borderRadius: 10, padding: 14,
                border: "0.5px solid #fca5a5",
              }}>
                {[
                  ["PF — Employee (12%)",  summaryEmpPf],
                  ["PF — Employer (12%)",  summaryCoEmpPf],
                  ["Professional Tax",      summaryPt],
                  ["TDS",                   n(form.tds)],
                  ["Other Deductions",      n(form.otherDeduction)],
                  ["Advance Deduction",     n(form.advanceDeduction)],
                  ["Advance Addition",     -n(form.advanceAddition)],
                ].map(([label, val], i, arr) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: i < arr.length - 1 ? "0.5px solid #fca5a5" : "none",
                    background: label.includes("Employer") || label.includes("Employee")
                      ? "rgba(185,28,28,0.04)" : "transparent",
                  }}>
                    <span style={{ fontSize: 13, color: "#991b1b" }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#991b1b" }}>{fmt(Math.abs(val))}</span>
                  </div>
                ))}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  paddingTop: 10, borderTop: "1px solid #fca5a5", marginTop: 4,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
                    Net Total Deduction
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>
                    {fmt(computed.totalDed)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ══ TAB: Attendance ══════════════════════════════════════════════ */}
          {activeTab === "Attendance" && (
            <>
              <SectionTitle>Attendance</SectionTitle>
              <Grid cols={3}>
                <Input
                  label="Present Days (P Days)"
                  name="pDays"
                  value={form.pDays}
                  onChange={handleChange}
                  type="number"
                  hint={`Max: ${n(form.monthDays) || 30}`}
                />
                <Input
                  label="Absent Days (A Days)"
                  name="aDays"
                  value={form.aDays}
                  onChange={handleChange}
                  type="number"
                />
                <Input
                  label="Total Month Days"
                  name="monthDays"
                  value={form.monthDays}
                  onChange={handleChange}
                  type="number"
                />
              </Grid>

              <SectionTitle>Attendance Ratio</SectionTitle>
              <div style={{
                background: "#f8fafc", borderRadius: 10, padding: 14,
                border: "0.5px solid #e2e8f0",
              }}>
                {(() => {
                  const p   = n(form.pDays);
                  const m   = n(form.monthDays) || 30;
                  const pct = m > 0 ? ((p / m) * 100).toFixed(1) : "0.0";
                  const barW = m > 0 ? Math.min((p / m) * 100, 100) : 0;
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: "#64748b" }}>
                          {p} of {m} days present
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a3c6e" }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{
                        height: 8, background: "#e2e8f0",
                        borderRadius: 8, overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%", width: `${barW}%`,
                          background: "#1a3c6e", borderRadius: 8,
                          transition: "width 0.4s",
                        }} />
                      </div>
                      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                        Absent: {n(form.aDays)} days · This ratio is applied to gross salary when computing net.
                      </p>
                    </>
                  );
                })()}
              </div>

              <SectionTitle>Salary Impact Preview</SectionTitle>
              <div style={{
                background: "#f8fafc", borderRadius: 10, padding: 14,
                border: "0.5px solid #e2e8f0",
              }}>
                {[
                  ["Gross (full month)", computed.gross,    "#64748b"],
                  ["Gross (earned)",     computed.grossD,   "#1a3c6e"],
                  ["Total Deductions",   computed.totalDed, "#dc2626"],
                  ["Net Salary",         computed.net,      "#059669"],
                ].map(([label, val, color]) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", padding: "5px 0",
                  }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{fmt(val)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "14px 20px",
          borderTop: "0.5px solid #e2e8f0",
          display: "flex", flexDirection: "column", gap: 8, flexShrink: 0,
        }}>
          {saveError && (
            <div style={{
              padding: "8px 12px", borderRadius: 8,
              background: "#fef2f2", border: "0.5px solid #fca5a5",
              fontSize: 12, color: "#dc2626",
            }}>
              {saveError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} style={{
              padding: "8px 18px", borderRadius: 8,
              border: "0.5px solid #e2e8f0", background: "#f8fafc",
              color: "#64748b", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: saving ? "#93a9c9" : "#1a3c6e",
                color: "#fff", fontSize: 13, fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {saving ? (
                <>
                  <svg
                    style={{ width: 14, height: 14, animation: "spin 0.8s linear infinite" }}
                    fill="none" viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"
                      style={{ opacity: 0.25 }} />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8z"
                      style={{ opacity: 0.75 }} />
                  </svg>
                  Saving…
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetailModal;