//  blacklist/deactivate reason modal
import { useState } from "react";

const StatusReasonModal = ({ targetStatus, employeeName, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const isBlacklist = targetStatus === "Blacklist";

  const config = isBlacklist
    ? {
        icon: "🚫",
        headerBg: "bg-red-600",
        label: "Reason for Blacklisting",
        placeholder: "e.g. Policy violation, misconduct, fraud…",
        btnClass: "bg-red-600 hover:bg-red-700",
        defaultReason: "Account blacklisted due to a policy violation.",
      }
    : {
        icon: "⚠️",
        headerBg: "bg-amber-500",
        label: "Reason for Deactivation",
        placeholder: "e.g. Resigned, contract ended, on leave…",
        btnClass: "bg-amber-500 hover:bg-amber-600",
        defaultReason: "Account deactivated by HR.",
      };

  return (
    <div className="fixed inset-0 z-[9999] backdrop-blur-sm bg-black/40 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className={`${config.headerBg} px-4 sm:px-6 py-4 flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">{config.icon}</span>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm sm:text-base">
                Mark as {targetStatus}
              </h3>
              <p className="text-white/80 text-xs mt-0.5 truncate">{employeeName}</p>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {config.label}{" "}
            <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={config.placeholder}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm text-gray-700 transition-all"
          />
          <p className="text-xs text-gray-400 mt-2">
            This reason will be included in the notification email sent to the employee.
          </p>
        </div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end flex-shrink-0">
          <button
            onClick={onCancel}
            className="order-2 sm:order-1 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || config.defaultReason)}
            className={`order-1 sm:order-2 px-5 py-2.5 ${config.btnClass} text-white rounded-xl text-sm font-semibold transition-colors w-full sm:w-auto`}
          >
            Confirm &amp; Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusReasonModal;