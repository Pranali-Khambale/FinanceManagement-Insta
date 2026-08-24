// status select + normalizeStatus()
import { Loader, RefreshCw, Clock } from "lucide-react";

// ── Normalize any raw DB status string into a consistent UI key ───────────────
export function normalizeStatus(status) {
  const s = status?.toLowerCase();
  if (s === "active" || s === "approved")          return "Active";
  if (s === "pending")                             return "Pending";
  if (s === "pending_rejoin")                      return "PendingRejoin";
  if (s === "inactive" || s === "rejected")        return "Inactive";
  if (s === "blacklist" || s === "blacklisted")    return "Blacklist";
  return status || "Unknown";
}

const statusStyles = {
  Active:       "bg-green-50  text-green-700  border-green-300",
  Inactive:     "bg-red-50    text-red-700    border-red-300",
  Blacklist:    "bg-amber-50  text-amber-700  border-amber-300",
  Pending:      "bg-gray-100  text-gray-600   border-gray-300",
  PendingRejoin:"bg-indigo-50 text-indigo-700 border-indigo-300",
};

const StatusDropdown = ({ emp, onStatusChange, updatingId }) => {
  const currentStatus = normalizeStatus(emp.status);
  const isUpdating    = updatingId === (emp.id || emp.employee_id);
  const isPending     = currentStatus === "Pending" || currentStatus === "PendingRejoin";

  if (isPending) {
    return (
      <span
        className={`inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border whitespace-nowrap ${
          currentStatus === "PendingRejoin" ? statusStyles.PendingRejoin : statusStyles.Pending
        }`}
      >
        {currentStatus === "PendingRejoin" ? (
          <><RefreshCw className="w-3 h-3 flex-shrink-0" /> <span className="hidden sm:inline">Pending Rejoin</span><span className="sm:hidden">Rejoin</span></>
        ) : (
          <><Clock className="w-3 h-3 flex-shrink-0" /> <span className="hidden sm:inline">Pending Review</span><span className="sm:hidden">Pending</span></>
        )}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1.5 w-full sm:w-auto">
      <select
        value={currentStatus}
        disabled={isUpdating}
        onChange={(e) => onStatusChange(emp, e.target.value)}
        className={`appearance-none w-full sm:w-auto text-[11px] sm:text-xs font-semibold pl-2.5 sm:px-3 py-1.5 pr-6 sm:pr-7 rounded-lg border cursor-pointer outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed min-h-[34px] sm:min-h-0 ${statusStyles[currentStatus] || statusStyles.Pending}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Blacklist">Blacklist</option>
      </select>
      {isUpdating && (
        <Loader className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      )}
    </div>
  );
};

export default StatusDropdown;