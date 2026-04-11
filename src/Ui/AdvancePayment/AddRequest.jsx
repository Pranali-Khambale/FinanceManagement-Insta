// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/AddRequestModal.jsx
// Step 1 → select type | Step 2 → fill details | Step 3 → professional success
// On Step 3: header and close (×) button are completely hidden.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  X, Upload, Plus, ArrowRight, CheckCircle2,
  FileImage, Users, Globe, AlertCircle, Loader2, Building2,
} from "lucide-react";
import { PAYMENT_TYPES } from "../../data/content";
import advancePaymentService from "../../services/advancePaymentService";

// ── Payment type card ─────────────────────────────────────────────────────────
function PaymentTypeCard({ pt, selected, onClick }) {
  const icons = {
    org_to_emp: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="9" height="14" rx="1.5"/>
        <path d="M16 3h5v18h-5"/>
        <line x1="6" y1="11" x2="7" y2="11"/>
        <line x1="6" y1="15" x2="7" y2="15"/>
      </svg>
    ),
    emp_to_emp: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    other: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        padding: "14px 8px 11px",
        borderRadius: 12,
        cursor: "pointer",
        border: "none",
        outline: `${selected ? "2px" : "1.5px"} solid ${selected ? pt.color : "#e2e8f0"}`,
        background: selected ? pt.color + "10" : "#fafafa",
        boxShadow: selected ? `0 0 0 3px ${pt.color}20` : "none",
        transition: "all 0.15s",
      }}
    >
      {selected && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: pt.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: selected ? pt.color : "#eef1f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: selected ? "#fff" : pt.color,
        }}
      >
        {icons[pt.key]}
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: selected ? pt.color : "#64748b",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {pt.label}
      </span>
      <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", lineHeight: 1.3 }}>
        {pt.desc}
      </span>
    </button>
  );
}

