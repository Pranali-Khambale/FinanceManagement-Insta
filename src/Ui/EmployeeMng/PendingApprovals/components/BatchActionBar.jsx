import React, { useState } from "react";
import { Loader, CheckCheck, XCircle } from "lucide-react";

const BatchActionBar = ({
  docs,
  onAcceptAll,
  onRejectAll,
  accepting,
  rejecting,
}) => {
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [reason, setReason] = useState("");

  const pendingCount = docs.filter(
    (d) => !d.reviewed && d.status !== "accepted" && d.status !== "rejected",
  ).length;
  const allDone = pendingCount === 0 && docs.length > 0;

  if (allDone) return null;

  const handleRejectConfirm = () => {
    onRejectAll(reason);
    setShowRejectBox(false);
    setReason("");
  };

  return (
    <div
      className="rounded-xl border mb-3 overflow-hidden"
      style={{
        background: "linear-gradient(90deg,#f8fafc,#f1f5f9)",
        borderColor: "#e2e8f0",
      }}
    >
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <p className="text-xs font-bold text-gray-700 truncate">
            {pendingCount} doc{pendingCount !== 1 ? "s" : ""} pending
          </p>
          <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
            {docs.length} submitted
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={onAcceptAll}
            disabled={accepting || rejecting}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50 shadow-sm hover:shadow-md active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)" }}
          >
            {accepting ? (
              <Loader className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
            <span>Accept All</span>
          </button>
          <button
            onClick={() => setShowRejectBox((p) => !p)}
            disabled={accepting || rejecting}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 text-xs font-bold disabled:opacity-50"
          >
            <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{showRejectBox ? "Cancel" : "Reject All"}</span>
          </button>
        </div>
      </div>

      {showRejectBox && (
        <div
          className="px-3 sm:px-4 pb-4 border-t border-red-100"
          style={{ background: "#fff5f5" }}
        >
          <p className="text-xs font-semibold text-red-700 mb-2 mt-3">
            Reason for rejecting all{" "}
            <span className="text-red-400 font-normal">(optional)</span>
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Documents are blurry, wrong files uploaded…"
            className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-xs text-gray-800 resize-none outline-none focus:border-red-400 mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowRejectBox(false);
                setReason("");
              }}
              disabled={rejecting}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={rejecting}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
            >
              {rejecting ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              Confirm Reject All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchActionBar;
