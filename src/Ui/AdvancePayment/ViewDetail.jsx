// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { X, FileText, CheckCircle2, XCircle, Eye } from "lucide-react";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const statusStyles = {
  pending:  { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-400"   },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-400" },
  rejected: { bg: "bg-red-50",     text: "text-red-700",     ring: "ring-red-200",     dot: "bg-red-400"     },
};

function Badge({ status }) {
  const c = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ViewDetailModal({ req, onClose, onApprove, onReject }) {
  if (!req) return null;

  const infoRows = [
    { label: "Request ID",  value: req.id,           mono: true  },
    { label: "Employee ID", value: req.empId,         mono: true  },
    { label: "Full Name",   value: req.name,          mono: false },
    { label: "Department",  value: req.dept,          mono: false },
    { label: "Amount",      value: fmt(req.amount),   mono: false },
    { label: "Date",        value: req.date,          mono: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Eye size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Request Details</h3>
              <p className="text-slate-300 text-xs mt-0.5 font-mono">{req.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* ── Employee avatar strip ── */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
            {req.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{req.name}</p>
            <p className="text-xs text-slate-400">{req.empId} · {req.dept}</p>
          </div>
          <div className="ml-auto">
            <Badge status={req.status} />
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {infoRows.map(({ label, value, mono }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-sm font-semibold text-slate-800 ${mono ? "font-mono" : ""}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Reason</p>
            <p className="text-sm font-semibold text-slate-800">{req.reason}</p>
          </div>

          {/* Proof */}
          {req.proof && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Proof Document</p>
                <p className="text-sm font-semibold text-blue-700">{req.proof}</p>
              </div>
              <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                View
              </button>
            </div>
          )}

          {/* Salary adjustment note (approved) */}
          {req.status === "approved" && req.adjustedIn && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <p className="text-xs text-emerald-800">
                <span className="font-bold">Salary Adjustment:</span> Amount will be deducted in{" "}
                <span className="font-bold">{req.adjustedIn}</span> salary cycle.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 flex gap-3">
          {req.status === "pending" ? (
            <>
              <button
                onClick={() => onReject(req.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                onClick={() => onApprove(req.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 size={16} /> Approve
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