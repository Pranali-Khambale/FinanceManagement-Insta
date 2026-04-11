// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/AdvanceRequestForm.jsx
// Public 3-step wizard. Success = professional summary card with proper header.
// Route: /advance-request/:paymentTypeKey/:token
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2, AlertCircle, Loader2, Send,
  Users, Globe, Upload, X, Building2,
} from "lucide-react";
import advancePaymentService from "../../services/advancePaymentService";

const TYPE_META = {
  org_to_emp: { label: "Organization → Employee", subtitle: "Company advance to employee",       icon: Building2, color: "#2563eb" },
  emp_to_emp: { label: "Employee → Employee",      subtitle: "Transfer advance between employees", icon: Users,     color: "#7c3aed" },
  other:      { label: "Vendor / External",        subtitle: "Payment to external party",          icon: Globe,     color: "#0891b2" },
};
function getTypeMeta(key) {
  return TYPE_META[key] || { label: key, subtitle: "", icon: Building2, color: "#2563eb" };
}

// ── Primitives ────────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={css.label}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
        {hint && (
          <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#cbd5e1", marginLeft: 6 }}>
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function TextInput({ name, type = "text", placeholder, value, onChange, prefix }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fafafa" }}>
      {prefix && <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, flexShrink: 0 }}>{prefix}</span>}
      <input
        name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#1e293b", background: "transparent", fontFamily: "inherit" }}
      />
    </div>
  );
}

function TextArea({ name, placeholder, value, onChange, rows = 3 }) {
  return (
    <textarea
      name={name} placeholder={placeholder} value={value} onChange={onChange} rows={rows}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fafafa", fontSize: 13, color: "#1e293b", fontFamily: "inherit", resize: "vertical", lineHeight: 1.65, outline: "none", boxSizing: "border-box" }}
    />
  );
}

function FileUpload({ label, required, hint, accept, file, onChange }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);
  return (
    <Field label={label} required={required}>
      {file ? (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 9, border: "1.5px solid #86efac", background: "#f0fdf4" }}>
          <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, color: "#15803d", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
          <button type="button" onClick={() => onChange(null)} style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#94a3b8", lineHeight: 1 }}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onChange(f); }}
          style={{ padding: 18, borderRadius: 9, cursor: "pointer", textAlign: "center", border: `1.5px dashed ${dragging ? "#2563eb" : "#cbd5e1"}`, background: dragging ? "#eff6ff" : "#fafafa", transition: "all 0.15s" }}>
          <Upload size={18} color={dragging ? "#2563eb" : "#94a3b8"} style={{ margin: "0 auto 6px", display: "block" }} />
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Click or drag & drop</p>
          {hint && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8" }}>{hint}</p>}
          <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => onChange(e.target.files[0] || null)} />
        </div>
      )}
    </Field>
  );
}

