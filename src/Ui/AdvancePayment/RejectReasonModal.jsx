// FILE: src/Ui/AdvancePayment/RejectReasonModal.jsx
import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const QUICK_REASONS = [
  "Insufficient supporting documentation provided.",
  "Amount exceeds the approved advance limit for this category.",
  "Duplicate request — a similar request is already pending or approved.",
  "Policy violation — this type of payment is not covered under the advance policy.",
  "Please resubmit with a clearer payment screenshot.",
];

export default function RejectReasonModal({ request, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(request.id, reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-red-700 px-6 py-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-white font-semibold text-base">Reject request</h2>
            <p className="text-red-200 text-xs mt-0.5">
              This action cannot be undone. The employee will be notified by email.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-200 hover:text-white transition-colors mt-0.5 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Request pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-700">{request.request_code}</span>
            <span>·</span>
            <span>{request.emp_name}</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">
              ₹{Number(request.amount).toLocaleString("en-IN")}
            </span>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              placeholder="Explain why this request is being rejected…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 resize-none
                         text-slate-800 placeholder-slate-300 focus:outline-none
                         focus:ring-2 focus:ring-red-200 focus:border-red-300 transition"
            />
            <p className="text-right text-xs text-slate-300 mt-1">{reason.length} / 500</p>
          </div>

          {/* Quick reasons */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Quick reasons</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    reason === r
                      ? "bg-red-50 border-red-300 text-red-700 font-medium"
                      : "bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                  }`}
                >
                  {r.split("—")[0].trim().replace(/\.$/, "")}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              A rejection email will be sent to the employee with this reason included.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-slate-600 border border-slate-200
                       bg-white hover:bg-slate-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white
                       bg-red-700 hover:bg-red-800 disabled:opacity-40
                       disabled:cursor-not-allowed transition"
          >
            {loading ? "Rejecting…" : "Reject request"}
          </button>
        </div>
      </div>
    </div>
  );
}