// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/AdvanceResubmitForm.jsx
//
// Route:  /advance-resubmit/:token
// Public: no auth required
//
// Flow:
//  1. Page loads → validates token via GET /api/advance-payment/resubmit/:token
//  2. If valid → renders pre-filled form with original request data + rejection reason banner
//  3. Employee edits fields + uploads new screenshot
//  4. Submit → POST /api/advance-payment/requests/public with resubmit_token
//  5. On success → shows success screen
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, Upload, X,
  Loader2, RefreshCw, FileText, Info,
} from "lucide-react";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

// ── helpers ───────────────────────────────────────────────────────────────────
function inr(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── File upload area ──────────────────────────────────────────────────────────
function FileUpload({ label, accept, value, onChange, required, hint }) {
  const inputRef = useRef(null);

  return (
    <Field label={label} required={required} hint={hint}>
      {value ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
          <FileText size={14} className="text-emerald-600 shrink-0" />
          <span className="text-sm text-emerald-700 font-medium truncate flex-1">{value.name}</span>
          <span className="text-xs text-emerald-500">{(value.size / 1024).toFixed(0)} KB</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 rounded-lg hover:bg-emerald-200 text-emerald-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl
                     border-2 border-dashed border-slate-200 hover:border-indigo-300
                     hover:bg-indigo-50/30 cursor-pointer transition-all group"
        >
          <Upload size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
          <p className="text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">
            Click to upload or drag & drop
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </div>
      )}
    </Field>
  );
}

