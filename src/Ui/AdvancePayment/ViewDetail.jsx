// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal.jsx
// Supports both backend snake_case fields and normalized camelCase fields
// ─────────────────────────────────────────────────────────────────────────────
import { X, FileText, CheckCircle2, XCircle, Eye, ArrowRight, Calendar } from "lucide-react";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// ─── Payment type config (inline so modal has no external data dependency) ───
const PAYMENT_TYPES = {
  org_to_emp: {
    label: "Org → Employee",
    color: "#6366F1",
    lightBg: "#EEF2FF",
    borderColor: "#C7D2FE",
    textColor: "#4338CA",
  },
  emp_to_emp: {
    label: "Employee → Employee",
    color: "#0EA5E9",
    lightBg: "#E0F2FE",
    borderColor: "#BAE6FD",
    textColor: "#0369A1",
  },
  other: {
    label: "External / Vendor",
    color: "#8B5CF6",
    lightBg: "#F5F3FF",
    borderColor: "#DDD6FE",
    textColor: "#6D28D9",
  },
};

const STATUS_CONFIG = {
  pending:  { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-400",   label: "Pending"  },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500", label: "Approved" },
  rejected: { bg: "bg-red-50",     text: "text-red-700",     ring: "ring-red-200",     dot: "bg-red-400",     label: "Rejected" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
      {sc.label}
    </span>
  );
}

function PaymentTypePill({ type }) {
  const pt = PAYMENT_TYPES[type] || PAYMENT_TYPES.org_to_emp;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: pt.lightBg, color: pt.textColor, border: `1px solid ${pt.borderColor}` }}
    >
      {pt.label}
    </span>
  );
}

function Avatar({ name = "", size = "md", colorKey = "indigo" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const sizeMap = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-11 h-11 text-sm" };
  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-600",
    sky:    "bg-sky-100 text-sky-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return (
    <div className={`rounded-full flex items-center justify-center font-bold shrink-0 ${sizeMap[size]} ${colorMap[colorKey] || colorMap.indigo}`}>
      {initials || "?"}
    </div>
  );
}

function InfoTile({ label, value, mono = false }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold text-slate-700 truncate ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-slate-300">—</span>}
      </p>
    </div>
  );
}