function StepBar({ step, total = 3, labels }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        {Array.from({ length: total }, (_, i) => {
          const num = i + 1;
          const done   = num < step;
          const active = num === step;
          return (
            <div key={num} style={{ display: "flex", alignItems: "center", flex: num < total ? "1 1 auto" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#dcfce7" : active ? "#2563eb" : "#f1f5f9", color: done ? "#16a34a" : active ? "#fff" : "#94a3b8", fontSize: 11, fontWeight: 700, transition: "all 0.2s" }}>
                {done
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : num}
              </div>
              {num < total && <div style={{ flex: 1, height: 1.5, background: done ? "#2563eb" : "#e2e8f0", transition: "background 0.3s" }} />}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", marginTop: 6 }}>
        {labels.map((l, i) => (
          <span key={i} style={{ flex: i < labels.length - 1 ? "1 1 auto" : "none", fontSize: 11, fontWeight: 600, color: i + 1 < step ? "#16a34a" : i + 1 === step ? "#1d4ed8" : "#94a3b8", transition: "color 0.2s" }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12, color: "#ef4444" }}>
      <AlertCircle size={13} style={{ flexShrink: 0 }} /> {msg}
    </div>
  );
}

function InfoStrip({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 9, background: "#f8fafc", border: "0.5px solid #f1f5f9" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.6" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="#94a3b8"/>
      </svg>
      <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

// ── Success summary row ───────────────────────────────────────────────────────
function SummaryRow({ label, value, last, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: last ? "none" : "0.5px dashed #e2e8f0" }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdvanceRequestForm() {
  const { paymentTypeKey, token } = useParams();

  const [tokenValid,    setTokenValid]    = useState(null);
  const [tokenMeta,     setTokenMeta]     = useState(null);
  const [step,          setStep]          = useState(1);
  const [submitResult,  setSubmitResult]  = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error,         setError]         = useState("");

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [proofFile,      setProofFile]      = useState(null);

  const [form, setForm] = useState({
    name: "", empId: "", dept: "", amount: "", reason: "",
    toEmpId: "", toEmpName: "", toEmpDept: "",
    vendorName: "", vendorRef: "",
  });

  useEffect(() => {
    if (!token || !paymentTypeKey) { setTokenValid(false); return; }
    advancePaymentService.validateLink(token)
      .then(res => { setTokenMeta(res.data); setTokenValid(true); })
      .catch(() => setTokenValid(false));
  }, [token, paymentTypeKey]);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validateStep = (s) => {
    if (s === 1 && (!form.name || !form.empId || !form.dept))
      return "Please fill in all required fields.";
    if (s === 2) {
      if (!form.amount || !form.reason) return "Please fill in amount and reason.";
      if (paymentTypeKey === "emp_to_emp" && (!form.toEmpId || !form.toEmpName))
        return "Please fill in recipient employee details.";
      if (paymentTypeKey === "other" && !form.vendorName)
        return "Please enter the vendor / payee name.";
    }
    if (s === 3 && !screenshotFile) return "Please upload a payment screenshot.";
    return "";
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    if (step < 3) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      const payload = {
        payment_type_key: paymentTypeKey,
        emp_id:   form.empId,  emp_name: form.name,  emp_dept: form.dept,
        amount:   Number(form.amount),  reason: form.reason,
        ...(paymentTypeKey === "emp_to_emp" ? { to_emp_id: form.toEmpId, to_emp_name: form.toEmpName, to_emp_dept: form.toEmpDept } : {}),
        ...(paymentTypeKey === "other"      ? { vendor_name: form.vendorName, vendor_ref: form.vendorRef } : {}),
      };
      const res = await advancePaymentService.createRequest(payload, screenshotFile, proofFile || null, null, token);
      setSubmitResult({
        id:     res.data?.requestCode || res.data?.request_code || ("ADV-" + Date.now()),
        name:   form.name,
        empId:  form.empId,
        dept:   form.dept,
        amount: Number(form.amount),
        date:   new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      });
    } catch (err) {
      setError(err.message || "Submission failed. The link may have expired.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Token loading ─────────────────────────────────────────────────────────
  if (tokenValid === null) {
    return (
      <div style={css.page}>
        <style>{animations}</style>
        <div style={{ ...css.card, padding: 40, gap: 12 }}>
          <Loader2 size={26} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>Validating your link…</p>
        </div>
      </div>
    );
  }

  // ── Invalid token ─────────────────────────────────────────────────────────
  if (!tokenValid) {
    return (
      <div style={css.page}>
        <div style={{ ...css.card, padding: 40 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <AlertCircle size={24} color="#ef4444" />
          </div>
          <h2 style={{ color: "#1e293b", margin: "0 0 8px", fontSize: 17, fontWeight: 700 }}>Link invalid or expired</h2>
          <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", margin: 0, lineHeight: 1.65 }}>
            This advance payment link is no longer valid.<br />Please contact your HR / admin for a new link.
          </p>
        </div>
      </div>
    );
  }

  // ── Success — professional card with header ───────────────────────────────
  if (submitResult) {
    const meta = getTypeMeta(paymentTypeKey);
    const Icon = meta.icon;
    return (
      <div style={css.page}>
        <style>{animations}</style>
        <div style={{ ...css.card, padding: 0, maxWidth: 440 }}>

          {/* ── Professional header (replaces the old blue strip) ── */}
          <div style={{
            padding: "18px 22px 16px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            {/* Icon box */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: meta.color + "14",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={18} color={meta.color} />
            </div>

            {/* Title + subtitle */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                New advance request
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                Type: {meta.label}
              </p>
            </div>

            {/* Pill badge */}
            <div style={{
              padding: "4px 11px",
              borderRadius: 99,
              background: meta.color + "12",
              border: `0.5px solid ${meta.color}44`,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>Advance</span>
            </div>
          </div>

          {/* ── Success body ── */}
          <div style={{ padding: "28px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

            {/* Animated check circle */}
            <div style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "#EAF3DE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              animation: "popIn .4s cubic-bezier(.34,1.56,.64,1) both",
            }}>
              <CheckCircle2 size={28} color="#3B6D11" />
            </div>

            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b", animation: "fadeUp .3s ease .2s both" }}>
              Request submitted!
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.7, animation: "fadeUp .3s ease .3s both" }}>
              Your advance payment request has been received.<br />
              HR will review it and get back to you shortly.
            </p>

            {/* Summary card */}
            <div style={{
              width: "100%",
              marginTop: 22,
              background: "#f8fafc",
              borderRadius: 12,
              border: "0.5px solid #e2e8f0",
              padding: "14px 16px",
              animation: "fadeUp .3s ease .42s both",
              textAlign: "left",
            }}>
              <SummaryRow label="Request ID" value={submitResult.id}   mono />
              <SummaryRow label="Employee"   value={`${submitResult.name} · ${submitResult.empId}`} />
              <SummaryRow label="Department" value={submitResult.dept} />
              <SummaryRow label="Date"       value={submitResult.date} />

              {/* Amount row — larger + colored */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 9, marginTop: 2 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Amount</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: meta.color }}>
                  ₹ {submitResult.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 16,
              padding: "6px 14px",
              borderRadius: 99,
              background: "#EAF3DE",
              border: "0.5px solid #97C459",
              animation: "fadeUp .3s ease .54s both",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#639922" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#3B6D11" }}>Pending approval</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 22px 16px", borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
            <button
              onClick={() => window.close?.()}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: 9,
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                color: "#475569",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}>
              Done
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── Form wizard ───────────────────────────────────────────────────────────
  const meta = getTypeMeta(paymentTypeKey);
  const Icon = meta.icon;

  return (
    <div style={css.page}>
      <style>{animations}</style>
      <div style={{ ...css.card, padding: 0, maxWidth: 480 }}>

        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: meta.color + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={17} color={meta.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Advance payment request</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                {tokenMeta?.short_label || meta.label} · {meta.subtitle}
              </p>
            </div>
          </div>
          <StepBar step={step} total={3} labels={["Your info", "Amount & reason", "Attachment"]} />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={css.body}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Full name" required>
                <TextInput name="name" placeholder="John Doe" value={form.name} onChange={onChange} />
              </Field>
              <Field label="Employee ID" required>
                <TextInput name="empId" placeholder="Insta-260401" value={form.empId} onChange={onChange} />
              </Field>
            </div>
            <Field label="Department" required>
              <TextInput name="dept" placeholder="Engineering" value={form.dept} onChange={onChange} />
            </Field>
            <InfoStrip>Your details are linked to this request token and cannot be changed after submission.</InfoStrip>
            <ErrorBox msg={error} />
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={css.body}>
            <Field label="Amount (₹)" required>
              <TextInput name="amount" type="number" placeholder="5,000" prefix="₹" value={form.amount} onChange={onChange} />
            </Field>

            {paymentTypeKey === "emp_to_emp" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Recipient emp ID" required>
                    <TextInput name="toEmpId" placeholder="Insta-260401" value={form.toEmpId} onChange={onChange} />
                  </Field>
                  <Field label="Recipient name" required>
                    <TextInput name="toEmpName" placeholder="Jane Smith" value={form.toEmpName} onChange={onChange} />
                  </Field>
                </div>
                <Field label="Recipient department" hint="optional">
                  <TextInput name="toEmpDept" placeholder="Marketing" value={form.toEmpDept} onChange={onChange} />
                </Field>
              </>
            )}

            {paymentTypeKey === "other" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Vendor name" required>
                  <TextInput name="vendorName" placeholder="ABC Supplies Ltd." value={form.vendorName} onChange={onChange} />
                </Field>
                <Field label="Invoice / ref #" hint="optional">
                  <TextInput name="vendorRef" placeholder="INV-2026-001" value={form.vendorRef} onChange={onChange} />
                </Field>
              </div>
            )}

            <Field label="Reason" required>
              <TextArea name="reason" placeholder="Briefly explain why you need this advance…" value={form.reason} onChange={onChange} />
            </Field>
            <ErrorBox msg={error} />
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={css.body}>
            <FileUpload label="Payment screenshot" required accept="image/png,image/jpeg,image/webp" file={screenshotFile} onChange={setScreenshotFile} hint="PNG, JPG, WEBP · max 5 MB" />
            <FileUpload label="Supporting document" hint="optional" accept="image/png,image/jpeg,image/webp,application/pdf" file={proofFile} onChange={setProofFile} />
            <InfoStrip>Supporting doc is optional — invoices, approval emails, or receipts welcome.</InfoStrip>
            <ErrorBox msg={error} />
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "12px 22px 16px", borderTop: "1px solid #f1f5f9", background: "#fafbfc", display: "flex", gap: 8 }}>
          {step > 1 && (
            <button
              onClick={() => { setStep(s => s - 1); setError(""); }}
              style={{ padding: "10px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={submitLoading}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 9,
              border: "none",
              background: submitLoading ? "#cbd5e1" : meta.color,
              color: submitLoading ? "#94a3b8" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: submitLoading ? "not-allowed" : "pointer",
              boxShadow: submitLoading ? "none" : `0 4px 14px ${meta.color}40`,
            }}>
            {submitLoading
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</>
              : step < 3
                ? "Continue →"
                : <><Send size={14} /> Submit request</>}
          </button>
        </div>

      </div>
    </div>
  );
}

const animations = `
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes popIn   { 0% { transform:scale(0.7); opacity:0; } 60% { transform:scale(1.1); } 100% { transform:scale(1); opacity:1; } }
`;

const css = {
  page:  { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f0f4ff,#e8eeff)", padding: 20 },
  card:  { background: "#fff", borderRadius: 16, boxShadow: "0 12px 40px rgba(15,23,42,0.10)", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" },
  body:  { padding: "20px 22px", display: "flex", flexDirection: "column", gap: 13, width: "100%", animation: "fadeUp 0.2s ease", boxSizing: "border-box" },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 },
};