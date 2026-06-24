import React, { useState } from "react";
import { XCircle, Loader } from "lucide-react";

const RejectModal = ({ employee, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState("");
  const isRejoin = employee.status === "pending_rejoin";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden mx-4">
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg,#ef4444,#f97316)" }}
        />
        <div className="p-6 sm:p-8">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#fee2e2,#fecaca)" }}
          >
            <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-1">
            {isRejoin ? "Decline Rejoin Request" : "Reject Registration"}
          </h3>
          <p className="text-gray-500 text-sm text-center mb-5 sm:mb-6">
            {isRejoin ? "Declining" : "Rejecting"}{" "}
            <strong className="text-gray-900">
              {employee.first_name} {employee.last_name}
            </strong>
          </p>
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Reason for {isRejoin ? "Declining" : "Rejection"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Provide a reason (optional but recommended)..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm mb-4 sm:mb-5 resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {loading
                ? "Processing..."
                : isRejoin
                  ? "Confirm Decline"
                  : "Confirm Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
