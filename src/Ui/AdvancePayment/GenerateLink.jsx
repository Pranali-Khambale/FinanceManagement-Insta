// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/GenerateLinkModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  X, Link2, Mail, Send, Copy, RefreshCw,
  ExternalLink, CheckCircle2, AlertCircle,
  ArrowRight, Upload, Plus, Building2, Users, Globe,
  Image, FileText,
} from "lucide-react";
import { PAYMENT_TYPES } from "../../data/content";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function generateToken() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function buildLink(token, ptKey) {
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "https://app.example.com/";
  return `${base}#/advance-request/${ptKey}/${token}`;
}

const PT_ORDER = ["emp_to_emp", "other"];

const PT_META = {
  org_to_emp: {
    icon: Building2,
    short: "Org → Emp",
    tagline: "Company disburses funds directly to an employee",
    accent: "#6366f1",
    soft: "#eef2ff",
    text: "#4338ca",
  },
  emp_to_emp: {
    icon: Users,
    short: "Emp → Emp",
    tagline: "One employee transfers an advance to another",
    accent: "#0ea5e9",
    soft: "#e0f2fe",
    text: "#0369a1",
  },
  other: {
    icon: Globe,
    short: "External",
    tagline: "Advance to an external vendor or third party",
    accent: "#10b981",
    soft: "#d1fae5",
    text: "#065f46",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared form primitives
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: "#64748b",
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {label}{required && <span style={{ color: "#f43f5e", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#ef4444" }}>
          <AlertCircle size={11} /> {error}
        </span>
      )}
    </div>
  );
}

function StyledInput({ error, style = {}, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%", boxSizing: "border-box",
        padding: "9px 12px", fontSize: 13,
        border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
        borderRadius: 10, outline: "none",
        background: error ? "#fff5f5" : "#fff",
        color: "#1e293b",
        transition: "border-color 0.15s",
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = error ? "#f87171" : "#6366f1";
        e.target.style.boxShadow = `0 0 0 3px ${error ? "#fee2e222" : "#6366f120"}`;
      }}
      onBlur={e => {
        e.target.style.borderColor = error ? "#fca5a5" : "#e2e8f0";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

function StyledTextarea({ error, ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%", boxSizing: "border-box",
        padding: "9px 12px", fontSize: 13,
        border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
        borderRadius: 10, outline: "none", resize: "vertical",
        background: error ? "#fff5f5" : "#fff",
        color: "#1e293b", fontFamily: "inherit",
        transition: "border-color 0.15s",
        minHeight: 80,
      }}
      onFocus={e => {
        e.target.style.borderColor = "#6366f1";
        e.target.style.boxShadow = "0 0 0 3px #6366f120";
      }}
      onBlur={e => {
        e.target.style.borderColor = error ? "#fca5a5" : "#e2e8f0";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

function SectionDivider({ label, color, textColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "3px 10px",
        borderRadius: 20, background: color, color: textColor,
        letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4,
      }}>
        <ArrowRight size={9} /> {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared style constants
// ─────────────────────────────────────────────────────────────────────────────
const overlay = {
  position: "fixed", inset: 0, zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(15,23,42,0.55)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  padding: 16,
};

const card = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 24px 64px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08)",
  width: "100%",
  overflow: "hidden",
};

const sectionLabel = {
  fontSize: 10, fontWeight: 700, color: "#94a3b8",
  textTransform: "uppercase", letterSpacing: "0.08em",
  margin: 0, marginBottom: 10,
};

const grid2 = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
};

const iconBtn = {
  width: 30, height: 30, borderRadius: 8, border: "none",
  background: "transparent", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
};

const makeBtn = accent => ({
  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
  padding: "11px 20px", borderRadius: 11, border: "none",
  background: accent, color: "#fff", fontSize: 13, fontWeight: 700,
  cursor: "pointer", transition: "opacity 0.15s", letterSpacing: "0.01em",
});

const outlineBtn = {
  padding: "11px 18px", borderRadius: 11,
  border: "1.5px solid #e2e8f0", background: "#fff",
  color: "#475569", fontSize: 13, fontWeight: 600,
  cursor: "pointer", transition: "background 0.15s",
};

const chipIndigo = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "6px 12px", borderRadius: 8, border: "none",
  background: "#eef2ff", color: "#4338ca",
  fontSize: 12, fontWeight: 600, cursor: "pointer",
};

const chipSuccess = {
  ...chipIndigo,
  background: "#dcfce7", color: "#15803d",
};

const chipDark = {
  ...chipIndigo,
  background: "#1e293b", color: "#f1f5f9",
};

// ─────────────────────────────────────────────────────────────────────────────
// AdvanceRequestForm  (shown when the link is "opened")
//
// CHANGES vs original:
//   1. Header → white glass blur effect (backdropFilter)
//   2. "Attachments" section added at the bottom of the scrollable body:
//        • Transaction Screenshot  — REQUIRED (blocks submit if missing)
//        • Payment Receipt         — OPTIONAL
//   3. validate() includes screenshot check
//   4. onSubmit payload now includes `screenshot` and `receipt` fields
// ─────────────────────────────────────────────────────────────────────────────
function AdvanceRequestForm({ ptKey, token, onClose, onSubmit }) {
  const meta = PT_META[ptKey];

  const [form, setForm] = useState({
    empId: "", name: "", dept: "", amount: "", reason: "",
    toEmpId: "", toEmpName: "", toEmpDept: "",
    vendorName: "", vendorRef: "",
  });

  // ── NEW state ──────────────────────────────────────────────────────────────
  const [screenshotName, setScreenshotName] = useState("");
  const [receiptName,    setReceiptName]    = useState("");
  // ──────────────────────────────────────────────────────────────────────────

  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const er = {};
    if (!form.empId)                        er.empId      = "Required";
    if (!form.name)                         er.name       = "Required";
    if (!form.dept)                         er.dept       = "Required";
    if (!form.amount || isNaN(form.amount)) er.amount     = "Valid amount required";
    if (!form.reason)                       er.reason     = "Required";
    // ── NEW ──────────────────────────────────────────────────────────────────
    if (!screenshotName)                    er.screenshot = "Transaction screenshot is required";
    // ─────────────────────────────────────────────────────────────────────────
    if (ptKey === "emp_to_emp") {
      if (!form.toEmpId)   er.toEmpId   = "Required";
      if (!form.toEmpName) er.toEmpName = "Required";
    }
    if (ptKey === "other") {
      if (!form.vendorName) er.vendorName = "Required";
    }
    return er;
  };

  const handleSubmit = () => {
    const er = validate();
    if (Object.keys(er).length) { setErrors(er); return; }
    onSubmit?.({
      ...form,
      screenshot: screenshotName || null,  // NEW
      receipt:    receiptName    || null,  // NEW
      id: "ADV-" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      status: "pending", paymentType: ptKey, token,
    });
    setSubmitted(true);
  };

  // Success screen — unchanged
  if (submitted) {
    return (
      <div style={overlay}>
        <div style={{
          ...card, maxWidth: 400, padding: "48px 32px",
          textAlign: "center", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 16,
        }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={30} color="#16a34a" />
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Request Submitted!</p>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>Your advance request is pending admin approval.</p>
          </div>
          <button onClick={onClose} style={{ ...makeBtn(meta.accent), marginTop: 8, padding: "10px 28px" }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay}>
      <div style={{ ...card, maxWidth: 560, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* ── CHANGED: Header with white glass blur ────────────────────── */}
        <div style={{
          padding: "20px 24px",
          background: ptKey === "emp_to_emp"
            ? "rgba(14,165,233,0.80)"
            : ptKey === "other"
              ? "rgba(16,185,129,0.80)"
              : "rgba(99,102,241,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.20)",
          borderRadius: "16px 16px 0 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plus size={18} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>Advance Request Form</p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>
                {meta.short}&nbsp;·&nbsp;Token:&nbsp;
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{token}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ ...iconBtn, background: "rgba(255,255,255,0.14)" }}>
            <X size={16} color="rgba(255,255,255,0.85)" />
          </button>
        </div>
        {/* ─────────────────────────────────────────────────────────────── */}

        {/* Type badge strip — unchanged */}
        <div style={{ padding: "10px 24px", background: meta.soft, borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
            <strong style={{ color: meta.text }}>{meta.short}</strong> — {meta.tagline}
          </p>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Requester — unchanged */}
          <div>
            <p style={sectionLabel}>{ptKey === "emp_to_emp" ? "Requesting Employee" : "Employee Details"}</p>
            <div style={grid2}>
              <Field label="Employee ID" required error={errors.empId}>
                <StyledInput placeholder="EMP001" value={form.empId} onChange={set("empId")} error={errors.empId} />
              </Field>
              <Field label="Full Name" required error={errors.name}>
                <StyledInput placeholder="John Doe" value={form.name} onChange={set("name")} error={errors.name} />
              </Field>
              <Field label="Department" required error={errors.dept}>
                <StyledInput placeholder="Engineering" value={form.dept} onChange={set("dept")} error={errors.dept} />
              </Field>
              <Field label="Amount (₹)" required error={errors.amount}>
                <StyledInput type="number" placeholder="10,000" value={form.amount} onChange={set("amount")} error={errors.amount} />
              </Field>
            </div>
          </div>

          {/* emp_to_emp recipient — unchanged */}
          {ptKey === "emp_to_emp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionDivider label="Recipient Employee" color={meta.soft} textColor={meta.text} />
              <div style={grid2}>
                <Field label="Recipient Employee ID" required error={errors.toEmpId}>
                  <StyledInput placeholder="EMP002" value={form.toEmpId} onChange={set("toEmpId")} error={errors.toEmpId} />
                </Field>
                <Field label="Recipient Name" required error={errors.toEmpName}>
                  <StyledInput placeholder="Jane Smith" value={form.toEmpName} onChange={set("toEmpName")} error={errors.toEmpName} />
                </Field>
                <Field label="Recipient Department" error={errors.toEmpDept} style={{ gridColumn: "span 2" }}>
                  <StyledInput placeholder="Design" value={form.toEmpDept} onChange={set("toEmpDept")} error={errors.toEmpDept} />
                </Field>
              </div>
            </div>
          )}

          {/* other / vendor — unchanged */}
          {ptKey === "other" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionDivider label="Vendor / External Details" color={meta.soft} textColor={meta.text} />
              <div style={grid2}>
                <Field label="Vendor / Party Name" required error={errors.vendorName}>
                  <StyledInput placeholder="LexPro LLP" value={form.vendorName} onChange={set("vendorName")} error={errors.vendorName} />
                </Field>
                <Field label="Reference / Invoice No." error={errors.vendorRef}>
                  <StyledInput placeholder="INV-001" value={form.vendorRef} onChange={set("vendorRef")} error={errors.vendorRef} />
                </Field>
              </div>
            </div>
          )}

          {/* Reason — unchanged */}
          <Field label="Reason for Advance" required error={errors.reason}>
            <StyledTextarea
              rows={3}
              placeholder="Describe the reason for this advance request…"
              value={form.reason}
              onChange={set("reason")}
              error={errors.reason}
            />
          </Field>

          {/* ── NEW: Attachments ──────────────────────────────────────────── */}
          <div>
            <p style={sectionLabel}>Attachments</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

              {/* Transaction Screenshot — MANDATORY */}
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                border: `1.5px dashed ${
                  screenshotName ? meta.accent
                  : errors.screenshot ? "#fca5a5"
                  : "#cbd5e1"
                }`,
                borderRadius: 12, padding: "16px 12px", cursor: "pointer",
                background: screenshotName ? meta.soft : errors.screenshot ? "#fff5f5" : "#fafafa",
                transition: "all 0.15s", textAlign: "center",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: screenshotName
                    ? `${meta.accent}22`
                    : errors.screenshot ? "#fee2e2" : "#f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {screenshotName
                    ? <CheckCircle2 size={16} color={meta.accent} />
                    : <Image size={16} color={errors.screenshot ? "#ef4444" : "#94a3b8"} />
                  }
                </div>

                {screenshotName ? (
                  <>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: meta.accent, wordBreak: "break-all" }}>
                      {screenshotName.length > 22 ? screenshotName.slice(0, 20) + "…" : screenshotName}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Screenshot attached ✓</p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: errors.screenshot ? "#ef4444" : "#475569" }}>
                      Transaction Screenshot
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>PNG, JPG</p>
                  </>
                )}

                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: "#fee2e2", color: "#b91c1c", letterSpacing: "0.04em",
                }}>
                  REQUIRED
                </span>

                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={e => {
                    if (e.target.files[0]) {
                      setScreenshotName(e.target.files[0].name);
                      setErrors(er => ({ ...er, screenshot: "" }));
                    }
                  }}
                  style={{ display: "none" }}
                />
              </label>

              {/* Payment Receipt — OPTIONAL */}
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                border: `1.5px dashed ${receiptName ? "#10b981" : "#cbd5e1"}`,
                borderRadius: 12, padding: "16px 12px", cursor: "pointer",
                background: receiptName ? "#d1fae5" : "#fafafa",
                transition: "all 0.15s", textAlign: "center",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: receiptName ? "#10b98122" : "#f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {receiptName
                    ? <CheckCircle2 size={16} color="#10b981" />
                    : <FileText size={16} color="#94a3b8" />
                  }
                </div>

                {receiptName ? (
                  <>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#10b981", wordBreak: "break-all" }}>
                      {receiptName.length > 22 ? receiptName.slice(0, 20) + "…" : receiptName}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Receipt attached ✓</p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#475569" }}>Payment Receipt</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>PNG, JPG, PDF</p>
                  </>
                )}

                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: "#e0f2fe", color: "#0369a1", letterSpacing: "0.04em",
                }}>
                  OPTIONAL
                </span>

                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={e => { if (e.target.files[0]) setReceiptName(e.target.files[0].name); }}
                  style={{ display: "none" }}
                />
              </label>

            </div>

            {/* Screenshot error message */}
            {errors.screenshot && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#ef4444", marginTop: 6 }}>
                <AlertCircle size={11} /> {errors.screenshot}
              </span>
            )}
          </div>
          {/* ── END: Attachments ─────────────────────────────────────────── */}

        </div>

        {/* Footer — unchanged */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button onClick={handleSubmit} style={{ ...makeBtn(meta.accent), flex: 1 }}>
            <CheckCircle2 size={14} />
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GenerateLinkModal  — main export  (UNCHANGED from original)
// ─────────────────────────────────────────────────────────────────────────────
export default function GenerateLinkModal({ onClose, onRequestSubmit }) {
  const [email,    setEmail]    = useState("");
  const [ptKey,    setPtKey]    = useState("emp_to_emp");
  const [generated,setGenerated]= useState(null);
  const [token,    setToken]    = useState(null);
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [copied,   setCopied]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  const meta = PT_META[ptKey];

  const validateEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleGenerate = () => {
    if (email && !validateEmail(email)) { setEmailErr("Enter a valid email address"); return; }
    setEmailErr("");
    setLoading(true);
    setTimeout(() => {
      const t = generateToken();
      setToken(t);
      setGenerated(buildLink(t, ptKey));
      setLoading(false);
    }, 800);
  };

  const handleSend = () => {
    if (!email || !validateEmail(email)) { setEmailErr("Enter a valid email to send"); return; }
    setEmailErr("");
    setLoading(true);
    setTimeout(() => { setSent(true); setLoading(false); }, 700);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGenerated(null); setToken(null); setSent(false); setCopied(false);
  };

  const handlePtChange = key => {
    setPtKey(key); setGenerated(null); setToken(null); setSent(false); setCopied(false);
  };

  const handleEmailChange = e => {
    setEmail(e.target.value); setEmailErr("");
    setSent(false); setGenerated(null); setToken(null);
  };

  // Show embedded form when link is "opened"
  if (showForm && token) {
    return (
      <AdvanceRequestForm
        ptKey={ptKey}
        token={token}
        onClose={() => { setShowForm(false); onClose(); }}
        onSubmit={payload => onRequestSubmit?.(payload)}
      />
    );
  }

  return (
    <div style={overlay}>
      <div style={{ ...card, maxWidth: 480 }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          padding: "22px 24px",
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          borderRadius: "16px 16px 0 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Link2 size={18} color="#ffffff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>Generate Payment Link</p>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", marginTop: 2 }}>One-time advance request link for an employee</p>
            </div>
          </div>
          <button onClick={onClose} style={{ ...iconBtn, background: "rgba(255,255,255,0.06)" }}>
            <X size={15} color="#94a3b8" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Payment type selector */}
          <div>
            <p style={sectionLabel}>Payment Type</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {PT_ORDER.map(key => {
                const m   = PT_META[key];
                const sel = ptKey === key;
                const Icon = m.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handlePtChange(key)}
                    style={{
                      position: "relative",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 8, padding: "14px 8px 12px",
                      borderRadius: 12,
                      border: `2px solid ${sel ? m.accent : "#e2e8f0"}`,
                      background: sel ? m.soft : "#fafafa",
                      cursor: "pointer", transition: "all 0.15s",
                      boxShadow: sel ? `0 0 0 3px ${m.accent}18` : "none",
                    }}
                  >
                    {sel && (
                      <span style={{
                        position: "absolute", top: 7, right: 7,
                        width: 16, height: 16, borderRadius: "50%",
                        background: m.accent,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: sel ? m.accent : "#e9eef4",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={17} color={sel ? "#fff" : "#7c8fa6"} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: sel ? m.text : "#64748b",
                      textAlign: "center", lineHeight: 1.3,
                    }}>
                      {m.short}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected type description */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 12,
            background: meta.soft, border: `1px solid ${meta.accent}28`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: meta.accent, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {(() => { const Icon = meta.icon; return <Icon size={15} color="#fff" />; })()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: meta.text }}>{meta.short}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b", marginTop: 1 }}>{meta.tagline}</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <p style={{ ...sectionLabel, marginBottom: 8 }}>
              Employee Email&nbsp;
              <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>
                (Optional — to auto-send)
              </span>
            </p>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              border: `1.5px solid ${emailErr ? "#fca5a5" : "#e2e8f0"}`,
              borderRadius: 11, padding: "9px 14px", background: "#fff",
              transition: "border-color 0.15s",
            }}>
              <Mail size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                type="email"
                placeholder="employee@company.com"
                value={email}
                onChange={handleEmailChange}
                style={{
                  flex: 1, border: "none", outline: "none",
                  fontSize: 13, color: "#1e293b", background: "transparent",
                }}
              />
            </div>
            {emailErr && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11, color: "#ef4444" }}>
                <AlertCircle size={11} /> {emailErr}
              </div>
            )}
          </div>

          {/* Info strip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            background: "#f8fafc", border: "1px solid #f1f5f9",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7,
              background: "#e2e8f0", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              Expires in <strong style={{ color: "#334155" }}>7 days</strong>
              &nbsp;·&nbsp; One-time use &nbsp;·&nbsp; Requires admin approval
            </p>
          </div>

          {/* Generated link box */}
          {generated && (
            <div style={{
              border: "1.5px solid #e0e7ff", borderRadius: 12,
              overflow: "hidden",
            }}>
              <div style={{ padding: "12px 14px", background: "#f5f7ff" }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Generated Link
                </p>
                <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "#4338ca", wordBreak: "break-all", lineHeight: 1.6 }}>
                  {generated}
                </p>
              </div>
              <div style={{ padding: "10px 14px", display: "flex", gap: 8, background: "#fff", borderTop: "1px solid #e0e7ff" }}>
                <button onClick={handleCopy} style={copied ? chipSuccess : chipIndigo}>
                  {copied ? <><CheckCircle2 size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                </button>
                <button onClick={() => setShowForm(true)} style={chipDark}>
                  <ExternalLink size={12} /> Open Form
                </button>
              </div>
            </div>
          )}

          {/* Sent success */}
          {sent && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 12,
              background: "#f0fdf4", border: "1.5px solid #bbf7d0",
            }}>
              <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#15803d" }}>Link sent successfully</p>
                <p style={{ margin: 0, fontSize: 12, color: "#16a34a", marginTop: 2 }}>
                  Delivered to <strong>{email}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={onClose} style={outlineBtn}>Close</button>

          {!generated && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{ ...makeBtn(meta.accent), flex: 1, opacity: loading ? 0.65 : 1 }}
            >
              <Link2 size={14} />
              {loading ? "Generating…" : "Generate Link"}
            </button>
          )}

          {generated && email && !sent && (
            <button
              onClick={handleSend}
              disabled={loading}
              style={{ ...makeBtn(meta.accent), flex: 1, opacity: loading ? 0.65 : 1 }}
            >
              <Send size={14} />
              {loading ? "Sending…" : "Send to Employee"}
            </button>
          )}

          {generated && (
            <button onClick={handleReset} style={{ ...outlineBtn, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <RefreshCw size={13} /> New
            </button>
          )}
        </div>
      </div>
    </div>
  );
}