// ── Field / input primitives ──────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ display: "flex", alignItems: "center", gap: 4, margin: "4px 0 0", fontSize: 11, color: "#ef4444" }}>
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function Inp({ error, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "9px 12px",
        borderRadius: 9,
        fontSize: 13,
        border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
        background: error ? "#fff5f5" : "#fff",
        color: "#1e293b",
        outline: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
    />
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step, pt }) {
  const labels = ["Select type", "Fill details", "Done"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 22px 0" }}>
      {labels.map((l, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done ? "#dcfce7" : active ? pt.color : "#f1f5f9",
                  color: done ? "#16a34a" : active ? "#fff" : "#94a3b8",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : num}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#334155" : done ? "#64748b" : "#94a3b8" }}>
                {l}
              </span>
            </div>
            {i < labels.length - 1 && <div style={{ width: 20, height: 1, background: "#e2e8f0" }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Summary row ───────────────────────────────────────────────────────────────
function SRow({ label, value, mono }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "0.5px dashed #e8edf2",
      }}
    >
      <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#1e293b",
          fontFamily: mono ? "monospace" : "inherit",
          textAlign: "right",
          marginLeft: 12,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "60%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionDivider({ label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 700,
          background: color + "12",
          color,
        }}
      >
        <ArrowRight size={10} /> {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
    </div>
  );
}

// ── Type icon helper ──────────────────────────────────────────────────────────
function TypeIcon({ ptKey, color, size = 15 }) {
  if (ptKey === "emp_to_emp") return <Users size={size} color={color} />;
  if (ptKey === "other") return <Globe size={size} color={color} />;
  return <Building2 size={size} color={color} />;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AddRequestModal({ onClose, onAdd, linkToken = null }) {
  const [step, setStep] = useState(1);
  const [ptKey, setPtKey] = useState("org_to_emp");
  const [form, setForm] = useState({
    empId: "", name: "", dept: "", amount: "", reason: "",
    toEmpId: "", toEmpName: "", toEmpDept: "",
    vendorName: "", vendorRef: "",
  });
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [proofName, setProofName] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const pt = PAYMENT_TYPES[ptKey];
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const handleScreenshot = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setScreenshotName(f.name);
    setScreenshotFile(f);
    setErrors((er) => ({ ...er, screenshot: "" }));
    const r = new FileReader();
    r.onload = (ev) => setScreenshotPreview(ev.target.result);
    r.readAsDataURL(f);
  };

  const handleProof = (e) => {
    const f = e.target.files[0];
    if (f) { setProofName(f.name); setProofFile(f); }
  };

  const validate = () => {
    const er = {};
    if (!form.empId)                              er.empId      = "Required";
    if (!form.name)                               er.name       = "Required";
    if (!form.dept)                               er.dept       = "Required";
    if (!form.amount || Number(form.amount) <= 0) er.amount     = "Enter a valid amount";
    if (!form.reason)                             er.reason     = "Required";
    if (!screenshotFile)                          er.screenshot = "Payment screenshot is mandatory";
    if (ptKey === "emp_to_emp") {
      if (!form.toEmpId) er.toEmpId = "Required";
      if (!form.toEmpName) er.toEmpName = "Required";
    }
    if (ptKey === "other" && !form.vendorName) er.vendorName = "Required";
    return er;
  };

  const submit = async () => {
    const er = validate();
    if (Object.keys(er).length) { setErrors(er); return; }
    setSubmitting(true);
    try {
      const payload = {
        payment_type_key: ptKey,
        emp_id:      form.empId,
        emp_name:    form.name,
        emp_dept:    form.dept,
        amount:      form.amount,
        reason:      form.reason,
        to_emp_id:   form.toEmpId   || undefined,
        to_emp_name: form.toEmpName || undefined,
        to_emp_dept: form.toEmpDept || undefined,
        vendor_name: form.vendorName || undefined,
        vendor_ref:  form.vendorRef  || undefined,
      };
      const res = await advancePaymentService.createRequest(
        payload, screenshotFile, proofFile || null, null, linkToken
      );
      const receipt = {
        empId:       form.empId,
        name:        form.name,
        dept:        form.dept,
        amount:      form.amount,
        reason:      form.reason,
        screenshot:  screenshotName,
        proof:       proofName || null,
        id:          res.data?.requestCode || res.data?.request_code || ("ADV-" + Date.now()),
        date:        new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        status:      "pending",
        paymentType: ptKey,
        toEmpId:     form.toEmpId   || null,
        toEmpName:   form.toEmpName || null,
        toEmpDept:   form.toEmpDept || null,
        vendorName:  form.vendorName || null,
        vendorRef:   form.vendorRef  || null,
      };
      if (onAdd) await onAdd(receipt);
      setResult(receipt);
      setStep(3);
    } catch (err) {
      alert(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes popIn  { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(10,15,30,0.45)",
          backdropFilter: "blur(5px)",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            width: "100%",
            maxWidth: 520,
            boxShadow: "0 24px 64px rgba(10,15,30,0.18)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            overflow: "hidden",
          }}
        >
          {/* ── Header — only shown on steps 1 & 2 ── */}
          {step < 3 && (
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: pt.color + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={16} color={pt.color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                    New advance request
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                    {step === 1 ? "Select a payment type to continue" : `Type: ${pt.label}`}
                  </p>
                </div>
              </div>
              {/* Close button — only steps 1 & 2 */}
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 7,
                  background: "#fafafa",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Step indicator — steps 1 & 2 only ── */}
          {step < 3 && <StepIndicator step={step} pt={pt} />}

          {/* ── Body ── */}
          <div
            style={{
              overflowY: "auto",
              flex: 1,
              padding: step === 3 ? "32px 26px 12px" : "18px 22px",
            }}
          >
            {/* ── Step 1: Select payment type ── */}
            {step === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {Object.values(PAYMENT_TYPES).map((p) => (
                  <PaymentTypeCard
                    key={p.key}
                    pt={p}
                    selected={ptKey === p.key}
                    onClick={() => setPtKey(p.key)}
                  />
                ))}
              </div>
            )}

            {/* ── Step 2: Fill details ── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: ".07em",
                  }}
                >
                  {ptKey === "emp_to_emp" ? "Requesting employee" : "Employee details"}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Employee ID" required error={errors.empId}>
                    <Inp placeholder="Insta-260401" value={form.empId} onChange={set("empId")} error={errors.empId} />
                  </Field>
                  <Field label="Full name" required error={errors.name}>
                    <Inp placeholder="John Doe" value={form.name} onChange={set("name")} error={errors.name} />
                  </Field>
                  <Field label="Department" required error={errors.dept}>
                    <Inp placeholder="Engineering" value={form.dept} onChange={set("dept")} error={errors.dept} />
                  </Field>
                  <Field label="Amount (₹)" required error={errors.amount}>
                    <Inp
                      type="number"
                      min="1"
                      placeholder="10000"
                      value={form.amount}
                      onChange={set("amount")}
                      error={errors.amount}
                    />
                  </Field>
                </div>

                {/* Recipient employee fields */}
                {ptKey === "emp_to_emp" && (
                  <>
                    <SectionDivider label="Recipient employee" color={pt.color} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="Recipient emp ID" required error={errors.toEmpId}>
                        <Inp placeholder="Insta-260401" value={form.toEmpId} onChange={set("toEmpId")} error={errors.toEmpId} />
                      </Field>
                      <Field label="Recipient name" required error={errors.toEmpName}>
                        <Inp placeholder="Jane Smith" value={form.toEmpName} onChange={set("toEmpName")} error={errors.toEmpName} />
                      </Field>
                      <Field label="Recipient department" error={errors.toEmpDept}>
                        <Inp placeholder="Design" value={form.toEmpDept} onChange={set("toEmpDept")} error={errors.toEmpDept} />
                      </Field>
                    </div>
                  </>
                )}

                {/* Vendor fields */}
                {ptKey === "other" && (
                  <>
                    <SectionDivider label="Vendor / external" color={pt.color} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="Vendor name" required error={errors.vendorName}>
                        <Inp placeholder="LexPro LLP" value={form.vendorName} onChange={set("vendorName")} error={errors.vendorName} />
                      </Field>
                      <Field label="Reference / invoice" error={errors.vendorRef}>
                        <Inp placeholder="INV-001" value={form.vendorRef} onChange={set("vendorRef")} error={errors.vendorRef} />
                      </Field>
                    </div>
                  </>
                )}

                {/* Reason */}
                <Field label="Reason" required error={errors.reason}>
                  <textarea
                    rows={3}
                    placeholder="Describe the reason for this advance request…"
                    value={form.reason}
                    onChange={set("reason")}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 9,
                      fontSize: 13,
                      border: `1.5px solid ${errors.reason ? "#fca5a5" : "#e2e8f0"}`,
                      background: errors.reason ? "#fff5f5" : "#fff",
                      color: "#1e293b",
                      fontFamily: "inherit",
                      resize: "none",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {errors.reason && (
                    <p style={{ display: "flex", alignItems: "center", gap: 4, margin: "4px 0 0", fontSize: 11, color: "#ef4444" }}>
                      <AlertCircle size={10} /> {errors.reason}
                    </p>
                  )}
                </Field>

                {/* Payment screenshot — mandatory */}
                <div>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Payment screenshot <span style={{ color: "#ef4444" }}>*</span>
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: 99,
                        fontSize: 9,
                        fontWeight: 700,
                        background: pt.color + "15",
                        color: pt.color,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      Mandatory
                    </span>
                  </p>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1.5px ${screenshotName ? "solid" : "dashed"} ${
                        errors.screenshot ? "#fca5a5" : screenshotName ? pt.color : "#cbd5e1"
                      }`,
                      background: screenshotName ? pt.color + "08" : "#fafafa",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {screenshotPreview ? (
                      <img
                        src={screenshotPreview}
                        alt=""
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          objectFit: "cover",
                          flexShrink: 0,
                          border: `1.5px solid ${pt.color}44`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 9,
                          background: errors.screenshot ? "#fef2f2" : "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileImage size={18} color={errors.screenshot ? "#ef4444" : "#94a3b8"} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {screenshotName ? (
                        <>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: pt.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {screenshotName}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>Screenshot attached</p>
                        </>
                      ) : (
                        <>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#64748b" }}>Upload payment screenshot</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>PNG, JPG, JPEG · Required to submit</p>
                        </>
                      )}
                    </div>
                    {screenshotName ? (
                      <CheckCircle2 size={18} color={pt.color} style={{ flexShrink: 0 }} />
                    ) : (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "6px 10px",
                          borderRadius: 7,
                          border: `1px solid ${pt.color}44`,
                          color: pt.color,
                          fontSize: 12,
                          fontWeight: 600,
                          background: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        <Upload size={11} /> Browse
                      </span>
                    )}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={handleScreenshot}
                      style={{ display: "none" }}
                    />
                  </label>
                  {errors.screenshot && (
                    <p style={{ display: "flex", alignItems: "center", gap: 4, margin: "4px 0 0", fontSize: 11, color: "#ef4444" }}>
                      <AlertCircle size={10} /> {errors.screenshot}
                    </p>
                  )}
                </div>

                {/* Supporting document — optional */}
                <div>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Supporting document{" "}
                    <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#cbd5e1" }}>
                      optional
                    </span>
                  </p>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: `1.5px dashed ${proofName ? pt.color : "#e2e8f0"}`,
                      background: "#fafafa",
                      cursor: "pointer",
                      transition: "border 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: proofName ? pt.color + "15" : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Upload size={15} color={proofName ? pt.color : "#94a3b8"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {proofName ? (
                        <>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: pt.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {proofName}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>Document attached</p>
                        </>
                      ) : (
                        <>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#64748b" }}>Upload proof document</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>PNG, JPG, PDF · Optional</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleProof}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ── Step 3: Success — no header, no × button ── */}
            {step === 3 && result && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  animation: "fadeIn .25s ease",
                }}
              >
                {/* Animated check circle */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#EAF3DE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                    animation: "popIn .45s cubic-bezier(.34,1.56,.64,1) both",
                  }}
                >
                  <CheckCircle2 size={30} color="#3B6D11" />
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1e293b",
                    textAlign: "center",
                    animation: "fadeUp .3s ease .15s both",
                  }}
                >
                  Request submitted!
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 13,
                    color: "#64748b",
                    lineHeight: 1.7,
                    textAlign: "center",
                    animation: "fadeUp .3s ease .22s both",
                  }}
                >
                  Your advance payment request has been received.<br />
                  HR will review it and get back to you shortly.
                </p>

                {/* Pending status pill */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 14,
                    padding: "5px 12px",
                    borderRadius: 99,
                    background: "#EAF3DE",
                    border: "0.5px solid #97C459",
                    animation: "fadeUp .3s ease .28s both",
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#639922" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#3B6D11" }}>Pending HR approval</span>
                </div>

                {/* Summary card */}
                <div
                  style={{
                    width: "100%",
                    marginTop: 20,
                    borderRadius: 14,
                    border: "0.5px solid #e2e8f0",
                    overflow: "hidden",
                    animation: "fadeUp .3s ease .35s both",
                  }}
                >
                  {/* Card top strip */}
                  <div
                    style={{
                      background: pt.color + "0d",
                      borderBottom: `0.5px solid ${pt.color}20`,
                      padding: "11px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: pt.color + "1a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <TypeIcon ptKey={ptKey} color={pt.color} size={15} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#334155" }}>Advance payment</p>
                        <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>{pt.label}</p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 11px",
                        borderRadius: 99,
                        background: "#EAF3DE",
                        border: "0.5px solid #97C459",
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#639922" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#3B6D11" }}>Pending approval</span>
                    </div>
                  </div>

                  {/* Data rows */}
                  <div style={{ padding: "12px 16px 14px", background: "#f8fafc" }}>
                    <SRow label="Request ID" value={result.id}   mono />
                    <SRow label="Employee"   value={`${result.name} · ${result.empId}`} />
                    <SRow label="Department" value={result.dept} />
                    <SRow label="Date"       value={result.date} />
                    {result.toEmpName && (
                      <SRow
                        label="Recipient"
                        value={`${result.toEmpName}${result.toEmpId ? " · " + result.toEmpId : ""}`}
                      />
                    )}
                    {result.vendorName && (
                      <SRow
                        label="Vendor"
                        value={result.vendorRef ? `${result.vendorName} · ${result.vendorRef}` : result.vendorName}
                      />
                    )}

                    {/* Amount */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 11,
                        paddingTop: 11,
                        borderTop: `1.5px solid ${pt.color}22`,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total amount</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: pt.color }}>
                        ₹ {Number(result.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Screenshot footer */}
                  {result.screenshot && (
                    <div
                      style={{
                        padding: "9px 16px",
                        borderTop: "0.5px solid #e8edf2",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FileImage size={13} color="#94a3b8" />
                      <span style={{ fontSize: 11, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {result.screenshot}
                      </span>
                      <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>Screenshot attached</span>
                    </div>
                  )}
                </div>

                
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              padding: "14px 22px 18px",
              borderTop: step === 3 ? "none" : "1px solid #f1f5f9",
              background: "#fff",
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {step === 3 ? (
              /* Done button */
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: `1.5px solid ${pt.color}40`,
                  background: pt.color + "0e",
                  color: pt.color,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  animation: "fadeUp .3s ease .6s both",
                }}
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 9,
                    border: "1.5px solid #e2e8f0",
                    background: "#fff",
                    color: "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    disabled={submitting}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 9,
                      border: "1.5px solid #e2e8f0",
                      background: "#fff",
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                )}

                <button
                  onClick={step === 1 ? () => setStep(2) : submit}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 16px",
                    borderRadius: 9,
                    border: "none",
                    background: submitting ? "#cbd5e1" : pt.color,
                    color: submitting ? "#94a3b8" : "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: submitting ? "none" : `0 4px 14px ${pt.color}40`,
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Submitting…
                    </>
                  ) : step === 1 ? (
                    <>Continue <ArrowRight size={14} /></>
                  ) : (
                    <><CheckCircle2 size={14} /> Submit request</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