// ── States ────────────────────────────────────────────────────────────────────
const STATES = {
  LOADING:  "loading",
  INVALID:  "invalid",
  FORM:     "form",
  SUBMITTING: "submitting",
  SUCCESS:  "success",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function AdvanceResubmitForm() {
  const { token } = useParams();

  const [state,       setState]       = useState(STATES.LOADING);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [prefill,     setPrefill]     = useState(null);
  const [submitError, setSubmitError] = useState("");

  // ── Form fields ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    emp_id:       "",
    emp_name:     "",
    emp_dept:     "",
    emp_email:    "",
    amount:       "",
    reason:       "",
    to_emp_id:    "",
    to_emp_name:  "",
    to_emp_dept:  "",
    vendor_name:  "",
    vendor_ref:   "",
  });
  const [screenshot, setScreenshot] = useState(null);
  const [proof,      setProof]      = useState(null);
  const [receipt,    setReceipt]    = useState(null);

  // ── Load & validate token on mount ────────────────────────────────────────
  useEffect(() => {
    if (!token) { setState(STATES.INVALID); setErrorMsg("No resubmit token found in URL."); return; }

    (async () => {
      try {
        const res  = await fetch(`${BASE_URL}/advance-payment/resubmit/${token}`);
        const data = await res.json().catch(() => ({ success: false, message: "Invalid response" }));

        if (!res.ok || !data.success) {
          setState(STATES.INVALID);
          setErrorMsg(data.message || "This resubmit link is invalid or has expired.");
          return;
        }

        const d = data.data;
        setPrefill(d);

        // Pre-fill form from original request
        setForm({
          emp_id:      d.emp_id      || "",
          emp_name:    d.emp_name    || "",
          emp_dept:    d.emp_dept    || "",
          emp_email:   d.employee_email || "",
          amount:      d.amount      ? String(d.amount) : "",
          reason:      d.reason      || "",
          to_emp_id:   d.to_emp_id   || "",
          to_emp_name: d.to_emp_name || "",
          to_emp_dept: d.to_emp_dept || "",
          vendor_name: d.vendor_name || "",
          vendor_ref:  d.vendor_ref  || "",
        });

        setState(STATES.FORM);
      } catch (err) {
        setState(STATES.INVALID);
        setErrorMsg("Cannot connect to server. Please check your connection.");
      }
    })();
  }, [token]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!screenshot) {
      setSubmitError("A payment screenshot is required.");
      return;
    }

    setState(STATES.SUBMITTING);

    const body = new FormData();
    body.append("payment_type_key", prefill.payment_type_key);
    body.append("resubmit_token",   token);

    const fields = [
      "emp_id","emp_name","emp_dept","emp_email",
      "amount","reason",
      "to_emp_id","to_emp_name","to_emp_dept",
      "vendor_name","vendor_ref",
    ];
    fields.forEach(k => {
      if (form[k]) body.append(k, form[k]);
    });

    body.append("screenshot", screenshot);
    if (proof)   body.append("proof",   proof);
    if (receipt) body.append("receipt", receipt);

    try {
      const res  = await fetch(`${BASE_URL}/advance-payment/requests/public`, {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({ success: false, message: "Invalid response" }));

      if (!res.ok || !data.success) {
        setSubmitError(data.message || "Submission failed. Please try again.");
        setState(STATES.FORM);
        return;
      }

      setState(STATES.SUCCESS);
    } catch (err) {
      setSubmitError("Cannot connect to server. Please try again.");
      setState(STATES.FORM);
    }
  };

  const isEmpToEmp = prefill?.payment_type_key === "emp_to_emp";
  const isOther    = prefill?.payment_type_key === "other";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: LOADING
  // ─────────────────────────────────────────────────────────────────────────
  if (state === STATES.LOADING) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Validating your resubmit link…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: INVALID / EXPIRED
  // ─────────────────────────────────────────────────────────────────────────
  if (state === STATES.INVALID) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Link Invalid or Expired</h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{errorMsg}</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Resubmit links expire after 7 days and can only be used once.
            Please contact HR if you need a new link.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: SUCCESS
  // ─────────────────────────────────────────────────────────────────────────
  if (state === STATES.SUCCESS) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Request Resubmitted</h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Your updated advance payment request has been submitted to HR for review.
              You will receive an email once a decision is made.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
            <p className="text-xs text-slate-400">Original request</p>
            <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">
              {prefill?.request_code}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            You can close this tab. A confirmation email has been sent to you.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: FORM
  // ─────────────────────────────────────────────────────────────────────────
  const isSubmitting = state === STATES.SUBMITTING;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Page header ── */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs text-indigo-600 font-medium mb-2">
            <RefreshCw size={11} />
            Resubmission Form
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Edit & Resubmit Your Request
          </h1>
          <p className="text-slate-500 text-sm">
            Update the details below and upload a new screenshot, then resubmit.
          </p>
        </div>

        {/* ── Rejection reason banner ── */}
        {prefill?.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <X size={12} className="text-red-600" />
              </div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">
                Reason for rejection
              </p>
            </div>
            <p className="text-sm text-red-700 leading-relaxed pl-8">
              {prefill.rejection_reason}
            </p>
            <div className="pl-8 flex flex-wrap gap-3 text-xs text-red-400">
              {prefill.rejected_by && <span>Rejected by: <strong className="text-red-600">{prefill.rejected_by}</strong></span>}
              {prefill.rejected_at && <span>On: <strong className="text-red-600">{fmtDate(prefill.rejected_at)}</strong></span>}
            </div>
          </div>
        )}

        {/* ── Original request info ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Original request</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Request ID",   value: prefill?.request_code },
              { label: "Payment type", value: prefill?.payment_type_label },
              { label: "Amount",       value: inr(prefill?.amount || 0) },
              { label: "Link expires", value: fmtDate(prefill?.expires_at) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

          {/* Section: Your details */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Your Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Employee ID" required>
                <input
                  type="text"
                  value={form.emp_id}
                  onChange={set("emp_id")}
                  required
                  placeholder="e.g. EMP012"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                />
              </Field>
              <Field label="Full Name" required>
                <input
                  type="text"
                  value={form.emp_name}
                  onChange={set("emp_name")}
                  required
                  placeholder="Your full name"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                />
              </Field>
              <Field label="Department" required>
                <input
                  type="text"
                  value={form.emp_dept}
                  onChange={set("emp_dept")}
                  required
                  placeholder="Your department"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                />
              </Field>
              <Field label="Email Address" hint="For confirmation email">
                <input
                  type="email"
                  value={form.emp_email}
                  onChange={set("emp_email")}
                  placeholder="your@email.com"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Section: Payment details */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              Payment Details
              <span className="text-xs font-normal text-slate-400 normal-case ml-1">
                ({prefill?.payment_type_label})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Amount (₹)" required>
                <input
                  type="number"
                  value={form.amount}
                  onChange={set("amount")}
                  required
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Reason" required>
                  <textarea
                    value={form.reason}
                    onChange={set("reason")}
                    required
                    rows={3}
                    placeholder="Why is this advance payment needed?"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                  />
                </Field>
              </div>

              {/* Emp to Emp fields */}
              {isEmpToEmp && (
                <>
                  <Field label="Recipient Employee ID" required>
                    <input
                      type="text"
                      value={form.to_emp_id}
                      onChange={set("to_emp_id")}
                      required
                      placeholder="e.g. EMP034"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                    />
                  </Field>
                  <Field label="Recipient Name" required>
                    <input
                      type="text"
                      value={form.to_emp_name}
                      onChange={set("to_emp_name")}
                      required
                      placeholder="Recipient's full name"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                    />
                  </Field>
                  <Field label="Recipient Department">
                    <input
                      type="text"
                      value={form.to_emp_dept}
                      onChange={set("to_emp_dept")}
                      placeholder="Recipient's department"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                    />
                  </Field>
                </>
              )}

              {/* External / Other fields */}
              {isOther && (
                <>
                  <Field label="Vendor / Party Name" required>
                    <input
                      type="text"
                      value={form.vendor_name}
                      onChange={set("vendor_name")}
                      required
                      placeholder="Vendor or party name"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                    />
                  </Field>
                  <Field label="Reference / Invoice No.">
                    <input
                      type="text"
                      value={form.vendor_ref}
                      onChange={set("vendor_ref")}
                      placeholder="Optional reference"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                    />
                  </Field>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Section: Documents */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
              Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FileUpload
                label="Payment screenshot"
                accept="image/*,.pdf"
                value={screenshot}
                onChange={setScreenshot}
                required
                hint="Required — clear screenshot of the payment"
              />
              <FileUpload
                label="Supporting proof"
                accept="image/*,.pdf"
                value={proof}
                onChange={setProof}
                hint="Optional — additional document"
              />
              <FileUpload
                label="Receipt"
                accept="image/*,.pdf"
                value={receipt}
                onChange={setReceipt}
                hint="Optional — payment receipt"
              />
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                       text-white font-semibold text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <RefreshCw size={15} />
                Resubmit Request
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            This link expires on{" "}
            <strong className="text-slate-600">{fmtDate(prefill?.expires_at)}</strong>
            {" "}and can only be used once.
          </p>
        </form>

      </div>
    </div>
  );
}