// ─── Payment flow diagram ─────────────────────────────────────────────────────
function FlowDiagram({ req, pt }) {
  // Support both camelCase (normalized) and snake_case (raw backend)
  const paymentType = req.paymentType || req.payment_type_key;
  const empName     = req.name        || req.emp_name;
  const empId       = req.empId       || req.emp_id;
  const toEmpName   = req.toEmpName   || req.to_emp_name;
  const toEmpId     = req.toEmpId     || req.to_emp_id;
  const vendorName  = req.vendorName  || req.vendor_name;
  const vendorRef   = req.vendorRef   || req.vendor_ref;

  const FromBox = () => (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <Avatar name={empName} size="lg" colorKey="indigo" />
      <div className="text-center">
        <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">{empName}</p>
        <p className="text-[10px] text-slate-400">{empId}</p>
      </div>
    </div>
  );

  const AmountArrow = () => (
    <div className="flex flex-col items-center gap-1 shrink-0 px-2">
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
        style={{ background: pt.lightBg, color: pt.textColor }}
      >
        {fmt(req.amount)}
      </div>
      <div className="flex items-center" style={{ color: pt.color }}>
        <div className="w-10 h-0.5" style={{ background: pt.color }} />
        <ArrowRight size={14} />
      </div>
    </div>
  );

  const ToBox = () => {
    if (paymentType === "emp_to_emp") {
      return (
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <Avatar name={toEmpName} size="lg" colorKey="sky" />
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">{toEmpName}</p>
            <p className="text-[10px] text-slate-400">{toEmpId}</p>
          </div>
        </div>
      );
    }
    if (paymentType === "other") {
      return (
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: pt.lightBg }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pt.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">{vendorName}</p>
            <p className="text-[10px] text-slate-400">{vendorRef || "External"}</p>
          </div>
        </div>
      );
    }
    // org_to_emp — "Organization"
    return (
      <div className="flex flex-col items-center gap-1.5 min-w-0">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: pt.lightBg }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pt.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="9" height="14" rx="1.5"/><path d="M16 3h5v18h-5"/><line x1="6" y1="11" x2="7" y2="11"/><line x1="6" y1="15" x2="7" y2="15"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-700">Organization</p>
          <p className="text-[10px] text-slate-400">Company Account</p>
        </div>
      </div>
    );
  };

  // org→emp: FROM = org, TO = emp (reversed visually)
  if (paymentType === "org_to_emp") {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 border"
        style={{ background: pt.lightBg, borderColor: pt.borderColor }}
      >
        <ToBox />
        <AmountArrow />
        <FromBox />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 border"
      style={{ background: pt.lightBg, borderColor: pt.borderColor }}
    >
      <FromBox />
      <AmountArrow />
      <ToBox />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ViewDetailModal({ req, onClose, onApprove, onReject }) {
  if (!req) return null;

  // Support both normalized (camelCase) and raw (snake_case) backend fields
  const paymentType = req.paymentType || req.payment_type_key || "org_to_emp";
  const empName     = req.name        || req.emp_name;
  const empId       = req.empId       || req.emp_id;
  const dept        = req.dept        || req.emp_dept;
  const date        = req.date        || req.request_date?.slice(0, 10);
  const toEmpName   = req.toEmpName   || req.to_emp_name;
  const toEmpId     = req.toEmpId     || req.to_emp_id;
  const toEmpDept   = req.toEmpDept   || req.to_emp_dept;
  const vendorName  = req.vendorName  || req.vendor_name;
  const vendorRef   = req.vendorRef   || req.vendor_ref;
  const adjustedIn  = req.adjustedIn  || req.adjusted_in;
  const proof       = req.proof       || req.attachments?.find((a) => a.role === "proof")?.name;

  const pt = PAYMENT_TYPES[paymentType] || PAYMENT_TYPES.org_to_emp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
              <Eye size={17} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Request Details</h3>
              <p className="text-slate-400 font-mono text-xs mt-0.5">{req.request_code || req.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Meta strip ── */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-3 shrink-0 flex-wrap">
          <PaymentTypePill type={paymentType} />
          <div className="w-px h-4 bg-slate-200" />
          <StatusBadge status={req.status} />
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={12} />
            {date}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Flow diagram */}
          <FlowDiagram req={req} pt={pt} />

          {/* Core info grid */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Request Information
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <InfoTile label="Request ID"  value={req.request_code || req.id} mono />
              <InfoTile label="Employee ID" value={empId} mono />
              <InfoTile label="Full Name"   value={empName} />
              <InfoTile label="Department"  value={dept} />
              <InfoTile label="Amount"      value={fmt(req.amount)} />
              <InfoTile label="Date"        value={date} />
            </div>
          </div>

          {/* Recipient employee info */}
          {paymentType === "emp_to_emp" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Recipient Employee
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoTile label="Employee ID" value={toEmpId}   mono />
                <InfoTile label="Name"        value={toEmpName} />
                {toEmpDept && <InfoTile label="Department" value={toEmpDept} />}
              </div>
            </div>
          )}

          {/* Vendor info */}
          {paymentType === "other" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                External / Vendor Details
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoTile label="Vendor Name"   value={vendorName} />
                <InfoTile label="Reference No." value={vendorRef} mono />
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Reason</p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <p className="text-sm text-slate-700 leading-relaxed">{req.reason}</p>
            </div>
          </div>

          {/* Proof document */}
          {proof && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Proof Document
              </p>
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-700 truncate">{proof}</p>
                  <p className="text-[10px] text-blue-400">Attached document</p>
                </div>
                <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shrink-0">
                  View
                </button>
              </div>
            </div>
          )}

          {/* Approved — salary adjustment note */}
          {req.status === "approved" && adjustedIn && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-800">
                Amount will be deducted in the{" "}
                <span className="font-bold">{adjustedIn}</span> salary cycle.
              </p>
            </div>
          )}

          {/* Rejected note */}
          {req.status === "rejected" && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <XCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-700">
                {req.rejection_reason
                  ? <>Rejection reason: <span className="font-semibold">{req.rejection_reason}</span></>
                  : "This request was rejected. No funds will be disbursed."
                }
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3 shrink-0">
          {req.status === "pending" ? (
            <>
              <button
                onClick={() => onReject(req.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle size={15} />
                Reject
              </button>
              <button
                onClick={() => onApprove(req.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
              >
                <CheckCircle2 size={15} />
                Approve
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}