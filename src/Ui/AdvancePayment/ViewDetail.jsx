// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { X, FileText, CheckCircle2, XCircle, Eye, ArrowRight, Calendar, Hash } from "lucide-react";
import { fmt, PAYMENT_TYPES, STATUS_CONFIG } from "../../data/content";
import { StatusBadge, PaymentTypePill, Avatar, InfoTile } from "./shared";

// ── Payment flow diagram inside modal ─────────────────────────────────────────
function FlowDiagram({ req }) {
  const pt = PAYMENT_TYPES[req.paymentType];

  const FromBox = () => (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <Avatar name={req.name} size="lg" colorKey="indigo" />
      <div className="text-center">
        <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">{req.name}</p>
        <p className="text-[10px] text-slate-400">{req.empId}</p>
      </div>
    </div>
  );

  const Arrow = () => (
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
    if (req.paymentType === "emp_to_emp") {
      return (
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <Avatar name={req.toEmpName} size="lg" colorKey="sky" />
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">{req.toEmpName}</p>
            <p className="text-[10px] text-slate-400">{req.toEmpId}</p>
          </div>
        </div>
      );
    }
    if (req.paymentType === "other") {
      return (
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: pt.lightBg }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pt.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">{req.vendorName}</p>
            <p className="text-[10px] text-slate-400">{req.vendorRef || "External"}</p>
          </div>
        </div>
      );
    }
    // org_to_emp — "Organization"
    return (
      <div className="flex flex-col items-center gap-1.5 min-w-0">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: pt.lightBg }}
        >
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

  // For org→emp, FROM is org, TO is emp
  if (req.paymentType === "org_to_emp") {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 border"
        style={{ background: pt.lightBg, borderColor: pt.borderColor }}
      >
        <ToBox />
        <Arrow />
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
      <Arrow />
      <ToBox />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ViewDetailModal({ req, onClose, onApprove, onReject }) {
  if (!req) return null;

  const pt = PAYMENT_TYPES[req.paymentType] || PAYMENT_TYPES.org_to_emp;
  const sc = STATUS_CONFIG[req.status];

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
              <p className="text-slate-400 font-mono text-xs mt-0.5">{req.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X size={17} />
          </button>
        </div>

        {/* ── Meta strip ── */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <PaymentTypePill type={req.paymentType} size="md" />
          <div className="w-px h-4 bg-slate-200" />
          <StatusBadge status={req.status} />
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={12} />
            {req.date}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Flow diagram */}
          <FlowDiagram req={req} />

          {/* Core info grid */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Request Information</p>
            <div className="grid grid-cols-2 gap-2.5">
              <InfoTile label="Request ID"  value={req.id}         mono />
              <InfoTile label="Employee ID" value={req.empId}      mono />
              <InfoTile label="Full Name"   value={req.name} />
              <InfoTile label="Department"  value={req.dept} />
              <InfoTile label="Amount"      value={fmt(req.amount)} />
              <InfoTile label="Date"        value={req.date} />
            </div>
          </div>

          {/* Recipient-specific info */}
          {req.paymentType === "emp_to_emp" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Recipient Employee</p>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoTile label="Employee ID"  value={req.toEmpId}   mono />
                <InfoTile label="Name"         value={req.toEmpName} />
                {req.toEmpDept && <InfoTile label="Department" value={req.toEmpDept} />}
              </div>
            </div>
          )}

          {req.paymentType === "other" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">External / Vendor Details</p>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoTile label="Vendor Name"   value={req.vendorName} />
                <InfoTile label="Reference No." value={req.vendorRef} mono />
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
          {req.proof && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Proof Document</p>
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-700 truncate">{req.proof}</p>
                  <p className="text-[10px] text-blue-400">Attached document</p>
                </div>
                <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shrink-0">
                  View
                </button>
              </div>
            </div>
          )}

          {/* Salary adjustment note */}
          {req.status === "approved" && req.adjustedIn && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-800">
                Amount will be deducted in the <span className="font-bold">{req.adjustedIn}</span> salary cycle.
              </p>
            </div>
          )}

          {/* Rejection note */}
          {req.status === "rejected" && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <XCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-700">This request was rejected. No funds will be disbursed.</p>
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