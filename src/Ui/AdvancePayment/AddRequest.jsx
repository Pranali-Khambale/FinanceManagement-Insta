// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/AddRequestModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from "react";
import {
  X, Upload, Plus, ArrowRight, CheckCircle2,
  FileImage, Receipt, Building2, User, Globe,
  Printer, Download, Calendar, Hash, IndianRupee,
  Stamp, AlertCircle,
} from "lucide-react";
import { PAYMENT_TYPES } from "../../data/content";

// ─── Payment Type Card ────────────────────────────────────────────────────────
function PaymentTypeCard({ pt, selected, onClick }) {
  const icons = {
    org_to_emp: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="9" height="14" rx="1.5"/>
        <path d="M16 3h5v18h-5"/>
        <line x1="6" y1="11" x2="7" y2="11"/>
        <line x1="6" y1="15" x2="7" y2="15"/>
      </svg>
    ),
    emp_to_emp: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    other: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full text-left rounded-xl border-2 p-3.5 transition-all duration-150 focus:outline-none"
      style={{
        borderColor: selected ? pt.color : "#e2e8f0",
        background:  selected ? pt.lightBg : "#fff",
        boxShadow:   selected ? `0 0 0 3px ${pt.color}22` : "none",
      }}
    >
      {selected && (
        <span
          className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: pt.color }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
      <span
        className="flex items-center justify-center w-9 h-9 rounded-xl mb-2"
        style={{ background: selected ? pt.color : "#f1f5f9", color: selected ? "#fff" : pt.color }}
      >
        {icons[pt.key]}
      </span>
      <p className="text-xs font-bold leading-tight" style={{ color: selected ? pt.textColor : "#334155" }}>
        {pt.label}
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{pt.desc}</p>
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/>{error}</p>}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white transition-all placeholder-slate-300
        ${error ? "border-red-300 bg-red-50/40 focus:ring-red-200" : "border-slate-200 hover:border-slate-300"}`}
    />
  );
}

// ─── Receipt Row ──────────────────────────────────────────────────────────────
function ReceiptRow({ label, value, bold, accent, color }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-dashed border-slate-100 last:border-0 ${bold ? "font-bold" : ""}`}>
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={`text-sm ${bold ? "font-bold" : "font-medium"} ${accent ? "font-bold text-lg" : ""}`}
        style={{ color: accent ? color : "#1e293b" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Payment Receipt Modal ────────────────────────────────────────────────────
function PaymentReceipt({ data, pt, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Payment Receipt – ${data.id}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .sub { color: #64748b; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; font-size: 13px; border-bottom: 1px dashed #e2e8f0; }
        td:last-child { text-align: right; font-weight: 600; }
        .amount { font-size: 22px; font-weight: 800; color: ${pt.color}; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; background: #d1fae5; color: #065f46; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>Payment Advance Receipt</h1>
      <div class="sub">Receipt ID: ${data.id} &nbsp;|&nbsp; Date: ${data.date}</div>
      ${content}
      <p style="margin-top:24px;font-size:11px;color:#94a3b8;">This is a system-generated receipt. No signature required.</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const typeLabel = { org_to_emp: "Organisation → Employee", emp_to_emp: "Employee → Employee", other: "External / Vendor" };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">

        {/* Receipt Header */}
        <div
          className="relative px-6 py-5 shrink-0 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${pt.color}, ${pt.color}bb)` }}
        >
          {/* decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10" style={{ background: "#fff" }} />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10" style={{ background: "#fff" }} />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={18} className="text-white/80" />
                <p className="text-white/80 text-xs font-semibold tracking-wider uppercase">Payment Receipt</p>
              </div>
              <h3 className="text-white font-extrabold text-xl tracking-tight">₹ {Number(data.amount).toLocaleString("en-IN")}</h3>
              <p className="text-white/70 text-xs mt-0.5">{data.id} · {data.date}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                title="Print"
              >
                <Printer size={14} className="text-white" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          </div>

          {/* Status badge */}
          <div className="relative mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Pending Approval
            </span>
          </div>
        </div>

        {/* Receipt Body */}
        <div ref={receiptRef} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Requester */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Requester Details</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-0">
              <ReceiptRow label="Employee ID"  value={data.empId}   color={pt.color} />
              <ReceiptRow label="Name"         value={data.name}    color={pt.color} />
              <ReceiptRow label="Department"   value={data.dept}    color={pt.color} />
            </div>
          </div>

          {/* Recipient – emp_to_emp */}
          {data.paymentType === "emp_to_emp" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recipient Employee</p>
              <div className="bg-slate-50 rounded-xl p-3 space-y-0">
                <ReceiptRow label="Employee ID"  value={data.toEmpId}   color={pt.color} />
                <ReceiptRow label="Name"         value={data.toEmpName} color={pt.color} />
                {data.toEmpDept && <ReceiptRow label="Department" value={data.toEmpDept} color={pt.color} />}
              </div>
            </div>
          )}

          {/* Recipient – other */}
          {data.paymentType === "other" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vendor / External</p>
              <div className="bg-slate-50 rounded-xl p-3 space-y-0">
                <ReceiptRow label="Vendor Name"   value={data.vendorName} color={pt.color} />
                {data.vendorRef && <ReceiptRow label="Invoice / Ref" value={data.vendorRef} color={pt.color} />}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Information</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-0">
              <ReceiptRow label="Request ID"    value={data.id}                  color={pt.color} />
              <ReceiptRow label="Date"          value={data.date}                color={pt.color} />
              <ReceiptRow label="Payment Type"  value={typeLabel[data.paymentType]} color={pt.color} />
              <ReceiptRow label="Amount"        value={`₹ ${Number(data.amount).toLocaleString("en-IN")}`} bold accent color={pt.color} />
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Reason</p>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-sm text-slate-700 leading-relaxed">{data.reason}</p>
            </div>
          </div>

          {/* Attached screenshot */}
          {data.screenshot && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Screenshot</p>
              <div
                className="flex items-center gap-3 border rounded-xl p-3"
                style={{ borderColor: pt.color + "44", background: pt.lightBg }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: pt.color }}
                >
                  <FileImage size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: pt.textColor }}>{data.screenshot}</p>
                  <p className="text-[10px] text-slate-400">Payment screenshot attached</p>
                </div>
                <CheckCircle2 size={16} style={{ color: pt.color }} className="shrink-0" />
              </div>
            </div>
          )}

          {/* Proof document (optional) */}
          {data.proof && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Supporting Document</p>
              <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-200">
                  <Upload size={15} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-slate-700">{data.proof}</p>
                  <p className="text-[10px] text-slate-400">Supporting proof document</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <p className="text-[10px] text-slate-400 text-center pt-1 pb-2">
            This is a system-generated receipt. No signature required.
          </p>
        </div>

        {/* Receipt Footer */}
        <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm"
            style={{ background: `linear-gradient(135deg, ${pt.color}, ${pt.color}cc)` }}
          >
            <Printer size={15} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddRequestModal({ onClose, onAdd }) {
  const [step,       setStep]      = useState(1); // 1=type, 2=form, 3=receipt
  const [ptKey,      setPtKey]     = useState("org_to_emp");
  const [form,       setForm]      = useState({
    empId: "", name: "", dept: "", amount: "", reason: "",
    toEmpId: "", toEmpName: "", toEmpDept: "",
    vendorName: "", vendorRef: "",
  });
  const [proofName,      setProof]      = useState("");
  const [screenshotName, setScreenshot] = useState(""); // MANDATORY
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [errors,     setErrors]    = useState({});
  const [submitted,  setSubmitted] = useState(null); // holds submitted data for receipt

  const pt = PAYMENT_TYPES[ptKey];

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const handleProof = (e) => {
    const f = e.target.files[0];
    if (f) setProof(f.name);
  };

  const handleScreenshot = (e) => {
    const f = e.target.files[0];
    if (f) {
      setScreenshot(f.name);
      setScreenshotFile(f);
      setErrors((er) => ({ ...er, screenshot: "" }));
      // Preview
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshotPreview(ev.target.result);
      reader.readAsDataURL(f);
    }
  };

  const validate = () => {
    const er = {};
    if (!form.empId)                        er.empId      = "Required";
    if (!form.name)                         er.name       = "Required";
    if (!form.dept)                         er.dept       = "Required";
    if (!form.amount || isNaN(form.amount)) er.amount     = "Enter a valid amount";
    if (!form.reason)                       er.reason     = "Required";
    if (!screenshotName)                    er.screenshot = "Payment screenshot is mandatory";
    if (ptKey === "emp_to_emp") {
      if (!form.toEmpId)   er.toEmpId   = "Required";
      if (!form.toEmpName) er.toEmpName = "Required";
    }
    if (ptKey === "other") {
      if (!form.vendorName) er.vendorName = "Required";
    }
    return er;
  };

  const submit = () => {
    const er = validate();
    if (Object.keys(er).length) { setErrors(er); return; }

    const base = {
      empId: form.empId, name: form.name, dept: form.dept,
      amount: form.amount, reason: form.reason,
      proof:      proofName      || null,
      screenshot: screenshotName,
      id:     "ADV-" + Date.now(),
      date:   new Date().toISOString().slice(0, 10),
      status: "pending",
      paymentType: ptKey,
    };

    if (ptKey === "emp_to_emp") {
      base.toEmpId   = form.toEmpId;
      base.toEmpName = form.toEmpName;
      base.toEmpDept = form.toEmpDept;
    }
    if (ptKey === "other") {
      base.vendorName = form.vendorName;
      base.vendorRef  = form.vendorRef;
    }

    onAdd(base);
    setSubmitted(base);
    setStep(3); // show receipt
  };

  const steps = ["Select Type", "Fill Details", "Receipt"];

  // ── If receipt step ──────────────────────────────────────────────────────────
  if (step === 3 && submitted) {
    return (
      <PaymentReceipt
        data={submitted}
        pt={pt}
        onClose={onClose}
      />
    );
  }

  // ── Main Modal ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header with blur background ── */}
        <div
          className="relative px-6 py-5 flex items-start justify-between shrink-0 overflow-hidden"
        >
          {/* Blurred gradient backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${pt.color}ee, ${pt.color}99)`,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          />
          {/* Decorative blurred blobs */}
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-30"
            style={{ background: "#fff" }}
          />
          <div
            className="absolute -bottom-6 left-6 w-20 h-20 rounded-full blur-xl opacity-20"
            style={{ background: "#fff" }}
          />

          {/* Content (above blur) */}
          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">New Advance Request</h3>
              <p className="text-white/70 text-xs mt-0.5">
                {step === 1 ? "Select payment type to continue" : `Type: ${pt.label}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/15 backdrop-blur-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Step indicator ── */}
        <div className="px-6 pt-4 pb-0 shrink-0 flex items-center gap-2">
          {steps.map((label, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    background: done ? pt.color : active ? pt.color : "#e2e8f0",
                    color: done || active ? "#fff" : "#94a3b8",
                  }}
                >
                  {done ? <CheckCircle2 size={13} /> : idx}
                </div>
                <span className={`text-xs font-semibold ${active ? "text-slate-700" : done ? "text-slate-500" : "text-slate-350"}`}>
                  {label}
                </span>
                {i < steps.length - 1 && <div className="w-5 h-px bg-slate-200 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="grid grid-cols-3 gap-3">
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

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">

              {/* Requester fields */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {ptKey === "emp_to_emp" ? "Requesting Employee" : "Employee Details"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Employee ID" required error={errors.empId}>
                    <Input placeholder="EMP001" value={form.empId} onChange={set("empId")} error={errors.empId} />
                  </Field>
                  <Field label="Full Name" required error={errors.name}>
                    <Input placeholder="John Doe" value={form.name} onChange={set("name")} error={errors.name} />
                  </Field>
                  <Field label="Department" required error={errors.dept}>
                    <Input placeholder="Engineering" value={form.dept} onChange={set("dept")} error={errors.dept} />
                  </Field>
                  <Field label="Amount (₹)" required error={errors.amount}>
                    <Input type="number" placeholder="10000" value={form.amount} onChange={set("amount")} error={errors.amount} />
                  </Field>
                </div>
              </div>

              {/* Recipient: emp_to_emp */}
              {ptKey === "emp_to_emp" && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-slate-100" />
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: pt.lightBg, color: pt.textColor }}>
                      <ArrowRight size={11} /> Recipient Employee
                    </div>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Recipient Employee ID" required error={errors.toEmpId}>
                      <Input placeholder="EMP002" value={form.toEmpId} onChange={set("toEmpId")} error={errors.toEmpId} />
                    </Field>
                    <Field label="Recipient Name" required error={errors.toEmpName}>
                      <Input placeholder="Jane Smith" value={form.toEmpName} onChange={set("toEmpName")} error={errors.toEmpName} />
                    </Field>
                    <Field label="Recipient Department" error={errors.toEmpDept}>
                      <Input placeholder="Design" value={form.toEmpDept} onChange={set("toEmpDept")} error={errors.toEmpDept} />
                    </Field>
                  </div>
                </div>
              )}

              {/* Recipient: other */}
              {ptKey === "other" && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-slate-100" />
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: pt.lightBg, color: pt.textColor }}>
                      <ArrowRight size={11} /> Vendor / External Details
                    </div>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Vendor / Party Name" required error={errors.vendorName}>
                      <Input placeholder="LexPro LLP" value={form.vendorName} onChange={set("vendorName")} error={errors.vendorName} />
                    </Field>
                    <Field label="Reference / Invoice No." error={errors.vendorRef}>
                      <Input placeholder="INV-001" value={form.vendorRef} onChange={set("vendorRef")} error={errors.vendorRef} />
                    </Field>
                  </div>
                </div>
              )}

              {/* Reason */}
              <Field label="Reason" required error={errors.reason}>
                <textarea
                  rows={3}
                  placeholder="Describe the reason for this advance request..."
                  value={form.reason}
                  onChange={set("reason")}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none transition-all placeholder-slate-300
                    ${errors.reason ? "border-red-300 bg-red-50/40" : "border-slate-200 hover:border-slate-300"}`}
                />
                {errors.reason && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/>{errors.reason}</p>}
              </Field>

              {/* ── PAYMENT SCREENSHOT (MANDATORY) ── */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  Payment Screenshot
                  <span className="text-red-400">*</span>
                  <span
                    className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: pt.lightBg, color: pt.textColor }}
                  >
                    Mandatory
                  </span>
                </p>

                <label
                  className={`relative flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all group
                    ${errors.screenshot ? "border-red-300 bg-red-50/30" : screenshotName ? "" : "hover:border-indigo-300 hover:bg-indigo-50/20"}`}
                  style={{
                    borderColor: errors.screenshot ? undefined : screenshotName ? pt.color : undefined,
                    borderStyle: screenshotName ? "solid" : "dashed",
                    background: screenshotName ? pt.lightBg : undefined,
                  }}
                >
                  {/* Preview thumbnail */}
                  {screenshotPreview ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 shadow-sm" style={{ borderColor: pt.color + "44" }}>
                      <img src={screenshotPreview} alt="screenshot preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-dashed transition-all"
                      style={{
                        borderColor: errors.screenshot ? "#fca5a5" : "#cbd5e1",
                        background: errors.screenshot ? "#fff0f0" : "#f8fafc",
                      }}
                    >
                      <FileImage size={20} style={{ color: errors.screenshot ? "#ef4444" : "#94a3b8" }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {screenshotName ? (
                      <>
                        <p className="text-sm font-bold truncate" style={{ color: pt.textColor }}>{screenshotName}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 size={11} style={{ color: pt.color }} />
                          Payment screenshot attached
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-600">Upload Payment Screenshot</p>
                        <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, JPEG · Required to submit</p>
                      </>
                    )}
                  </div>

                  {screenshotName ? (
                    <CheckCircle2 size={20} style={{ color: pt.color }} className="shrink-0" />
                  ) : (
                    <div
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all group-hover:shadow-sm"
                      style={{ borderColor: pt.color + "44", color: pt.color, background: "#fff" }}
                    >
                      <Upload size={12} />
                      Browse
                    </div>
                  )}

                  <input type="file" accept=".png,.jpg,.jpeg" onChange={handleScreenshot} className="hidden" />
                </label>

                {errors.screenshot && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} />{errors.screenshot}
                  </p>
                )}
              </div>

              {/* ── Supporting Document (Optional) ── */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">
                  Supporting Document
                  <span className="ml-2 text-[10px] text-slate-400 font-normal">Optional</span>
                </p>
                <label
                  className="flex items-center gap-4 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50/20"
                  style={{ borderColor: proofName ? pt.color : "#e2e8f0" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: proofName ? pt.lightBg : "#f8fafc" }}
                  >
                    <Upload size={17} style={{ color: proofName ? pt.color : "#94a3b8" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {proofName ? (
                      <>
                        <p className="text-sm font-semibold truncate" style={{ color: pt.color }}>{proofName}</p>
                        <p className="text-xs text-slate-400">Proof document attached</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-500">Upload Proof Document</p>
                        <p className="text-xs text-slate-400">PNG, JPG, PDF · Optional</p>
                      </>
                    )}
                  </div>
                  <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={handleProof} className="hidden" />
                </label>
              </div>

            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 pb-6 pt-3 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm"
              style={{ background: `linear-gradient(135deg, ${pt.color}, ${pt.color}cc)` }}
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={submit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm"
                style={{ background: `linear-gradient(135deg, ${pt.color}, ${pt.color}cc)` }}
              >
                <CheckCircle2 size={15} />
                Submit &amp; View Receipt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}